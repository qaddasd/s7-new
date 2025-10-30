import { Router } from "express"
import multer from "multer"
import path from "path"
import crypto from "crypto"
import { env } from "../env"
import { requireAuth, requireAdmin } from "../middleware/auth"
import type { AuthenticatedRequest } from "../types"
import { ensureDir } from "../utils/fs"

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await ensureDir(env.MEDIA_DIR)
      cb(null, env.MEDIA_DIR)
    } catch (error) {
      cb(error as Error, "")
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = crypto.randomBytes(16).toString("hex")
    cb(null, `${base}${ext}`)
  },
})

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]) // add more if needed
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]) // mp4, webm, mov
const DOC_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
])
const ALLOWED_TYPES = new Set<string>([...IMAGE_TYPES, ...VIDEO_TYPES, ...DOC_TYPES])

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 200 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype) return cb(new Error("UNSUPPORTED_MEDIA_TYPE"))
    if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true)
    return cb(new Error("UNSUPPORTED_MEDIA_TYPE"))
  },
})

export const router = Router()

router.use(requireAuth)

router.post("/media", (req: AuthenticatedRequest, res) => {
  upload.single("file")(req as any, res as any, (err: any) => {
    if (err) {
      if (String(err?.message).includes("UNSUPPORTED_MEDIA_TYPE")) {
        return res.status(415).json({ error: "Unsupported file type. Allowed: jpg, png, webp, mp4, webm, mov, pdf, ppt, pptx" })
      }
      if (String((err as any)?.code) === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File too large. Max 200MB" })
      }
      return res.status(400).json({ error: String(err?.message || err) })
    }
    if (!req.file) return res.status(400).json({ error: "No file uploaded" })
    const relativePath = (req.file as any).filename
    const url = `/api/media/${relativePath}`
    return res.status(201).json({
      filename: (req.file as any).originalname,
      mimeType: (req.file as any).mimetype,
      size: (req.file as any).size,
      storagePath: (req.file as any).path,
      url,
    })
  })
})

router.delete("/media", requireAdmin, async (req, res) => {
  const { storagePath } = req.body as { storagePath?: string }
  if (!storagePath) return res.status(400).json({ error: "storagePath required" })
  try {
    const fs = await import("fs/promises")
    await fs.unlink(storagePath)
    res.json({ success: true })
  } catch (error) {
    res.status(404).json({ error: "File not found" })
  }
})
