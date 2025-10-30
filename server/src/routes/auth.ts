import { Router, type Request, type Response } from "express"
import { z } from "zod"
import { prisma } from "../db"
import { hashPassword, verifyPassword } from "../utils/password"
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwt"
import { requireAuth } from "../middleware/auth"
import type { AuthenticatedRequest } from "../types"
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from "../utils/email"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(3),
  age: z.number().int().min(10).max(100).optional(),
  educationalInstitution: z.string().optional(),
  primaryRole: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6), // 6-digit format
})

const passwordResetRequestSchema = z.object({
  email: z.string().email(),
})

const passwordResetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6), // 6-digit format
  newPassword: z.string().min(8),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const router = Router()

// Store verification codes in memory (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: Date; type: 'verification' | 'password-reset'; attempts: number }>()

// Очистка истекших кодов каждые 10 минут
setInterval(() => {
  const now = new Date()
  for (const [email, data] of verificationCodes.entries()) {
    if (data.expiresAt < now) {
      verificationCodes.delete(email)
    }
  }
}, 10 * 60 * 1000)

const DEV_AUTH = process.env.DEV_AUTH === "1"

if (DEV_AUTH) {
  router.post("/login", async (req, res) => {
    const { email, password } = (req.body || {}) as { email?: string; password?: string }
    if (email === "1" && password === "1") {
      const accessToken = signAccessToken("dev-admin", "ADMIN")
      const refreshToken = signRefreshToken("dev-admin", "ADMIN")
      return res.json({
        accessToken,
        refreshToken,
        user: {
          id: "dev-admin",
          email: "admin@dev.local",
          role: "ADMIN",
          fullName: "Dev Admin",
          xp: 0,
        },
      })
    }
    return res.status(401).json({ error: "Invalid credentials" })
  })

  router.post("/refresh", async (req, res) => {
    const { refreshToken } = (req.body || {}) as { refreshToken?: string }
    if (!refreshToken) return res.status(400).json({ error: "Missing refresh token" })
    try {
      const payload = verifyToken(refreshToken)
      const accessToken = signAccessToken(payload.sub, payload.role)
      const newRefreshToken = signRefreshToken(payload.sub, payload.role)
      return res.json({ accessToken, refreshToken: newRefreshToken })
    } catch {
      return res.status(401).json({ error: "Invalid refresh token" })
    }
  })

  router.post("/logout", async (_req, res) => {
    return res.json({ success: true })
  })

  router.get("/me", requireAuth, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" })
    return res.json({
      id: "dev-admin",
      email: "admin@dev.local",
      role: "ADMIN",
      fullName: "Dev Admin",
      xp: 0,
      profile: null,
    })
  })
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, password, fullName, age, educationalInstitution, primaryRole } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: "Email already registered" })

  const passwordHash = await hashPassword(password)
  const anyAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  const isBootstrapAdmin = !anyAdmin
  const isSpecialAdmin = email.trim().toLowerCase() === "ch.qynon@gmail.com"

  // Create user but don't automatically log them in
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      age: age ? parseInt(age as any) : undefined,
      educationalInstitution,
      primaryRole,
      role: isBootstrapAdmin || isSpecialAdmin ? "ADMIN" : undefined,
      profile: { create: {} },
    },
    select: {
      id: true,
      email: true,
      role: true,
      fullName: true,
      experiencePoints: true,
    },
  })

  // Check if there's already a recent code (rate limiting)
  const existingCode = verificationCodes.get(email)
  if (!existingCode || existingCode.expiresAt < new Date() || existingCode.type !== 'verification') {
    // Send verification email
    try {
      const code = generateVerificationCode()
      
      // Store code with expiration (5 minutes) and attempt counter
      verificationCodes.set(email, {
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        type: 'verification',
        attempts: 0
      })
      
      // Send email
      await sendVerificationEmail(email, code)
    } catch (error) {
      console.error("Failed to send verification email:", error)
      // Don't block registration if email fails
    }
  }

  // Return response indicating email verification is required
  res.status(201).json({
    requiresEmailVerification: true,
    email: user.email,
    message: "Registration successful. Please check your email for verification code."
  })
})

router.post("/send-verification", async (req, res) => {
  const { email } = req.body as { email?: string }
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" })
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Check if there's already a recent code (rate limiting)
    const existing = verificationCodes.get(email)
    if (existing && existing.expiresAt > new Date()) {
      const timeLeft = Math.ceil((existing.expiresAt.getTime() - Date.now()) / 1000)
      return res.status(429).json({ 
        error: `Please wait ${timeLeft} seconds before requesting a new code`,
        retryAfter: timeLeft
      })
    }

    // Generate verification code
    const code = generateVerificationCode()
    
    // Store code with expiration (5 minutes) and attempt counter
    verificationCodes.set(email, {
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      type: 'verification',
      attempts: 0
    })
    
    // Send email
    await sendVerificationEmail(email, code)
    
    res.json({ success: true, message: "Verification code sent" })
  } catch (error) {
    console.error("Failed to send verification email:", error)
    res.status(500).json({ error: "Failed to send verification email" })
  }
})

router.post("/verify-email", async (req, res) => {
  const parsed = verifyEmailSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, code } = parsed.data

  try {
    // Check if code exists and is valid
    const stored = verificationCodes.get(email)
    if (!stored || stored.type !== 'verification') {
      return res.status(400).json({ error: "Verification code not found" })
    }

    // Check if code is expired
    if (stored.expiresAt < new Date()) {
      verificationCodes.delete(email)
      return res.status(400).json({ error: "Verification code expired" })
    }

    // Check attempts (max 3 attempts)
    if (stored.attempts >= 3) {
      verificationCodes.delete(email)
      return res.status(400).json({ error: "Too many failed attempts. Please request a new code." })
    }

    // Increment attempts
    stored.attempts += 1
    verificationCodes.set(email, stored)

    // Check if code matches
    if (stored.code !== code) {
      return res.status(400).json({ error: "Invalid verification code" })
    }

    // Code is valid, remove it
    verificationCodes.delete(email)

    // Mark user's email as verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true }
    })

    res.json({ success: true, message: "Email verified successfully" })
  } catch (error) {
    console.error("Failed to verify email:", error)
    res.status(500).json({ error: "Failed to verify email" })
  }
})

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, password } = parsed.data

  const user = await (prisma as any).user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      fullName: true,
      passwordHash: true,
      experiencePoints: true,
      banned: true,
      bannedReason: true,
      emailVerified: true,
    } as any,
  })
  if (!user) return res.status(401).json({ error: "Invalid credentials" })
  if ((user as any).banned) {
    const reason = (user as any).bannedReason || "Напишите в службу поддержки."
    return res.status(403).json({ error: `Ваш аккаунт заблокирован. ${reason}` })
  }
  const valid = await verifyPassword(password, (user as any).passwordHash)
  if (!valid) return res.status(401).json({ error: "Invalid credentials" })

  // If email is not verified — do not auto-send verification on login.
  // Require using the explicit verification flow (registration/send-verification).
  if (!user.emailVerified) {
    return res.status(403).json({ error: "Email не подтверждён. Пожалуйста, подтвердите почту через процесс верификации." })
  }

  // Proceed with login for verified users
  const accessToken = signAccessToken(user.id, user.role)
  const refreshToken = signRefreshToken(user.id, user.role)

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90 дней
    },
  })

  console.log(`[AUTH] User logged in successfully: ${user.email}`)

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      xp: Number((user as any).experiencePoints || 0),
      age: (user as any).age,
      educationalInstitution: (user as any).educationalInstitution,
      primaryRole: (user as any).primaryRole,
    },
  })
})

router.post("/login-verify", async (req, res) => {
  const parsed = verifyEmailSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, code } = parsed.data

  try {
    // Check if code exists and is valid
    const stored = verificationCodes.get(email)
    if (!stored || stored.type !== 'verification') {
      return res.status(400).json({ error: "Verification code not found" })
    }

    // Check if code is expired
    if (stored.expiresAt < new Date()) {
      verificationCodes.delete(email)
      return res.status(400).json({ error: "Verification code expired" })
    }

    // Check attempts (max 3 attempts)
    if (stored.attempts >= 3) {
      verificationCodes.delete(email)
      return res.status(400).json({ error: "Too many failed attempts. Please request a new code." })
    }

    // Increment attempts
    stored.attempts += 1
    verificationCodes.set(email, stored)

    // Check if code matches
    if (stored.code !== code) {
      return res.status(400).json({ error: "Invalid verification code" })
    }

    // Code is valid, remove it
    verificationCodes.delete(email)

    // Mark user's email as verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true }
    })

    // Proceed with login
    const user = await (prisma as any).user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        experiencePoints: true,
        banned: true,
        bannedReason: true,
        educationalInstitution: true,
        primaryRole: true,
        age: true,
      } as any,
    })
    
    if (!user) return res.status(401).json({ error: "Invalid credentials" })
    if ((user as any).banned) {
      const reason = (user as any).bannedReason || "Напишите в службу поддержки."
      return res.status(403).json({ error: `Ваш аккаунт заблокирован. ${reason}` })
    }

    const accessToken = signAccessToken(user.id, user.role)
    const refreshToken = signRefreshToken(user.id, user.role)

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90 дней
      },
    })

    console.log(`[AUTH] User verified and logged in: ${user.email}`)

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        xp: Number((user as any).experiencePoints || 0),
        educationalInstitution: user.educationalInstitution,
        primaryRole: user.primaryRole,
        age: typeof user.age === 'number' ? user.age : undefined,
      },
    })
  } catch (error) {
    console.error("Failed to verify email:", error)
    res.status(500).json({ error: "Failed to verify email" })
  }
})

// Password reset request with rate limiting
router.post("/forgot-password", async (req, res) => {
  const parsed = passwordResetRequestSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email } = parsed.data

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ success: true, message: "If email exists, reset code sent" })
    }

    // Check if there's already a recent code (rate limiting)
    const existing = verificationCodes.get(email)
    if (existing && existing.type === 'password-reset' && existing.expiresAt > new Date()) {
      const timeLeft = Math.ceil((existing.expiresAt.getTime() - Date.now()) / 1000)
      return res.status(429).json({ 
        error: `Please wait ${timeLeft} seconds before requesting a new code`,
        retryAfter: timeLeft
      })
    }

    // Generate reset code
    const code = generateVerificationCode()
    
    // Store code with expiration (15 minutes) and attempt counter
    verificationCodes.set(email, {
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      type: 'password-reset',
      attempts: 0
    })
    
    // Send email
    await sendPasswordResetEmail(email, code)
    
    res.json({ success: true, message: "If email exists, reset code sent" })
  } catch (error) {
    console.error("Failed to send password reset email:", error)
    res.status(500).json({ error: "Failed to process password reset request" })
  }
})

router.post("/verify-reset-code", async (req, res) => {
  const parsed = verifyEmailSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, code } = parsed.data

  try {
    const stored = verificationCodes.get(email)
    if (!stored || stored.type !== 'password-reset') {
      return res.status(400).json({ error: "Reset code not found or expired" })
    }

    if (stored.expiresAt < new Date()) {
      verificationCodes.delete(email)
      return res.status(400).json({ error: "Reset code expired" })
    }

    if (stored.attempts >= 3) {
      verificationCodes.delete(email)
      return res.status(400).json({ error: "Too many failed attempts. Please request a new code." })
    }

    stored.attempts += 1
    verificationCodes.set(email, stored)

    if (stored.code !== code) {
      return res.status(400).json({ error: "Invalid reset code" })
    }

    stored.attempts = 0
    verificationCodes.set(email, stored)

    res.json({ success: true, attemptsRemaining: 3 - stored.attempts })
  } catch (error) {
    console.error("Failed to verify reset code:", error)
    res.status(500).json({ error: "Failed to verify reset code" })
  }
})

router.post("/reset-password", async (req, res) => {
  const parsed = passwordResetSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, code, newPassword } = parsed.data

  try {
    // Check if code exists and is valid
    const stored = verificationCodes.get(email)
    if (!stored || stored.type !== 'password-reset') {
      return res.status(400).json({ error: "Reset code not found or expired" })
    }

    // Check if code is expired
    if (stored.expiresAt < new Date()) {
      verificationCodes.delete(email)
      return res.status(400).json({ error: "Reset code expired" })
    }

    // Check attempts (max 3 attempts)
    if (stored.attempts >= 3) {
      verificationCodes.delete(email)
      return res.status(400).json({ error: "Too many failed attempts. Please request a new code." })
    }

    // Increment attempts
    stored.attempts += 1
    verificationCodes.set(email, stored)

    // Check if code matches
    if (stored.code !== code) {
      return res.status(400).json({ error: "Invalid reset code" })
    }

    // Code is valid, remove it
    verificationCodes.delete(email)

    // Update password
    const passwordHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    })

    res.json({ success: true, message: "Password reset successfully" })
  } catch (error) {
    console.error("Failed to reset password:", error)
    res.status(500).json({ error: "Failed to reset password" })
  }
})

// Change password (authenticated users)
router.post("/change-password", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })
  
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { currentPassword, newPassword } = parsed.data

  try {
    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { passwordHash: true }
    })
    
    if (!user) return res.status(404).json({ error: "User not found" })
    
    // Verify current password
    const valid = await verifyPassword(currentPassword, user.passwordHash)
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" })
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)
    
    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash }
    })
    
    res.json({ success: true, message: "Password changed successfully" })
  } catch (error) {
    console.error("Failed to change password:", error)
    res.status(500).json({ error: "Failed to change password" })
  }
})

router.post("/refresh", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { refreshToken } = parsed.data

  const stored = await prisma.session.findUnique({ where: { refreshToken } })

  // Добавляем буфер 5 минут для проверки истечения сессии
  const now = new Date()
  const bufferTime = 5 * 60 * 1000 // 5 минут в миллисекундах

  if (!stored) {
    console.log(`[AUTH] Session not found for refresh token`)
    return res.status(401).json({ error: "Session not found", code: "SESSION_NOT_FOUND" })
  }

  if (stored.expiresAt.getTime() < (now.getTime() - bufferTime)) {
    console.log(`[AUTH] Session expired for user ${stored.userId}. Expired at: ${stored.expiresAt}, Current time: ${now}`)
    // Удаляем истекшую сессию
    await prisma.session.delete({ where: { id: stored.id } }).catch(() => null)
    return res.status(401).json({ error: "Session expired", code: "SESSION_EXPIRED" })
  }

  let payload
  try {
    payload = verifyToken(refreshToken)
  } catch (error) {
    console.log(`[AUTH] Invalid refresh token signature`)
    return res.status(401).json({ error: "Invalid token signature", code: "INVALID_TOKEN" })
  }

  const accessToken = signAccessToken(payload.sub, payload.role)
  const newRefreshToken = signRefreshToken(payload.sub, payload.role)

  // Увеличиваем срок действия до 90 дней
  await prisma.session.update({
    where: { refreshToken },
    data: {
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90 дней
    },
  })

  console.log(`[AUTH] Successfully refreshed tokens for user ${payload.sub}`)
  res.json({ accessToken, refreshToken: newRefreshToken })
})

router.post("/logout", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { refreshToken } = parsed.data
  await prisma.session.delete({ where: { refreshToken }, select: { id: true } }).catch(() => null)
  res.json({ success: true })
})

router.get("/me", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { profile: true },
  })
  if (!user) return res.status(404).json({ error: "User not found" })
  if ((user as any).banned) {
    const reason = (user as any).bannedReason || "Напишите в службу поддержки."
    return res.status(403).json({ error: `Аккаунт заблокирован. ${reason}` })
  }
  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    xp: Number((user as any).experiencePoints || 0),
    age: (user as any).age,
    educationalInstitution: (user as any).educationalInstitution,
    primaryRole: (user as any).primaryRole,
    profile: user.profile,
  })
})

const profileUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  age: z.number().int().min(10).max(100).optional(),
  educationalInstitution: z.string().optional(),
  primaryRole: z.string().optional(),
})

router.put("/me", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })
  const parsed = profileUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data = parsed.data
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: data.fullName,
        age: data.age,
        educationalInstitution: data.educationalInstitution,
        primaryRole: data.primaryRole,
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        age: true,
        educationalInstitution: true,
        primaryRole: true,
      },
    })
    return res.json(updated)
  } catch (e) {
    return res.status(500).json({ error: "Failed to update profile" })
  }
})