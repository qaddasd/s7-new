import { Router, type Request, type Response } from "express"
import { z } from "zod"
import { prisma } from "../db"
import { requireAuth } from "../middleware/auth"
import type { AuthenticatedRequest } from "../types"

export const router = Router()

const competitionSubmissionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectSummary: z.string().optional(),
  venue: z.string().optional(),
  placement: z.string().optional(),
  eventDate: z.union([z.string(), z.date()]).optional(),
  imageUrl: z.string().optional(),
})

router.get("/competitions/mine", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const list = await prisma.competitionSubmission.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" } })
  res.json(list)
})

router.post("/competitions", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = competitionSubmissionSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data = parsed.data
  const img = typeof data.imageUrl === 'string' && /^https?:\/\//i.test(data.imageUrl) ? data.imageUrl : undefined
  const created = await prisma.competitionSubmission.create({
    data: {
      userId: req.user!.id,
      title: data.title,
      description: data.description,
      projectSummary: data.projectSummary,
      venue: data.venue,
      placement: data.placement,
      eventDate: data.eventDate ? new Date(data.eventDate as any) : undefined,
      imageUrl: img,
      status: "pending",
    },
  })
  res.status(201).json(created)
})
