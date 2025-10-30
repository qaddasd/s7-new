﻿import { Router, type Request, type Response } from "express"
import { prisma } from "../db"
import { optionalAuth, requireAuth } from "../middleware/auth"
import type { AuthenticatedRequest } from "../types"

export const router = Router()

function normalizeMediaUrl(u?: string | null): string | undefined {
  try {
    if (!u) return undefined
    const s = String(u)
    if (s.startsWith("/api/media/")) return s.replace("/api/media/", "/media/")
    if (s.startsWith("/media/")) return s
    const url = new URL(s)
    if (url.pathname.startsWith("/api/media/")) return url.pathname.replace("/api/media/", "/media/")
    if (url.pathname.startsWith("/media/")) return url.pathname
    return s
  } catch {
    return u || undefined
  }
}

const viewCounters = new Map<string, number>()
const lastViewByIp: Map<string, number> = new Map()

router.get("/", optionalAuth, async (req, res) => {
  const includeLiked = Boolean(req.user)
  const items = await (prisma as any).byteSizeItem.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { likes: true } },
      ...(includeLiked ? { likes: { where: { userId: req.user!.id } } } : {}),
    } as any,
  })
  const tag = (req.query.tag as string | undefined)?.trim()
  const filtered = tag && tag.toLowerCase() !== "all"
    ? items.filter((it: any) => Array.isArray(it.tags) && it.tags.some((t: string) => String(t).toLowerCase() === tag.toLowerCase()))
    : items
  res.json(
    filtered.map((it: any) => {
      const rawTags = Array.isArray(it.tags) ? it.tags : []
      const linkTag = rawTags.find((t: any) => typeof t === "string" && t.startsWith("__course:"))
      const linkedCourseId = (it as any).linkedCourseId || (typeof linkTag === "string" ? linkTag.slice("__course:".length) : undefined)
      const publicTags = rawTags.filter((t: any) => !(typeof t === "string" && t.startsWith("__course:")))
      return {
        id: it.id,
        title: it.title,
        description: it.description,
        videoUrl: normalizeMediaUrl(it.videoUrl) || it.videoUrl,
        coverImageUrl: normalizeMediaUrl(it.coverImageUrl) || it.coverImageUrl,
        tags: publicTags,
        linkedCourseId,
        createdAt: it.createdAt,
        views: (it as any).views ?? viewCounters.get(it.id) ?? 0,
        likesCount: it._count?.likes ?? 0,
        likedByMe: Array.isArray(it.likes) ? it.likes.length > 0 : false,
      }
    })
  )
})

router.post("/:id/like", requireAuth, async (req, res) => {
  const id = req.params.id
  const existing = await (prisma as any).byteSizeLike.findUnique({ where: { itemId_userId: { itemId: id, userId: req.user!.id } } }).catch(
    () => null
  )
  if (existing) {
    await (prisma as any).byteSizeLike.delete({ where: { id: existing.id } })
  } else {
    await (prisma as any).byteSizeLike.create({ data: { itemId: id, userId: req.user!.id } })
  }
  const count = await (prisma as any).byteSizeLike.count({ where: { itemId: id } })
  const liked = !existing
  res.json({ liked, likesCount: count })
})

router.post("/:id/view", async (req, res) => {
  const id = req.params.id
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || (req.socket?.remoteAddress || "")
  const key = `${ip}|${id}`
  const now = Date.now()
  const last = lastViewByIp.get(key) || 0
  if (now - last < 60_000) return res.json({ ok: true, skipped: true })
  lastViewByIp.set(key, now)
  const updated = await (prisma as any).byteSizeItem.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => null)
  if (!updated) {
    viewCounters.set(id, (viewCounters.get(id) || 0) + 1)
  }
  res.json({ ok: true })
})
