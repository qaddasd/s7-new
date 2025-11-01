﻿import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import cookieParser from "cookie-parser"
import path from "path"
import { env } from "./env"
import { prisma } from "./db"
import { router as authRouter } from "./routes/auth"
import { router as courseRouter } from "./routes/courses"
import { router as adminRouter } from "./routes/admin"
import { router as eventsRouter } from "./routes/events"
import { router as submissionsRouter } from "./routes/submissions"
import { router as achievementsRouter } from "./routes/achievements"
import { router as bytesizeRouter } from "./routes/bytesize"
import { router as teamsRouter } from "./routes/teams"
import { router as uploadRouter } from "./routes/uploads"
import { router as clubsRouter } from "./routes/clubs"
import { router as newsRouter } from "./routes/news"
import { router as kruzhokRouter } from "./routes/kruzhok"
import { router as kruzhokLessonsRouter } from "./routes/kruzhok-lessons"
import { router as kruzhokMatchingRouter } from "./routes/kruzhok-matching"
import { router as kruzhokQuizRouter } from "./routes/kruzhok-quiz"
import { router as kruzhokOldRouter } from "./routes/kruzhok-old"
import { ensureDir } from "./utils/fs"

const app = express()

app.use(helmet())
app.use(cookieParser())
app.use(express.json({ limit: "100mb" }))
app.use(express.urlencoded({ extended: false }))
const corsOrigin = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
  : true
app.use(
  cors({
    origin: corsOrigin as any,
    credentials: true,
  })
)
app.set("trust proxy", 1)
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

ensureDir(env.MEDIA_DIR).catch((err) => console.error("Failed to ensure media dir", err))
app.use("/media", express.static(path.resolve(env.MEDIA_DIR)))
app.use("/api/media", express.static(path.resolve(env.MEDIA_DIR)))

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: "ok" })
  } catch (error) {
    res.status(500).json({ status: "error", error: String(error) })
  }
})

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: "ok" })
  } catch (error) {
    res.status(500).json({ status: "error", error: String(error) })
  }
})

app.use("/auth", authRouter)
app.use("/api/auth", authRouter)
app.use("/courses", courseRouter)
app.use("/api/admin", adminRouter)
app.use("/events", eventsRouter)
app.use("/submissions", submissionsRouter)
app.use("/achievements", achievementsRouter)
app.use("/bytesize", bytesizeRouter)
app.use("/teams", teamsRouter)
app.use("/uploads", uploadRouter)
app.use("/api/uploads", uploadRouter)
app.use("/clubs", clubsRouter)
app.use("/api/clubs", clubsRouter)
app.use("/news", newsRouter)
app.use("/api/news", newsRouter)
app.use("/api/kruzhok", kruzhokRouter)
app.use("/api/kruzhok-lessons", kruzhokLessonsRouter)
app.use("/api/kruzhok-matching", kruzhokMatchingRouter)
app.use("/api/kruzhok-quiz", kruzhokQuizRouter)
app.use("/api/kruzhok-old", kruzhokOldRouter)

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" })
})

app.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`)
})
