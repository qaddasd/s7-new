import { Router, type Request, type Response } from "express"
import { prisma } from "../db"
import { requireAuth } from "../middleware/auth"
import type { AuthenticatedRequest } from "../types"

export const router = Router()

router.get("/mine", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const list = await prisma.userAchievement.findMany({
    where: { userId: req.user!.id },
    orderBy: { earnedAt: "desc" },
    include: { achievement: true },
  })
  res.json(
    list.map((ua) => ({
      id: ua.id,
      earnedAt: ua.earnedAt,
      achievement: {
        id: ua.achievement.id,
        title: ua.achievement.title,
        description: ua.achievement.description,
        iconUrl: ua.achievement.iconUrl,
      },
      awardedById: ua.awardedById,
    }))
  )
})
