import { Router } from "express";
import { prisma } from "../db.js";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ============================================
// KRUZHOK LESSONS API
// ============================================

// GET /api/kruzhok/:kruzhokId/lessons - Кружоктың барлық сабақтары
router.get(
  "/kruzhok/:kruzhokId/lessons",
  requireAuth,
  [param("kruzhokId").isString().trim().notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { kruzhokId } = req.params;
      const userId = req.user!.id;

      // Кружокқа мүше екенін тексеру
      const member = await prisma.kruzhokMember.findUnique({
        where: {
          kruzhokId_userId: {
            kruzhokId,
            userId,
          },
        },
      });

      // Немесе админ/иесі екенін тексеру
      const kruzhok = await prisma.kruzhok.findUnique({
        where: { id: kruzhokId },
      });

      const isOwner = kruzhok?.adminId === userId;
      const isAdmin = req.user!.role === "ADMIN";

      if (!member && !isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const lessons = await prisma.kruzhokLesson.findMany({
        where: { kruzhokId },
        orderBy: { orderIndex: "asc" },
        include: {
          quizzes: {
            select: {
              id: true,
              title: true,
              isActive: true,
            },
          },
          matchingGames: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              isActive: true,
            },
          },
          progress: member
            ? {
                where: { memberId: member.id },
                select: {
                  isCompleted: true,
                  completedAt: true,
                  watchTimeSeconds: true,
                },
              }
            : undefined,
        },
      });

      res.json(lessons);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  }
);

// GET /api/kruzhok/:kruzhokId/lessons/:lessonId - Сабақтың толық ақпараты
router.get(
  "/kruzhok/:kruzhokId/lessons/:lessonId",
  requireAuth,
  [
    param("kruzhokId").isString().trim().notEmpty(),
    param("lessonId").isString().trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { kruzhokId, lessonId } = req.params;
      const userId = req.user!.id;

      // Қол жетімділікті тексеру
      const member = await prisma.kruzhokMember.findUnique({
        where: {
          kruzhokId_userId: {
            kruzhokId,
            userId,
          },
        },
      });

      const kruzhok = await prisma.kruzhok.findUnique({
        where: { id: kruzhokId },
      });

      const isOwner = kruzhok?.adminId === userId;
      const isAdmin = req.user!.role === "ADMIN";

      if (!member && !isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const lesson = await prisma.kruzhokLesson.findUnique({
        where: { id: lessonId },
        include: {
          quizzes: {
            include: {
              questions: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
          matchingGames: {
            include: {
              pairs: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
          progress: member
            ? {
                where: { memberId: member.id },
              }
            : undefined,
        },
      });

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Егер сабақ жарияланбаған болса, тек иесі/админ көре алады
      if (!lesson.isPublished && !isOwner && !isAdmin) {
        return res.status(403).json({ message: "Lesson not published" });
      }

      res.json(lesson);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  }
);

// POST /api/kruzhok/:kruzhokId/lessons - Жаңа сабақ құру (тек иесі/админ)
router.post(
  "/kruzhok/:kruzhokId/lessons",
  requireAuth,
  [
    param("kruzhokId").isString().trim().notEmpty(),
    body("title").isString().trim().notEmpty().withMessage("Title is required"),
    body("description").optional().isString(),
    body("type").optional().isIn(["TEXT", "VIDEO", "PRESENTATION", "QUIZ", "MATCHING_GAME", "MIXED"]),
    body("content").optional().isString(),
    body("videoUrl").optional().isString(),
    body("presentationUrl").optional().isString(),
    body("slides").optional().isObject(),
    body("attachments").optional().isArray(),
    body("orderIndex").optional().isInt({ min: 0 }),
    body("isPublished").optional().isBoolean(),
    body("isFree").optional().isBoolean(),
    body("showAccessCode").optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const { kruzhokId } = req.params;
      const userId = req.user!.id;

      // Тек иесі немесе админ құра алады
      const kruzhok = await prisma.kruzhok.findUnique({
        where: { id: kruzhokId },
      });

      if (!kruzhok) {
        return res.status(404).json({ message: "Kruzhok not found" });
      }

      const isOwner = kruzhok.adminId === userId;
      const isAdmin = req.user!.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const {
        title,
        description,
        type,
        content,
        videoUrl,
        presentationUrl,
        slides,
        attachments,
        orderIndex,
        isPublished,
        isFree,
        showAccessCode,
      } = req.body;

      const lesson = await prisma.kruzhokLesson.create({
        data: {
          kruzhokId,
          title,
          description,
          type: type || "TEXT",
          content,
          videoUrl,
          presentationUrl,
          slides,
          attachments,
          orderIndex: orderIndex || 0,
          isPublished: isPublished !== undefined ? isPublished : false,
          isFree: isFree !== undefined ? isFree : false,
          showAccessCode: showAccessCode !== undefined ? showAccessCode : false,
        },
      });

      res.status(201).json(lesson);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  }
);

// PUT /api/kruzhok/:kruzhokId/lessons/:lessonId - Сабақты жаңарту
router.put(
  "/kruzhok/:kruzhokId/lessons/:lessonId",
  requireAuth,
  [
    param("kruzhokId").isString().trim().notEmpty(),
    param("lessonId").isString().trim().notEmpty(),
    body("title").optional().isString().trim().notEmpty(),
    body("description").optional().isString(),
    body("type").optional().isIn(["TEXT", "VIDEO", "PRESENTATION", "QUIZ", "MATCHING_GAME", "MIXED"]),
    body("content").optional().isString(),
    body("videoUrl").optional().isString(),
    body("presentationUrl").optional().isString(),
    body("slides").optional().isObject(),
    body("attachments").optional().isArray(),
    body("orderIndex").optional().isInt({ min: 0 }),
    body("isPublished").optional().isBoolean(),
    body("isFree").optional().isBoolean(),
    body("showAccessCode").optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const { kruzhokId, lessonId } = req.params;
      const userId = req.user!.id;

      // Қол жетімділікті тексеру
      const kruzhok = await prisma.kruzhok.findUnique({
        where: { id: kruzhokId },
      });

      if (!kruzhok) {
        return res.status(404).json({ message: "Kruzhok not found" });
      }

      const isOwner = kruzhok.adminId === userId;
      const isAdmin = req.user!.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const lesson = await prisma.kruzhokLesson.update({
        where: { id: lessonId },
        data: req.body,
      });

      res.json(lesson);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  }
);

// DELETE /api/kruzhok/:kruzhokId/lessons/:lessonId - Сабақты жою
router.delete(
  "/kruzhok/:kruzhokId/lessons/:lessonId",
  requireAuth,
  [
    param("kruzhokId").isString().trim().notEmpty(),
    param("lessonId").isString().trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { kruzhokId, lessonId } = req.params;
      const userId = req.user!.id;

      // Қол жетімділікті тексеру
      const kruzhok = await prisma.kruzhok.findUnique({
        where: { id: kruzhokId },
      });

      if (!kruzhok) {
        return res.status(404).json({ message: "Kruzhok not found" });
      }

      const isOwner = kruzhok.adminId === userId;
      const isAdmin = req.user!.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      await prisma.kruzhokLesson.delete({
        where: { id: lessonId },
      });

      res.json({ message: "Lesson deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  }
);

// POST /api/kruzhok/:kruzhokId/lessons/:lessonId/complete - Сабақты аяқтау
router.post(
  "/kruzhok/:kruzhokId/lessons/:lessonId/complete",
  requireAuth,
  [
    param("kruzhokId").isString().trim().notEmpty(),
    param("lessonId").isString().trim().notEmpty(),
    body("watchTimeSeconds").optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { kruzhokId, lessonId } = req.params;
      const userId = req.user!.id;
      const { watchTimeSeconds } = req.body;

      // Мүше екенін тексеру
      const member = await prisma.kruzhokMember.findUnique({
        where: {
          kruzhokId_userId: {
            kruzhokId,
            userId,
          },
        },
      });

      if (!member) {
        return res.status(403).json({ message: "Not a member of this kruzhok" });
      }

      const progress = await prisma.kruzhokLessonProgress.upsert({
        where: {
          lessonId_memberId: {
            lessonId,
            memberId: member.id,
          },
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
          watchTimeSeconds: watchTimeSeconds || 0,
        },
        create: {
          lessonId,
          memberId: member.id,
          isCompleted: true,
          completedAt: new Date(),
          watchTimeSeconds: watchTimeSeconds || 0,
        },
      });

      res.json(progress);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to mark lesson as complete" });
    }
  }
);

export { router };
