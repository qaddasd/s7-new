import { Router, type Response } from "express"
import { z } from "zod"
import { prisma } from "../db"
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
})

router.get("/mine", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const isAdmin = req.user!.role === "ADMIN"
  const where = isAdmin
    ? { isActive: true }
    : {
        isActive: true,
        OR: [
          { ownerId: userId },
          { mentors: { some: { userId } } },
        ],
      }
  const clubs = await db.club.findMany({
    where,
    include: {
      mentors: { include: { user: true } },
      classes: {
        include: {
          enrollments: { include: { user: true } },
          scheduleItems: true,
          sessions: { orderBy: { date: "desc" }, take: 5, include: { attendances: true } },
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
      ownerId: req.user!.id,
    }
  })
  res.status(201).json(club)
  log("club.create", { id: club.id, ownerId: req.user!.id })
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

router.post("/classes/:classId/enroll-by-email", async (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.params
  const cls = await db.clubClass.findUnique({ where: { id: classId }, include: { club: true } })
  if (!cls) return res.status(404).json({ error: "Class not found" })
  const ok = await ensureAdminOrClubMentorOrOwner(req.user!.id, req.user!.role, cls.clubId)
  if (!ok) return res.status(403).json({ error: "Forbidden" })
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
  const start = new Date(from)
  const end = new Date(to)
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
  if (from) where.date = { gte: new Date(String(from)) }
  if (to) where.date = { ...(where.date || {}), lte: new Date(String(to)) }
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
        await (tx as any).user.update({ where: { id: m.studentId }, data: { experiencePoints: { increment: 100 } } })
      }
    }
  })

  res.json({ ok: true })
  log("attendance.submit", { sessionId, count: marks.length })
})
