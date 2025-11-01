function toApiMedia(u?: string | null): string | undefined {
  try {
    if (!u) return undefined
    const s = String(u)
    if (s.startsWith('/api/media/')) return s
    if (s.startsWith('/media/')) return s.replace('/media/', '/api/media/')
    const url = new URL(s)
    if (url.pathname.startsWith('/api/media/')) return url.pathname
    if (url.pathname.startsWith('/media/')) return url.pathname.replace('/media/','/api/media/')
    return s
  } catch { return u as any }
}

import { Router, type Request, type Response } from "express"
import { z } from "zod"
import { prisma } from "../db"
import { optionalAuth, requireAuth } from "../middleware/auth"
import { requireAdmin } from "../middleware/auth"
import type { AuthenticatedRequest } from "../types"

export const router = Router()

const purchaseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("KZT"),
  paymentMethod: z.string().default("kaspi"),
  transactionId: z.string().optional(),
  payerFullName: z.string().min(1).optional(),
  senderCode: z.string().min(3).max(64).optional(),
  metadata: z.record(z.any()).optional(),
})

router.get("/:courseId/analytics", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin only" })
  const { courseId } = req.params
  const [totalPurchases, approvedPurchases, pendingPurchases, enrollmentsCount, activeEnrollments, completedEnrollments, revenue] = await Promise.all([
    prisma.purchase.count({ where: { courseId } }),
    prisma.purchase.count({ where: { courseId, status: "approved" as any } }),
    prisma.purchase.count({ where: { courseId, status: "pending" as any } }),
    prisma.enrollment.count({ where: { courseId } }),
    prisma.enrollment.count({ where: { courseId, status: "active" as any } }),
    prisma.enrollment.count({ where: { courseId, progressPercentage: { gte: 100 as any } } }),
    prisma.purchase.aggregate({ _sum: { amount: true }, where: { courseId, status: "approved" as any } }),
  ])
  const revenueSum = (revenue._sum.amount as unknown as any) ?? 0
  res.json({ totalPurchases, approvedPurchases, pendingPurchases, enrollmentsCount, activeEnrollments, completedEnrollments, revenue: revenueSum })
})

const questionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(8),
  correctIndex: z.number().int().min(0),
  xpReward: z.number().int().min(0).max(10000).optional().default(100),
  moduleId: z.string().optional(),
  lessonId: z.string().optional(),
})

router.post("/:courseId/questions", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin only" })
  const { courseId } = req.params
  const parsed = questionSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data = parsed.data
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
  if (!course) return res.status(404).json({ error: "Course not found" })
  const q = await (prisma as any).courseQuestion.create({
    data: {
      courseId,
      moduleId: data.moduleId,
      lessonId: data.lessonId,
      text: data.text,
      options: data.options as any,
      correctIndex: data.correctIndex,
      xpReward: data.xpReward ?? 100,
      authorId: req.user!.id,
    },
  })
  res.status(201).json(q)
})

router.get("/:courseId/questions", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.params
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, isFree: true, price: true } })
  if (!course) return res.status(404).json({ error: "Course not found" })

  if (req.user?.role !== "ADMIN") {
    const hasAccess = await userHasCourseAccess(req.user?.id, course)
    if (!hasAccess) return res.status(403).json({ error: "No access" })
  }

  const { moduleId, lessonId } = req.query as any
  const where: any = { courseId }
  if (moduleId) where.moduleId = moduleId
  if (lessonId) where.lessonId = lessonId
  const list = await (prisma as any).courseQuestion.findMany({ where, orderBy: { createdAt: "desc" } })
  res.json(list.map((q: any) => ({ id: q.id, text: q.text, options: q.options, moduleId: q.moduleId, lessonId: q.lessonId })))
})

router.post("/questions/:questionId/answer", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { questionId } = req.params
  const { selectedIndex } = z.object({ selectedIndex: z.number().int().min(0) }).parse(req.body)
  const q = await (prisma as any).courseQuestion.findUnique({ where: { id: questionId } })
  if (!q) return res.status(404).json({ error: "Question not found" })
  const isCorrect = Number(selectedIndex) === Number(q.correctIndex)
  const ans = await (prisma as any).courseAnswer.create({
    data: { questionId, userId: req.user!.id, selectedIndex, isCorrect },
  })
  let awarded = 0
  if (isCorrect) {
    awarded = Number(q.xpReward ?? 100)
    await prisma.user.update({ where: { id: req.user!.id }, data: { experiencePoints: { increment: awarded } } })
  }
  res.status(201).json({ isCorrect, answerId: ans.id, correctIndex: q.correctIndex, xpAwarded: awarded })
})

router.get("/:courseId/questions/analytics", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin only" })
  const { courseId } = req.params
  const qs = await (prisma as any).courseQuestion.findMany({ where: { courseId }, include: { answers: true } })
  const data = qs.map((q: any) => ({
    id: q.id,
    text: q.text,
    totalAnswers: q.answers.length,
    correct: q.answers.filter((a: any) => a.isCorrect).length,
    wrong: q.answers.filter((a: any) => !a.isCorrect).length,
  }))
  res.json(data)
})

router.get("/:courseId/questions/answers", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin only" })
  const { courseId } = req.params
  const where: any = { courseId }
  const questionId = (req.query.questionId as string | undefined) || undefined
  if (questionId) where.id = questionId
  const qs = await (prisma as any).courseQuestion.findMany({ where, include: { answers: { include: { user: { select: { id: true, email: true, fullName: true } } } } } })
  const rows = qs.flatMap((q: any) =>
    (q.answers || []).map((a: any) => ({
      questionId: q.id,
      question: q.text,
      selectedIndex: a.selectedIndex,
      isCorrect: a.isCorrect,
      createdAt: a.createdAt,
      user: a.user,
    }))
  )
  res.json(rows)
})

const progressSchema = z.object({
  lessonId: z.string(),
  isCompleted: z.boolean().optional(),
  watchTimeSeconds: z.number().int().nonnegative().optional(),
})

router.get("/", async (req: Request, res: Response) => {
  const search = (req.query.search as string | undefined)?.trim()
  const filter = (req.query.filter as string | undefined) // 'free' | 'paid' | 'all'

  const where: any = { isPublished: true }
  if (search && search.length > 0) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }
  if (filter === "free") where.isFree = true
  if (filter === "paid") where.isFree = false

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, fullName: true } },
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            select: { id: true, title: true, isFreePreview: true, duration: true },
          },
        },
      },
    },
  })

  res.json(
    courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      coverImageUrl: course.coverImageUrl,
      price: course.price,
      isFree: course.isFree,
      estimatedHours: course.estimatedHours,
      author: course.author,
      modules: course.modules,
    }))
  )
})

router.get("/continue", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const enrollments = (await prisma.enrollment.findMany({
    where: { userId: req.user!.id },
    orderBy: { enrolledAt: "desc" },
    include: {
      lessonProgress: true,
      course: {
        include: {
          author: { select: { id: true, fullName: true } },
          modules: { orderBy: { orderIndex: "asc" }, include: { lessons: true } },
        },
      },
    },
  })) as any[]

  const items = enrollments
    .map((e: any) => {
      const completedLessons = (e.lessonProgress || []).filter((p: any) => p.isCompleted).length
      const totalLessons = (e.course?.modules || []).reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)
      const progress = typeof e.progressPercentage === "number" ? e.progressPercentage : totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
      return {
        id: e.course.id,
        title: e.course.title,
        difficulty: e.course.difficulty,
        author: e.course.author,
        price: e.course.price,
        modules: (e.course.modules || []).map((m: any) => ({ id: m.id, title: m.title, lessons: m.lessons })),
        completedLessons,
        totalLessons,
        progress,
      }
    })
    .filter((it) => it.completedLessons >= 1)

  res.json(items)
})

router.get("/:courseId", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const courseId = req.params.courseId
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      author: { select: { id: true, fullName: true, email: true } },
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  })
  if (!course) return res.status(404).json({ error: "Course not found" })

  const isAdmin = (req.user as any)?.role === "ADMIN"
  const hasAccess = isAdmin ? true : await userHasCourseAccess(req.user?.id, course)

  const safeModules = course.modules.map((module) => ({
    id: module.id,
    title: module.title,
    description: module.description,
    orderIndex: module.orderIndex,
    lessons: module.lessons.map((lesson: any) => {
      if (!(hasAccess || lesson.isFreePreview)) {
        return {
          id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          isFreePreview: lesson.isFreePreview,
        }
      }
      return {
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        duration: lesson.duration,
        orderIndex: lesson.orderIndex,
        isFreePreview: lesson.isFreePreview,
        videoUrl: toApiMedia(lesson.videoUrl),
        presentationUrl: toApiMedia(lesson.presentationUrl),
        slides: Array.isArray(lesson.slides)
          ? lesson.slides.map((s: any) => (s && typeof s === 'object' && s.url ? { ...s, url: toApiMedia(s.url) } : s))
          : lesson.slides,
      }
    }),
  }))

  res.json({
    id: course.id,
    title: course.title,
    description: course.description,
    difficulty: course.difficulty,
    author: course.author,
    price: course.price,
    isFree: course.isFree,
    coverImageUrl: course.coverImageUrl,
    estimatedHours: course.estimatedHours,
    modules: safeModules,
    hasAccess,
  })
})

router.get("/:courseId/lessons/:lessonId", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { courseId, lessonId } = req.params
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: { include: { course: true } } } })
  if (!lesson || lesson.module.courseId !== courseId) return res.status(404).json({ error: "Lesson not found" })

  const isAdmin = (req.user as any)?.role === "ADMIN"
  const hasAccess = isAdmin ? true : await userHasCourseAccess(req.user?.id, lesson.module.course)
  if (!hasAccess && !lesson.isFreePreview) return res.status(403).json({ error: "Lesson requires purchase" })

  res.json({
    id: lesson.id,
    title: lesson.title,
    content: lesson.content,
    duration: lesson.duration,
    videoUrl: toApiMedia(lesson.videoUrl),
    presentationUrl: toApiMedia(lesson.presentationUrl),
    slides: Array.isArray(lesson.slides)
      ? (lesson.slides as any[]).map((s: any) => (s && typeof s === 'object' && s.url ? { ...s, url: toApiMedia(s.url) } : s))
      : lesson.slides,
    isFreePreview: lesson.isFreePreview,
    moduleId: lesson.moduleId,
  })
})

router.post("/:courseId/purchase", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.params
  const parsed = purchaseSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return res.status(404).json({ error: "Course not found" })

  const purchase = await (prisma as any).purchase.create({
    data: {
      userId: req.user!.id,
      courseId,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      paymentMethod: parsed.data.paymentMethod,
      transactionId: parsed.data.transactionId,
      payerFullName: parsed.data.payerFullName,
      senderCode: parsed.data.senderCode,
      metadata: parsed.data.metadata as any,
    },
  })

  res.status(201).json(purchase)
})

router.get("/:courseId/progress", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.params

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: req.user!.id, courseId },
    include: { lessonProgress: true },
  })
  if (!enrollment) return res.json({ completion: 0, lessons: [] })

  res.json({
    completion: enrollment.progressPercentage,
    lessons: enrollment.lessonProgress,
  })
})

router.post("/:courseId/lessons/:lessonId/progress", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { courseId, lessonId } = req.params
  const parsed = progressSchema.safeParse({ ...req.body, lessonId })
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const course = await prisma.course.findUnique({ where: { id: courseId }, include: { modules: { include: { lessons: true } } } })
  if (!course) return res.status(404).json({ error: "Course not found" })

  const hasAccess = await userHasCourseAccess(req.user!.id, course)
  if (!hasAccess) return res.status(403).json({ error: "No access" })

  let enrollment = await prisma.enrollment.findFirst({ where: { userId: req.user!.id, courseId } })
  if (!enrollment) {
    enrollment = await prisma.enrollment.create({ data: { userId: req.user!.id, courseId } })
  }

  const progress = await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      isCompleted: parsed.data.isCompleted ?? false,
      watchTimeSeconds: parsed.data.watchTimeSeconds ?? 0,
    },
    update: {
      isCompleted: parsed.data.isCompleted ?? undefined,
      watchTimeSeconds: parsed.data.watchTimeSeconds ?? undefined,
      completedAt: parsed.data.isCompleted ? new Date() : undefined,
    },
  })

  await updateCourseProgress(enrollment.id)

  res.json(progress)
})

async function userHasCourseAccess(userId: string | undefined, course: { id: string; isFree: boolean; price: any }) {
  if (course.isFree || !course.price || Number(course.price) === 0) return true
  if (!userId) return false

  const enrollment = await prisma.enrollment.findFirst({ where: { userId, courseId: course.id, status: "active" } })
  if (enrollment) return true

  const purchase = await prisma.purchase.findFirst({ where: { userId, courseId: course.id, status: "approved" } })
  return Boolean(purchase)
}

async function updateCourseProgress(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      lessonProgress: true,
      course: { include: { modules: { include: { lessons: true } } } },
    },
  })
  if (!enrollment) return

  const totalLessons = enrollment.course.modules.reduce((count, module) => count + module.lessons.length, 0)
  if (totalLessons === 0) return
  const completed = enrollment.lessonProgress.filter((p) => p.isCompleted).length
  const percentage = (completed / totalLessons) * 100

  await prisma.enrollment.update({ where: { id: enrollmentId }, data: { progressPercentage: percentage } })
}
