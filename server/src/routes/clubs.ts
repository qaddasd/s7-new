import { Router, type Response } from "express"
import { z } from "zod"
import { prisma } from "../db"
import { hashPassword } from "../utils/password"
import { requireAuth } from "../middleware/auth"
import type { AuthenticatedRequest } from "../types"

export const router = Router()

const db = prisma as any

const log = (...a: any[]) => console.log("[clubs]", ...a)

router.use(requireAuth)

const clubCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  programId: z.string().optional(),
})

const joinByCodeSchema = z.object({ code: z.string().regex(/^[0-9]{4,}$/) })
const subscriptionRequestSchema = z.object({ amount: z.number().positive().default(2000), currency: z.string().default("KZT"), period: z.string().default("month"), method: z.string().default("kaspi"), note: z.string().optional() })

// Join by invite code (numeric, reusable)
router.post("/join-by-code", async (req: AuthenticatedRequest, res: Response) => {
  const parsed = joinByCodeSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const code = parsed.data.code
  const cls = await db.clubClass.findFirst({ where: { inviteCode: code }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Invalid code" })
  // Enforce 30 students/class limit (non-admin)
  const count = await db.classEnrollment.count({ where: { classId: cls.id } })
  const isAdmin = req.user!.role === 'ADMIN'
  if (!isAdmin && count >= 30) return res.status(400).json({ error: "Достигнут лимит: максимум 30 учеников в классе" })
  const e = await db.classEnrollment.upsert({
    where: { classId_userId: { classId: cls.id, userId: req.user!.id } },
    create: { classId: cls.id, userId: req.user!.id },
    update: { status: "active" },
  })
  res.status(201).json({ enrolled: true, classId: cls.id, enrollmentId: e.id })
})

// Subscription request (Kaspi manual) — notify admins only
router.post("/subscription-requests", async (req: AuthenticatedRequest, res: Response) => {
  const parsed = subscriptionRequestSchema.safeParse(req.body || {})
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data = parsed.data
  const payload = {
    requestUserId: req.user!.id,
    amount: data.amount,
    currency: data.currency,
    period: data.period,
    method: data.method,
    note: data.note || null,
  }
  const admins = await (db as any).user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
  for (const a of admins) {
    await (db as any).notification.create({
      data: {
        userId: a.id,
        title: "Запрос подписки кружков",
        message: `Пользователь ${req.user!.id} запросил подписку ${data.amount} ${data.currency}/мес (метод: ${data.method}).`,
        type: "subscription",
        metadata: payload as any,
      },
    })
  }
  res.status(201).json({ ok: true })
})


function generateNumericCode(len = 6): string {
  let s = ""
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10)
  return s
}

// Parse a YYYY-MM-DD (or ISO date) as Asia/Aqtobe local midnight
function parseAqtobeStart(dateStr: string): Date {
  if (!dateStr) return new Date(NaN)
  const d = String(dateStr)
  if (/T/.test(d)) return new Date(d)
  return new Date(`${d}T00:00:00+05:00`)
}
function parseAqtobeEnd(dateStr: string): Date {
  if (!dateStr) return new Date(NaN)
  const d = String(dateStr)
  if (/T/.test(d)) return new Date(d)
  return new Date(`${d}T23:59:59+05:00`)
}

// Create single session by date (adds a new column in attendance grid)
router.post("/classes/:classId/sessions", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const body = z.object({ date: z.string().min(4) }).safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: body.error.flatten() })
  const d = parseAqtobeStart(String(body.data.date))
  if (!(d instanceof Date) || isNaN(d.getTime())) return res.status(400).json({ error: "Invalid date" })
  const s = await db.clubSession.upsert({
    where: { classId_date_scheduleItemId: { classId, date: d, scheduleItemId: null } },
    create: { classId, date: d, scheduleItemId: null },
    update: {},
  })
  res.status(201).json(s)
})

router.get("/mine", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const isAdmin = req.user!.role === "ADMIN"
  const limit = (() => {
    const raw = Number(((req as any).query?.limit) || (isAdmin ? 30 : 100))
    if (!Number.isFinite(raw) || raw <= 0) return isAdmin ? 30 : 100
    return Math.min(200, Math.max(1, Math.floor(raw)))
  })()
  const where = isAdmin
    ? { isActive: true }
    : {
        isActive: true,
        OR: [
          { ownerId: userId },
          { mentors: { some: { userId } } },
          { classes: { some: { enrollments: { some: { userId } } } } },
        ],
      }
  const clubs = await db.club.findMany({
    where,
    take: limit,
    include: {
      mentors: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      classes: {
        include: {
          enrollments: { include: { user: { select: { id: true, fullName: true, email: true } } } },
          scheduleItems: true,
          sessions: { orderBy: { date: "desc" }, take: 5, include: { attendances: { select: { studentId: true, status: true } } } },
        }
      }
    }
  })
  res.json(clubs)
})

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const parsed = clubCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data = parsed.data
  const club = await db.club.create({
    data: {
      name: data.name,
      description: data.description,
      location: data.location,
      programId: data.programId,
      ownerId: req.user!.id,
    }
  })
  res.status(201).json(club)
  log("club.create", { id: club.id, ownerId: req.user!.id })
})

// Delete a club with all nested data (admin only)
router.delete("/:clubId", async (req: AuthenticatedRequest, res: Response) => {
  const { clubId } = req.params
  if ((req.user as any)?.role !== "ADMIN") {
    return res.status(403).json({ error: "Only admins can delete clubs" })
  }
  const club = await db.club.findUnique({ where: { id: clubId } })
  if (!club) return res.status(404).json({ error: "Club not found" })

  const classes = await db.clubClass.findMany({ where: { clubId }, select: { id: true } })
  const classIds = classes.map((c: any) => c.id)
  if (classIds.length > 0) {
    const [sessions, assignments] = await Promise.all([
      db.clubSession.findMany({ where: { classId: { in: classIds } }, select: { id: true } }),
      db.clubAssignment.findMany({ where: { classId: { in: classIds } }, select: { id: true } }),
    ])
    const sessionIds = sessions.map((s: any) => s.id)
    const assignmentIds = assignments.map((a: any) => a.id)

    await db.$transaction([
      assignmentIds.length ? db.assignmentSubmission.deleteMany({ where: { assignmentId: { in: assignmentIds } } }) : (db as any).$executeRaw`SELECT 1`,
      sessionIds.length ? db.attendance.deleteMany({ where: { sessionId: { in: sessionIds } } }) : (db as any).$executeRaw`SELECT 1`,
      db.clubResource.deleteMany({ where: { classId: { in: classIds } } }),
      db.clubAssignment.deleteMany({ where: { classId: { in: classIds } } }),
      db.scheduleItem.deleteMany({ where: { classId: { in: classIds } } }),
      db.clubSession.deleteMany({ where: { classId: { in: classIds } } }),
      db.classEnrollment.deleteMany({ where: { classId: { in: classIds } } }),
      db.clubClass.deleteMany({ where: { id: { in: classIds } } }),
      db.clubMentor.deleteMany({ where: { clubId } }),
      db.club.delete({ where: { id: clubId } }),
    ])
  } else {
    await db.$transaction([
      db.clubMentor.deleteMany({ where: { clubId } }),
      db.club.delete({ where: { id: clubId } }),
    ])
  }

  res.json({ ok: true })
  log("club.delete", { id: clubId })
})

const classCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
})

async function ensureAdminOrClubMentorOrOwner(userId: string, role: string | undefined, clubId: string) {
  if (role === "ADMIN") return true
  const club = await db.club.findUnique({ where: { id: clubId }, include: { mentors: true } })
  if (!club) return false
  if (club.ownerId === userId) return true
  return (club.mentors as any[]).some((m: any) => m.userId === userId)
}

router.post("/:clubId/classes", async (req: AuthenticatedRequest, res: Response) => {
  const { clubId } = req.params
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  // Enforce 2 classes per club (non-admin)
  const isAdmin = req.user!.role === 'ADMIN'
  if (!isAdmin) {
    const cnt = await db.clubClass.count({ where: { clubId } })
    if (cnt >= 2) return res.status(400).json({ error: "Достигнут лимит: максимум 2 класса" })
  }
  const parsed = classCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data = parsed.data
  const cls = await db.clubClass.create({
    data: {
      clubId,
      title: data.title,
      description: data.description,
      location: data.location,
    }
  })
  res.status(201).json(cls)
  log("class.create", { id: cls.id, clubId })
})

// Invite code endpoints for class join (admins/mentors/owners)
router.get("/classes/:classId/invite-code", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  res.json({ code: cls.inviteCode || null })
})

router.post("/classes/:classId/invite-code", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const provided = ((req.body || {}) as any).code as string | undefined
  let code = (provided || "").trim()
  if (!/^[0-9]{4,}$/.test(code)) code = generateNumericCode(6)
  const updated = await db.clubClass.update({ where: { id: classId }, data: { inviteCode: code } })
  res.json({ code: updated.inviteCode })
})

const mentorAssignSchema = z.object({ userId: z.string().min(1) })
const mentorAssignByEmailSchema = z.object({ email: z.string().email() })

router.post("/:clubId/mentors", async (req: AuthenticatedRequest, res: Response) => {
  const { clubId } = req.params
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const parsed = mentorAssignSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const m = await db.clubMentor.upsert({
    where: { clubId_userId: { clubId, userId: parsed.data.userId } },
    create: { clubId, userId: parsed.data.userId },
    update: { role: "mentor" },
  })
  res.status(201).json(m)
  log("mentor.upsert", { clubId, userId: parsed.data.userId })
})

router.post("/:clubId/mentors-by-email", async (req: AuthenticatedRequest, res: Response) => {
  const { clubId } = req.params
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const parsed = mentorAssignByEmailSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const user = await db.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return res.status(404).json({ error: "User not found" })
  const m = await db.clubMentor.upsert({
    where: { clubId_userId: { clubId, userId: user.id } },
    create: { clubId, userId: user.id },
    update: { role: "mentor" },
  })
  res.status(201).json(m)
})

const enrollSchema = z.object({ userId: z.string().min(1) })

const classUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
})

router.patch("/classes/:classId", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const parsed = classUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data = parsed.data
  const updated = await db.clubClass.update({ where: { id: classId }, data })
  res.json(updated)
  log("class.update", { id: classId })
})

router.delete("/classes/:classId", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  await db.clubClass.delete({ where: { id: classId } })
  res.json({ ok: true })
  log("class.delete", { id: classId })
})

const resourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().min(1),
})

const assignmentCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueAt: z.string().optional(),
})

const assignmentUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueAt: z.string().optional(),
})

const submissionCreateSchema = z.object({
  answerText: z.string().optional(),
  attachmentUrl: z.string().optional(),
})

const submissionGradeSchema = z.object({
  grade: z.number().int().min(0).max(100).optional(),
  feedback: z.string().optional(),
})

async function isEnrolled(userId: string, classId: string): Promise<boolean> {
  const e = await db.classEnrollment.findUnique({ where: { classId_userId: { classId, userId } } }).catch(() => null)
  return Boolean(e)
}

router.get("/classes/:classId/resources", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const allowed = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId) || await isEnrolled(req.user!.id, classId)
  if (!allowed) return res.status(403).json({ error: "Forbidden" })
  const items = await db.clubResource.findMany({ where: { classId }, orderBy: { createdAt: "desc" } })
  res.json(items)
})

router.post("/classes/:classId/resources", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const parsed = resourceSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const r = await db.clubResource.create({ data: { classId, ...parsed.data } })
  res.status(201).json(r)
  log("resource.create", { id: r.id, classId })
})

router.delete("/resources/:resourceId", async (req: AuthenticatedRequest, res: Response) => {
  const { resourceId } = req.params
  const r = await db.clubResource.findUnique({ where: { id: resourceId }, include: { class: { include: { club: true } } } })
  if (!r) return res.status(404).json({ error: "Resource not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, r.class.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  await db.clubResource.delete({ where: { id: resourceId } })
  res.json({ ok: true })
  log("resource.delete", { id: resourceId })
})

router.get("/classes/:classId/assignments", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const allowed = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId) || await isEnrolled(req.user!.id, classId)
  if (!allowed) return res.status(403).json({ error: "Forbidden" })
  const list = await db.clubAssignment.findMany({ where: { classId }, orderBy: { createdAt: "desc" } })
  res.json(list)
})

router.post("/classes/:classId/assignments", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const parsed = assignmentCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const due = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null
  if (parsed.data.dueAt && (!due || isNaN(due.getTime()))) return res.status(400).json({ error: "Invalid dueAt" })
  const a = await db.clubAssignment.create({ data: { classId, title: parsed.data.title, description: parsed.data.description, dueAt: due } })
  res.status(201).json(a)
  log("assignment.create", { id: a.id, classId })
})

router.patch("/assignments/:assignmentId", async (req: AuthenticatedRequest, res: Response) => {
  const { assignmentId } = req.params
  const a = await db.clubAssignment.findUnique({ where: { id: assignmentId }, include: { class: { include: { club: true } } } })
  if (!a) return res.status(404).json({ error: "Assignment not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, a.class.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const parsed = assignmentUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  let dueAt: Date | undefined
  if (parsed.data.dueAt !== undefined) {
    dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null as any
    if (parsed.data.dueAt && (!dueAt || isNaN((dueAt as Date).getTime()))) return res.status(400).json({ error: "Invalid dueAt" })
  }
  const updated = await db.clubAssignment.update({ where: { id: assignmentId }, data: { title: parsed.data.title, description: parsed.data.description, dueAt: parsed.data.dueAt !== undefined ? dueAt as any : undefined } })
  res.json(updated)
  log("assignment.update", { id: assignmentId })
})

router.delete("/assignments/:assignmentId", async (req: AuthenticatedRequest, res: Response) => {
  const { assignmentId } = req.params
  const a = await db.clubAssignment.findUnique({ where: { id: assignmentId }, include: { class: { include: { club: true } } } })
  if (!a) return res.status(404).json({ error: "Assignment not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, a.class.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  await db.clubAssignment.delete({ where: { id: assignmentId } })
  res.json({ ok: true })
  log("assignment.delete", { id: assignmentId })
})

router.get("/assignments/:assignmentId/submissions", async (req: AuthenticatedRequest, res: Response) => {
  const { assignmentId } = req.params
  const a = await db.clubAssignment.findUnique({ where: { id: assignmentId }, include: { class: { include: { club: true } } } })
  if (!a) return res.status(404).json({ error: "Assignment not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, a.class.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const subs = await db.assignmentSubmission.findMany({ where: { assignmentId }, include: { student: true }, orderBy: { submittedAt: "desc" } })
  res.json(subs)
})

router.post("/assignments/:assignmentId/submissions", async (req: AuthenticatedRequest, res: Response) => {
  const { assignmentId } = req.params
  const a = await db.clubAssignment.findUnique({ where: { id: assignmentId }, include: { class: true } })
  if (!a) return res.status(404).json({ error: "Assignment not found" })
  const userId = req.user!.id
  const allowed = await isEnrolled(userId, a.classId) || req.user!.role === "ADMIN"
  if (!allowed) return res.status(403).json({ error: "Forbidden" })
  const parsed = submissionCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const sub = await db.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: userId } },
    create: { assignmentId, studentId: userId, answerText: parsed.data.answerText, attachmentUrl: parsed.data.attachmentUrl },
    update: { answerText: parsed.data.answerText, attachmentUrl: parsed.data.attachmentUrl },
  })
  res.status(201).json(sub)
  log("submission.upsert", { id: sub.id, assignmentId })
})

router.patch("/submissions/:submissionId/grade", async (req: AuthenticatedRequest, res: Response) => {
  const { submissionId } = req.params
  const sub = await db.assignmentSubmission.findUnique({ where: { id: submissionId }, include: { assignment: { include: { class: { include: { club: true } } } } } })
  if (!sub) return res.status(404).json({ error: "Submission not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, sub.assignment.class.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const parsed = submissionGradeSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const updated = await db.assignmentSubmission.update({ where: { id: submissionId }, data: { grade: parsed.data.grade, feedback: parsed.data.feedback, status: parsed.data.grade !== undefined ? "graded" as any : undefined, gradedAt: parsed.data.grade !== undefined ? new Date() : undefined } })
  res.json(updated)
  log("submission.grade", { id: submissionId, assignmentId: sub.assignmentId })
})

router.post("/classes/:classId/enroll", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const isAdmin = req.user!.role === 'ADMIN'
  if (!isAdmin) {
    const cnt = await db.classEnrollment.count({ where: { classId } })
    if (cnt >= 30) return res.status(400).json({ error: "Достигнут лимит: максимум 30 учеников в классе" })
  }
  const parsed = enrollSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const e = await db.classEnrollment.upsert({
    where: { classId_userId: { classId, userId: parsed.data.userId } },
    create: { classId, userId: parsed.data.userId },
    update: { status: "active" },
  })
  res.status(201).json(e)
  log("enroll.upsert", { classId, userId: parsed.data.userId })
})

const enrollByEmailSchema = z.object({ email: z.string().email() })
const extraStudentSchema = z.object({ fullName: z.string().min(1), email: z.string().email().optional() })

router.post("/classes/:classId/enroll-by-email", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const isAdmin = req.user!.role === 'ADMIN'
  if (!isAdmin) {
    const cnt = await db.classEnrollment.count({ where: { classId } })
    if (cnt >= 30) return res.status(400).json({ error: "Достигнут лимит: максимум 30 учеников в классе" })
  }
  const parsed = enrollByEmailSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const user = await db.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return res.status(404).json({ error: "User not found" })
  const e = await db.classEnrollment.upsert({
    where: { classId_userId: { classId, userId: user.id } },
    create: { classId, userId: user.id },
    update: { status: "active" },
  })
  res.status(201).json(e)
})

// Extra students by FIO (creates a lightweight user and enrolls)
router.post("/classes/:classId/extra-students", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const isAdmin = req.user!.role === 'ADMIN'
  if (!isAdmin) {
    const cnt = await db.classEnrollment.count({ where: { classId } })
    if (cnt >= 30) return res.status(400).json({ error: "Достигнут лимит: максимум 30 учеников в классе" })
  }
  const parsed = extraStudentSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const fullName = parsed.data.fullName.trim()
  let email = (parsed.data.email || "").trim().toLowerCase()
  if (!email) {
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`
    email = `student+${suffix}@students.local`
  }
  // ensure unique email
  let exists = await db.user.findUnique({ where: { email } }).catch(()=>null)
  if (exists) {
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`
    email = `student+${suffix}@students.local`
  }
  const passwordHash = await hashPassword(`club-${Math.random().toString(36).slice(2,10)}`)
  const user = await db.user.create({ data: { email, passwordHash, fullName, role: "USER", emailVerified: true } })
  const e = await db.classEnrollment.upsert({
    where: { classId_userId: { classId, userId: user.id } },
    create: { classId, userId: user.id },
    update: { status: "active" },
  })
  res.status(201).json({ id: user.id, fullName: user.fullName, email: user.email, enrollmentId: e.id })
})

router.delete("/classes/:classId/enroll/:userId", async (req: AuthenticatedRequest, res: Response) => {
  const { classId, userId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  await db.classEnrollment.delete({ where: { classId_userId: { classId, userId } } }).catch(() => {})
  res.json({ ok: true })
  log("enroll.delete", { classId, userId })
})

const scheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  location: z.string().optional(),
})

router.get("/classes/:classId/schedule", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const items = await db.scheduleItem.findMany({ where: { classId }, orderBy: { dayOfWeek: "asc" } })
  res.json(items)
})

router.post("/classes/:classId/schedule", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const parsed = scheduleSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const s = await db.scheduleItem.create({ data: { classId, ...parsed.data } })
  res.status(201).json(s)
  log("schedule.create", { id: s.id, classId })
})

router.delete("/schedule/:scheduleItemId", async (req: AuthenticatedRequest, res: Response) => {
  const { scheduleItemId } = req.params
  const si = await db.scheduleItem.findUnique({ where: { id: scheduleItemId }, include: { class: { include: { club: true } } } })
  if (!si) return res.status(404).json({ error: "Schedule item not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, si.class.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  await db.scheduleItem.delete({ where: { id: scheduleItemId } })
  res.json({ ok: true })
  log("schedule.delete", { id: scheduleItemId })
})

const generateSchema = z.object({ from: z.string(), to: z.string() })

router.post("/classes/:classId/sessions/generate", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const { from, to } = generateSchema.parse(req.body)
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true, scheduleItems: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const start = parseAqtobeStart(from)
  const end = parseAqtobeEnd(to)
  if (!(start instanceof Date) || !(end instanceof Date) || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: "Invalid date range" })
  }
  const sessionsToCreate: { date: Date; scheduleItemId?: string }[] = []
  const cur = new Date(start)
  while (cur <= end) {
    const dow = cur.getDay() // 0..6
    for (const si of cls.scheduleItems) {
      if (si.dayOfWeek === dow) {
        const d = new Date(cur)
        sessionsToCreate.push({ date: d, scheduleItemId: si.id })
      }
    }
    cur.setDate(cur.getDate() + 1)
  }
  const created = await db.$transaction(
    sessionsToCreate.map((s) => db.clubSession.upsert({
      where: { classId_date_scheduleItemId: { classId, date: s.date, scheduleItemId: s.scheduleItemId ?? null } },
      create: { classId, date: s.date, scheduleItemId: s.scheduleItemId ?? null },
      update: {},
    }))
  )
  res.json({ created: created.length })
  log("sessions.generate", { classId, from, to, created: created.length })
})

router.get("/classes/:classId/sessions", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const { from, to } = (req.query || {}) as any
  const where: any = { classId }
  if (from) where.date = { gte: parseAqtobeStart(String(from)) }
  if (to) where.date = { ...(where.date || {}), lte: parseAqtobeEnd(String(to)) }
  const list = await db.clubSession.findMany({ where, orderBy: { date: "asc" }, include: { attendances: true } })
  res.json(list)
})

const attendanceSchema = z.object({
  marks: z.array(z.object({ studentId: z.string(), status: z.enum(["present", "absent", "late", "excused"]), feedback: z.string().optional() }))
})

router.post("/sessions/:sessionId/attendance", async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.params
  const session = await db.clubSession.findUnique({ where: { id: sessionId }, include: { class: { include: { club: true } } } })
  if (!session) return res.status(404).json({ error: "Session not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, session.class.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const parsed = attendanceSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const marks = parsed.data.marks
  const admins = await (db as any).user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
  await db.$transaction(async (tx: any) => {
    for (const m of marks) {
      await (tx as any).attendance.upsert({
        where: { sessionId_studentId: { sessionId, studentId: m.studentId } },
        create: { sessionId, studentId: m.studentId, status: m.status as any, feedback: m.feedback, markedById: req.user!.id },
        update: { status: m.status as any, feedback: m.feedback, markedById: req.user!.id, markedAt: new Date() },
      })
      const notifyTitle = m.status === "present" ? "Посещение" : (m.status === "absent" ? "Пропуск" : "Посещение")
      const notifyMsg = m.status === "present" ? "Вы посетили занятие. +100 XP" : (m.status === "absent" ? "Вы пропустили занятие." : "Вы посетили занятие.")
      await (tx as any).notification.create({ data: { userId: m.studentId, title: notifyTitle, message: notifyMsg, type: "attendance" } })
      if (m.status === "present") {
        const u = await (tx as any).user.findUnique({ where: { id: m.studentId }, select: { experiencePoints: true, fullName: true, email: true } })
        const before = Number(u?.experiencePoints || 0)
        await (tx as any).user.update({ where: { id: m.studentId }, data: { experiencePoints: { increment: 100 } } })
        const crossed = before < 100 && before + 100 >= 100
        if (crossed) {
          for (const a of admins) {
            await (tx as any).notification.create({ data: { userId: a.id, title: "Достигнут порог XP", message: `Пользователь достиг >=100 XP: ${u?.fullName || u?.email || m.studentId}`, type: "certificate" } })
          }
        }
      }
    }
  })

  res.json({ ok: true })
  log("attendance.submit", { sessionId, count: marks.length })
})

// --- Quiz for Club Sessions ---
const quizStartSchema = z.object({ templateId: z.string().optional() })
const quizSubmitSchema = z.object({
  answers: z.array(z.object({ questionIndex: z.number().int().min(0), selected: z.array(z.number().int().min(0)) }))
})

function calcQuizScore(quizJson: any, answers: Array<{ questionIndex: number; selected: number[] }>) {
  try {
    const qs: any[] = Array.isArray(quizJson?.questions) ? quizJson.questions : []
    let total = 0
    for (const a of answers) {
      const q = qs[a.questionIndex]
      if (!q) continue
      const opts: any[] = Array.isArray(q.options) ? q.options : []
      const correctIdx = opts.map((o, i) => (o?.isCorrect ? i : -1)).filter((i) => i >= 0)
      const pts = Number(q.points || 1)
      const sel = Array.isArray(a.selected) ? a.selected.slice().sort() : []
      const corr = correctIdx.slice().sort()
      const ok = sel.length === corr.length && sel.every((v, i) => v === corr[i])
      if (ok) total += pts
    }
    return total
  } catch {
    return 0
  }
}

async function ensurePresent(userId: string, sessionId: string) {
  const att = await (db as any).attendance.findUnique({ where: { sessionId_studentId: { sessionId, studentId: userId } } }).catch(() => null)
  return att && String(att.status) === "present"
}

// Start quiz for a session (admin/owner/mentor)
router.post("/sessions/:sessionId/quiz/start", async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.params
  const parsed = quizStartSchema.safeParse(req.body || {})
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const session = await db.clubSession.findUnique({ where: { id: sessionId }, include: { class: { include: { club: true } } } })
  if (!session) return res.status(404).json({ error: "Session not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, session.class.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  const existing = await (db as any).clubSessionQuiz?.findUnique({ where: { sessionId } }).catch(() => null)
  if (existing) return res.json(existing)
  let quizJson: any = null
  let templateId: string | undefined = parsed.data.templateId
  if (templateId) {
    const tpl = await (db as any).kruzhokLessonTemplate.findUnique({ where: { id: templateId } })
    if (!tpl) return res.status(404).json({ error: "Template not found" })
    quizJson = (tpl as any).quizJson || null
  } else {
    const pid = (session.class.club as any)?.programId
    if (!pid) return res.status(400).json({ error: "No program linked to club" })
    const tpl = await (db as any).kruzhokLessonTemplate.findFirst({ where: { programId: pid, quizJson: { not: null } }, orderBy: { orderIndex: "asc" } })
    if (!tpl) return res.status(400).json({ error: "No quiz template in program" })
    templateId = tpl.id
    quizJson = (tpl as any).quizJson
  }
  if (!quizJson) return res.status(400).json({ error: "Template has no quiz" })
  try {
    const created = await (db as any).clubSessionQuiz.create({ data: { sessionId, templateId: templateId!, quizJson } })
    return res.status(201).json(created)
  } catch (e: any) {
    return res.status(501).json({ error: "Quiz storage not ready. Apply DB migrations." })
  }
})

// Get quiz for a session (enrolled or staff)
router.get("/sessions/:sessionId/quiz", async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.params
  const session = await db.clubSession.findUnique({ where: { id: sessionId }, include: { class: { include: { club: true } } } })
  if (!session) return res.status(404).json({ error: "Session not found" })
  const staff = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, session.class.clubId)
  const enrolled = await isEnrolled(req.user!.id, session.classId)
  if (!staff && !enrolled) return res.status(403).json({ error: "Forbidden" })
  const q = await (db as any).clubSessionQuiz?.findUnique({ where: { sessionId } }).catch(() => null)
  if (!q) return res.status(404).json({ error: "No quiz" })
  res.json(q)
})

// Submit quiz answers (present students only)
router.post("/sessions/:sessionId/quiz/submit", async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.params
  const session = await db.clubSession.findUnique({ where: { id: sessionId } })
  if (!session) return res.status(404).json({ error: "Session not found" })
  const enrolled = await isEnrolled(req.user!.id, session.classId)
  if (!enrolled) return res.status(403).json({ error: "Not enrolled" })
  const present = await ensurePresent(req.user!.id, sessionId)
  if (!present) return res.status(403).json({ error: "Only present students can submit" })
  const parsed = quizSubmitSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const q = await (db as any).clubSessionQuiz?.findUnique({ where: { sessionId } }).catch(() => null)
  if (!q) return res.status(404).json({ error: "No quiz" })
  const score = calcQuizScore(q.quizJson as any, parsed.data.answers)
  try {
    const sub = await (db as any).clubQuizSubmission.upsert({
      where: { sessionId_studentId: { sessionId, studentId: req.user!.id } },
      create: { sessionId, studentId: req.user!.id, answers: parsed.data.answers as any, score },
      update: { answers: parsed.data.answers as any, score, submittedAt: new Date() },
    })
    return res.status(201).json({ ok: true, score, submissionId: sub.id })
  } catch (e:any) {
    return res.status(501).json({ error: "Quiz storage not ready. Apply DB migrations." })
  }
})

// List submissions (staff only)
router.get("/sessions/:sessionId/quiz/submissions", async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.params
  const session = await db.clubSession.findUnique({ where: { id: sessionId }, include: { class: { include: { club: true } } } })
  if (!session) return res.status(404).json({ error: "Session not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, session.class.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
  try {
    const subs = await (db as any).clubQuizSubmission.findMany({ where: { sessionId }, include: { student: { select: { id: true, fullName: true, email: true } } }, orderBy: { score: "desc" } })
    return res.json(subs)
  } catch (e:any) {
    return res.status(501).json({ error: "Quiz storage not ready. Apply DB migrations." })
  }
})
