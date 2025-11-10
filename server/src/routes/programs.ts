import { Router, type Response } from "express"
import { z } from "zod"
import type { AuthenticatedRequest } from "../types"
import { prisma } from "../db"
import { requireAuth } from "../middleware/auth"

export const router = Router()
const db = prisma as any

router.use(requireAuth)

const programCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})
const programUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

const templateCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  orderIndex: z.number().int().min(0).optional(),
})

const templateUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  orderIndex: z.number().int().min(0).optional(),
  presentationUrl: z.string().optional(),
  scriptUrl: z.string().optional(),
  quizJson: z.any().optional(),
})

// List programs (optionally only active)
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const { active } = (req.query || {}) as any
  const where: any = {}
  if (String(active || "").toLowerCase() === "true") where.isActive = true
  const list = await db.kruzhokProgram.findMany({ where, orderBy: { createdAt: "desc" } })
  res.json(list)
})

// Create program (admin only)
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin only" })
  const parsed = programCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const created = await db.kruzhokProgram.create({ data: parsed.data })
  res.status(201).json(created)
})

// Update program (admin only)
router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin only" })
  const { id } = req.params
  const parsed = programUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const updated = await db.kruzhokProgram.update({ where: { id }, data: parsed.data })
  res.json(updated)
})

// Delete program (admin only)
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin only" })
  const { id } = req.params
  await db.kruzhokProgram.delete({ where: { id } })
  res.json({ ok: true })
})

// List lesson templates for a program
router.get("/:programId/templates", async (req: AuthenticatedRequest, res: Response) => {
  const { programId } = req.params
  const program = await db.kruzhokProgram.findUnique({ where: { id: programId }, select: { id: true } })
  if (!program) return res.status(404).json({ error: "Program not found" })
  const list = await db.kruzhokLessonTemplate.findMany({ where: { programId }, orderBy: { orderIndex: "asc" } })
  res.json(list)
})

// Create template (admin only)
router.post("/:programId/templates", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin only" })
  const { programId } = req.params
  const parsed = templateCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const prog = await db.kruzhokProgram.findUnique({ where: { id: programId }, select: { id: true } })
  if (!prog) return res.status(404).json({ error: "Program not found" })
  let orderIndex = parsed.data.orderIndex
  if (orderIndex === undefined) {
    const last = await db.kruzhokLessonTemplate.findFirst({ where: { programId }, orderBy: { orderIndex: "desc" } })
    orderIndex = (last?.orderIndex ?? 0) + 1
  }
  const created = await db.kruzhokLessonTemplate.create({ data: { programId, title: parsed.data.title, content: parsed.data.content, orderIndex } })
  res.status(201).json(created)
})

// Update template (admin only)
router.patch("/templates/:id", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin only" })
  const { id } = req.params
  const parsed = templateUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data: any = { ...parsed.data }
  if (typeof data.quizJson === 'string') {
    try { data.quizJson = JSON.parse(data.quizJson) } catch { return res.status(400).json({ error: "quizJson must be valid JSON" }) }
  }
  const updated = await db.kruzhokLessonTemplate.update({ where: { id }, data })
  res.json(updated)
})

// Delete template (admin only)
router.delete("/templates/:id", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin only" })
  const { id } = req.params
  await db.kruzhokLessonTemplate.delete({ where: { id } })
  res.json({ ok: true })
})
