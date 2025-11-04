import { Router } from "express";
import { prisma } from "../db.js";
import { body, param } from "express-validator";
import { validate } from "../middleware/validate";
import { protect } from "../middleware/auth.js";
import crypto from "crypto";

const router = Router();

// ============================================
// KRUZHOK QUIZ API (KAHOOT СТИЛІ)
// ============================================

// Helper: Сессия кодын генерациялау
function generateSessionCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 таңба
}

// ============================================
// QUIZ CRUD
// ============================================

// POST /api/kruzhok/:kruzhokId/lessons/:lessonId/quiz - Квиз құру
router.post(
  "/kruzhok/:kruzhokId/lessons/:lessonId/quiz",
  protect,
  [
    param("kruzhokId").isString().trim().notEmpty(),
    param("lessonId").isString().trim().notEmpty(),
    body("title").isString().trim().notEmpty(),
    body("description").optional().isString(),
    body("timeLimit").optional().isInt({ min: 0 }),
    body("showAnswersImmediately").optional().isBoolean(),
    body("randomizeQuestions").optional().isBoolean(),
    body("randomizeOptions").optional().isBoolean(),
    body("pointsPerQuestion").optional().isInt({ min: 0 }),
    body("timeBonus").optional().isBoolean(),
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

      const quiz = await prisma.kruzhokQuiz.create({
        data: {
          lessonId,
          ...req.body,
        },
      });

      res.status(201).json(quiz);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  }
);

// POST /api/kruzhok/quiz/:quizId/questions - Квизге сұрақ қосу
router.post(
  "/kruzhok/quiz/:quizId/questions",
  protect,
  [
    param("quizId").isString().trim().notEmpty(),
    body("questionText").isString().trim().notEmpty(),
    body("type").optional().isIn(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"]),
    body("options").isArray().withMessage("Options must be an array"),
    body("imageUrl").optional().isString(),
    body("videoUrl").optional().isString(),
    body("explanation").optional().isString(),
    body("points").optional().isInt({ min: 0 }),
    body("timeLimit").optional().isInt({ min: 0 }),
    body("orderIndex").optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { quizId } = req.params;

      const question = await prisma.kruzhokQuizQuestion.create({
        data: {
          quizId,
          ...req.body,
        },
      });

      res.status(201).json(question);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create question" });
    }
  }
);

// ============================================
// QUIZ SESSION (LIVE KAHOOT СИЯҚТЫ)
// ============================================

// POST /api/kruzhok/quiz/:quizId/session/start - Квиз сессиясын бастау
router.post(
  "/kruzhok/quiz/:quizId/session/start",
  protect,
  [param("quizId").isString().trim().notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { quizId } = req.params;
      const userId = req.user!.id;

      // Квизді тексеру
      const quiz = await prisma.kruzhokQuiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              kruzhok: true,
            },
          },
        },
      });

      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const isOwner = quiz.lesson.kruzhok.adminId === userId;
      const isAdmin = req.user!.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Сессия коды генерациялау
      const sessionCode = generateSessionCode();

      const session = await prisma.kruzhokQuizSession.create({
        data: {
          quizId,
          sessionCode,
          status: "waiting",
        },
      });

      res.status(201).json({
        ...session,
        message: "Quiz session started. Share the code with participants.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to start quiz session" });
    }
  }
);

// POST /api/kruzhok/quiz/session/join - Сессияға қосылу (код арқылы)
router.post(
  "/kruzhok/quiz/session/join",
  protect,
  [
    body("sessionCode").isString().trim().notEmpty().withMessage("Session code is required"),
    body("nickname").optional().isString().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { sessionCode, nickname } = req.body;
      const userId = req.user!.id;

      // Сессияны табу
      const session = await prisma.kruzhokQuizSession.findUnique({
        where: { sessionCode },
        include: {
          quiz: {
            include: {
              lesson: true,
            },
          },
        },
      });

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Кружокқа мүше екенін тексеру
      const member = await prisma.kruzhokMember.findUnique({
        where: {
          kruzhokId_userId: {
            kruzhokId: session.quiz.lesson.kruzhokId,
            userId,
          },
        },
      });

      if (!member) {
        return res.status(403).json({ message: "Not a member of this kruzhok" });
      }

      // Қатысушы қосу
      const participant = await prisma.kruzhokQuizParticipant.upsert({
        where: {
          sessionId_memberId: {
            sessionId: session.id,
            memberId: member.id,
          },
        },
        update: {
          nickname: nickname || undefined,
        },
        create: {
          sessionId: session.id,
          memberId: member.id,
          nickname,
        },
      });

      res.json({
        ...participant,
        session,
        message: "Joined quiz session successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to join quiz session" });
    }
  }
);

// POST /api/kruzhok/quiz/session/:sessionId/answer - Жауап беру
router.post(
  "/kruzhok/quiz/session/:sessionId/answer",
  protect,
  [
    param("sessionId").isString().trim().notEmpty(),
    body("questionId").isString().trim().notEmpty(),
    body("selectedOptions").isArray().withMessage("Selected options must be an array"),
    body("timeSpent").isInt({ min: 0 }).withMessage("Time spent is required"),
  ],
  validate,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { questionId, selectedOptions, timeSpent } = req.body;
      const userId = req.user!.id;

      // Сессияны табу
      const session = await prisma.kruzhokQuizSession.findUnique({
        where: { id: sessionId },
        include: {
          quiz: {
            include: {
              lesson: true,
            },
          },
        },
      });

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Мүшені табу
      const member = await prisma.kruzhokMember.findUnique({
        where: {
          kruzhokId_userId: {
            kruzhokId: session.quiz.lesson.kruzhokId,
            userId,
          },
        },
      });

      if (!member) {
        return res.status(403).json({ message: "Not a member" });
      }

      // Сұрақты тексеру
      const question = await prisma.kruzhokQuizQuestion.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Жауапты тексеру
      const options = question.options as any[];
      let isCorrect = false;

      if (question.type === "SINGLE_CHOICE") {
        // Бір дұрыс жауап
        const correctIndex = options.findIndex((opt) => opt.isCorrect);
        isCorrect = selectedOptions.length === 1 && selectedOptions[0] === correctIndex;
      } else if (question.type === "MULTIPLE_CHOICE") {
        // Бірнеше дұрыс жауап
        const correctIndices = options
          .map((opt, idx) => (opt.isCorrect ? idx : -1))
          .filter((idx) => idx !== -1);
        isCorrect =
          selectedOptions.length === correctIndices.length &&
          selectedOptions.every((idx: number) => correctIndices.includes(idx));
      } else if (question.type === "TRUE_FALSE") {
        // Ақиқат/Жалған
        const correctIndex = options.findIndex((opt) => opt.isCorrect);
        isCorrect = selectedOptions.length === 1 && selectedOptions[0] === correctIndex;
      }

      // Ұпайларды есептеу
      let points = 0;
      if (isCorrect) {
        points = question.points;
        
        // Time bonus
        if (session.quiz.timeBonus && question.timeLimit) {
          const timePercentage = (question.timeLimit - timeSpent / 1000) / question.timeLimit;
          if (timePercentage > 0) {
            points += Math.floor(points * timePercentage * 0.5); // 50% қосымша
          }
        }
      }

      // Жауапты сақтау
      const answer = await prisma.kruzhokQuizAnswer.create({
        data: {
          questionId,
          sessionId,
          memberId: member.id,
          selectedOptions,
          isCorrect,
          timeSpent,
          points,
        },
      });

      // Қатысушының жалпы ұпайын жаңарту
      await prisma.kruzhokQuizParticipant.update({
        where: {
          sessionId_memberId: {
            sessionId,
            memberId: member.id,
          },
        },
        data: {
          totalScore: {
            increment: points,
          },
        },
      });

      res.json({
        ...answer,
        message: isCorrect ? "Correct!" : "Incorrect",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  }
);

// GET /api/kruzhok/quiz/session/:sessionId/leaderboard - Рейтинг кестесі
router.get(
  "/kruzhok/quiz/session/:sessionId/leaderboard",
  protect,
  [param("sessionId").isString().trim().notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      const participants = await prisma.kruzhokQuizParticipant.findMany({
        where: { sessionId },
        include: {
          member: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: {
          totalScore: "desc",
        },
      });

      // Рейтингті орнату
      const leaderboard = participants.map((p, idx) => ({
        ...p,
        rank: idx + 1,
      }));

      res.json(leaderboard);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  }
);

// POST /api/kruzhok/quiz/session/:sessionId/end - Сессияны аяқтау
router.post(
  "/kruzhok/quiz/session/:sessionId/end",
  protect,
  [param("sessionId").isString().trim().notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      // Сессияны табу
      const session = await prisma.kruzhokQuizSession.findUnique({
        where: { id: sessionId },
        include: {
          quiz: {
            include: {
              lesson: {
                include: {
                  kruzhok: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const isOwner = session.quiz.lesson.kruzhok.adminId === userId;
      const isAdmin = req.user!.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Сессияны аяқтау
      const updated = await prisma.kruzhokQuizSession.update({
        where: { id: sessionId },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });

      res.json({
        ...updated,
        message: "Quiz session ended",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to end session" });
    }
  }
);

export { router };
