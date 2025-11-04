import { Router } from "express";
import { prisma } from "../db.js";
import { body, param } from "express-validator";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// ============================================
// KRUZHOK MATCHING GAME API
// ============================================

// POST /api/kruzhok/:kruzhokId/lessons/:lessonId/matching - Сәйкестендіру ойынын құру
router.post(
  "/kruzhok/:kruzhokId/lessons/:lessonId/matching",
  protect,
  [
    param("kruzhokId").isString().trim().notEmpty(),
    param("lessonId").isString().trim().notEmpty(),
    body("title").isString().trim().notEmpty(),
    body("description").optional().isString(),
    body("difficulty").optional().isIn(["EASY", "MEDIUM", "HARD"]),
    body("timeLimit").optional().isInt({ min: 0 }),
    body("showHints").optional().isBoolean(),
    body("pointsPerMatch").optional().isInt({ min: 0 }),
    body("penaltyPerMistake").optional().isInt({ min: 0 }),
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

      const game = await prisma.kruzhokMatchingGame.create({
        data: {
          lessonId,
          ...req.body,
        },
      });

      res.status(201).json(game);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create matching game" });
    }
  }
);

// POST /api/kruzhok/matching/:gameId/pairs - Жұп қосу
router.post(
  "/kruzhok/matching/:gameId/pairs",
  protect,
  [
    param("gameId").isString().trim().notEmpty(),
    body("leftItem").isString().trim().notEmpty(),
    body("rightItem").isString().trim().notEmpty(),
    body("leftType").optional().isIn(["text", "image"]),
    body("rightType").optional().isIn(["text", "image"]),
    body("orderIndex").optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { gameId } = req.params;

      const pair = await prisma.matchingPair.create({
        data: {
          gameId,
          ...req.body,
        },
      });

      res.status(201).json(pair);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create matching pair" });
    }
  }
);

// GET /api/kruzhok/matching/:gameId - Ойынды алу
router.get(
  "/kruzhok/matching/:gameId",
  protect,
  [param("gameId").isString().trim().notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { gameId } = req.params;

      const game = await prisma.kruzhokMatchingGame.findUnique({
        where: { id: gameId },
        include: {
          pairs: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      res.json(game);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  }
);

// POST /api/kruzhok/matching/:gameId/attempt - Ойынды бастау
router.post(
  "/kruzhok/matching/:gameId/attempt",
  protect,
  [param("gameId").isString().trim().notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { gameId } = req.params;
      const userId = req.user!.id;

      // Ойынды табу
      const game = await prisma.kruzhokMatchingGame.findUnique({
        where: { id: gameId },
        include: {
          lesson: true,
        },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Мүшені табу
      const member = await prisma.kruzhokMember.findUnique({
        where: {
          kruzhokId_userId: {
            kruzhokId: game.lesson.kruzhokId,
            userId,
          },
        },
      });

      if (!member) {
        return res.status(403).json({ message: "Not a member of this kruzhok" });
      }

      // Жаңа әрекет құру
      const attempt = await prisma.matchingAttempt.create({
        data: {
          gameId,
          memberId: member.id,
        },
      });

      res.status(201).json(attempt);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to start attempt" });
    }
  }
);

// POST /api/kruzhok/matching/attempt/:attemptId/submit - Жауапты жіберу
router.post(
  "/kruzhok/matching/attempt/:attemptId/submit",
  protect,
  [
    param("attemptId").isString().trim().notEmpty(),
    body("answers").isArray().withMessage("Answers must be an array"),
    body("timeSpent").isInt({ min: 0 }).withMessage("Time spent is required"),
  ],
  validate,
  async (req, res) => {
    try {
      const { attemptId } = req.params;
      const { answers, timeSpent } = req.body;

      // Әрекетті табу
      const attempt = await prisma.matchingAttempt.findUnique({
        where: { id: attemptId },
        include: {
          game: {
            include: {
              pairs: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      });

      if (!attempt) {
        return res.status(404).json({ message: "Attempt not found" });
      }

      // Жауаптарды тексеру
      const pairs = attempt.game.pairs;
      let correctMatches = 0;
      let mistakes = 0;

      const checkedAnswers = answers.map((answer: any) => {
        const { leftIndex, rightIndex } = answer;
        const isCorrect = leftIndex === rightIndex;

        if (isCorrect) {
          correctMatches++;
        } else {
          mistakes++;
        }

        return {
          ...answer,
          isCorrect,
        };
      });

      // Ұпайларды есептеу
      const score =
        correctMatches * attempt.game.pointsPerMatch -
        mistakes * attempt.game.penaltyPerMistake;

      // Әрекетті жаңарту
      const updated = await prisma.matchingAttempt.update({
        where: { id: attemptId },
        data: {
          answers: checkedAnswers,
          score: Math.max(0, score), // Теріс болмауы керек
          mistakes,
          timeSpent,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      res.json({
        ...updated,
        correctMatches,
        totalPairs: pairs.length,
        message: "Attempt submitted successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to submit attempt" });
    }
  }
);

// GET /api/kruzhok/matching/:gameId/leaderboard - Рейтинг кестесі
router.get(
  "/kruzhok/matching/:gameId/leaderboard",
  protect,
  [param("gameId").isString().trim().notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { gameId } = req.params;

      const attempts = await prisma.matchingAttempt.findMany({
        where: {
          gameId,
          isCompleted: true,
        },
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
        orderBy: [
          { score: "desc" },
          { timeSpent: "asc" }, // Бірдей ұпай болса, жылдамырақ
        ],
        take: 50, // Топ 50
      });

      const leaderboard = attempts.map((attempt, idx) => ({
        rank: idx + 1,
        userId: attempt.member.userId,
        userName: attempt.member.user.fullName,
        score: attempt.score,
        mistakes: attempt.mistakes,
        timeSpent: attempt.timeSpent,
        completedAt: attempt.completedAt,
      }));

      res.json(leaderboard);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  }
);

export { router };
