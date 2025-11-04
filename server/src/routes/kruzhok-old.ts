import { Router } from "express";
import { prisma } from "../db.js";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validate.js";
import { isAdmin, protect } from "../middleware/auth.js";
import { UserRole } from "@prisma/client";

const router = Router();

// --- ADMIN ROUTES ---

// POST /api/admin/kruzhok - Create a new Kruzhok
router.post(
  "/admin/kruzhok",
  protect,
  isAdmin,
  [
    body("name").isString().trim().notEmpty().withMessage("Kruzhok name is required"),
    body("description").optional().isString().trim(),
    body("maxCapacity").optional().isInt({ min: 0 }).toInt(),
    body("adminId").optional().isString().trim().notEmpty().withMessage("Admin ID must be a valid string"),
  ],
  validate,
  async (req, res) => {
    const { name, description, maxCapacity, adminId } = req.body;

    try {
      const kruzhok = await prisma.kruzhok.create({
        data: {
          name,
          description,
          maxCapacity,
          adminId: adminId || null,
        },
      });
      res.status(201).json(kruzhok);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create Kruzhok" });
    }
  }
);

// PUT /api/admin/kruzhok/:id - Update Kruzhok details
router.put(
  "/admin/kruzhok/:id",
  protect,
  isAdmin,
  [
    param("id").isString().trim().notEmpty().withMessage("Kruzhok ID is required"),
    body("name").optional().isString().trim().notEmpty(),
    body("description").optional().isString().trim(),
    body("maxCapacity").optional().isInt({ min: 0 }).toInt(),
    body("isActive").optional().isBoolean(),
    body("adminId").optional().isString().trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { id } = req.params;
    const { name, description, maxCapacity, isActive, adminId } = req.body;

    try {
      const kruzhok = await prisma.kruzhok.update({
        where: { id },
        data: {
          name,
          description,
          maxCapacity,
          isActive,
          adminId,
        },
      });
      res.json(kruzhok);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update Kruzhok" });
    }
  }
);

// DELETE /api/admin/kruzhok/:id - Delete a Kruzhok
router.delete(
  "/admin/kruzhok/:id",
  protect,
  isAdmin,
  [param("id").isString().trim().notEmpty().withMessage("Kruzhok ID is required")],
  validate,
  async (req, res) => {
    const { id } = req.params;

    try {
      await prisma.kruzhok.delete({
        where: { id },
      });
      res.json({ message: "Kruzhok successfully deleted" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete Kruzhok" });
    }
  }
);

// POST /api/admin/kruzhok/:id/enroll - Enroll a user into the Kruzhok
router.post(
  "/admin/kruzhok/:id/enroll",
  protect,
  isAdmin,
  [
    param("id").isString().trim().notEmpty().withMessage("Kruzhok ID is required"),
    body("userId").isString().trim().notEmpty().withMessage("User ID is required"),
  ],
  validate,
  async (req, res) => {
    const { id: kruzhokId } = req.params;
    const { userId } = req.body;

    try {
      // Check if user is already enrolled
      const existingEnrollment = await prisma.kruzhokMember.findUnique({
        where: {
          kruzhokId_userId: {
            kruzhokId,
            userId,
          },
        },
      });

      if (existingEnrollment) {
        return res.status(409).json({ message: "User is already enrolled in this Kruzhok" });
      }

      const enrollment = await prisma.kruzhokMember.create({
        data: {
          kruzhokId,
          userId,
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });
      res.status(201).json(enrollment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to enroll user" });
    }
  }
);

// DELETE /api/admin/kruzhok/:kruzhokId/unenroll/:userId - Unenroll a user
router.delete(
  "/admin/kruzhok/:kruzhokId/unenroll/:userId",
  protect,
  isAdmin,
  [
    param("kruzhokId").isString().trim().notEmpty().withMessage("Kruzhok ID is required"),
    param("userId").isString().trim().notEmpty().withMessage("User ID is required"),
  ],
  validate,
  async (req, res) => {
    const { kruzhokId, userId } = req.params;

    try {
      await prisma.kruzhokMember.delete({
        where: {
          kruzhokId_userId: {
            kruzhokId,
            userId,
          },
        },
      });
      res.json({ message: "User successfully unenrolled" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to unenroll user" });
    }
  }
);

// GET /api/admin/kruzhok/:id/members - Get all members of a Kruzhok
router.get(
  "/admin/kruzhok/:id/members",
  protect,
  isAdmin,
  [param("id").isString().trim().notEmpty().withMessage("Kruzhok ID is required")],
  validate,
  async (req, res) => {
    const { id: kruzhokId } = req.params;

    try {
      const members = await prisma.kruzhokMember.findMany({
        where: { kruzhokId },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });
      res.json(members);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  }
);

// POST /api/admin/kruzhok/:id/session - Create a new session for a Kruzhok
router.post(
  "/admin/kruzhok/:id/session",
  protect,
  isAdmin,
  [
    param("id").isString().trim().notEmpty().withMessage("Kruzhok ID is required"),
    body("sessionDate").isISO8601().toDate().withMessage("Valid session date is required"),
    body("topic").optional().isString().trim(),
  ],
  validate,
  async (req, res) => {
    const { id: kruzhokId } = req.params;
    const { sessionDate, topic } = req.body;

    try {
      const session = await prisma.kruzhokSession.create({
        data: {
          kruzhokId,
          sessionDate,
          topic,
        },
      });
      res.status(201).json(session);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create session" });
    }
  }
);

// GET /api/admin/kruzhok/:id/sessions - Get all sessions for a Kruzhok
router.get(
  "/admin/kruzhok/:id/sessions",
  protect,
  isAdmin,
  [param("id").isString().trim().notEmpty().withMessage("Kruzhok ID is required")],
  validate,
  async (req, res) => {
    const { id: kruzhokId } = req.params;

    try {
      const sessions = await prisma.kruzhokSession.findMany({
        where: { kruzhokId },
        orderBy: { sessionDate: "desc" },
      });
      res.json(sessions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  }
);

// POST /api/admin/session/:sessionId/attendance - Record attendance for a session
// Expects body: [{ memberId: string, status: 'present' | 'absent' | 'late' | 'excused', notes?: string }]
router.post(
  "/admin/session/:sessionId/attendance",
  protect,
  isAdmin,
  [
    param("sessionId").isString().trim().notEmpty().withMessage("Session ID is required"),
    body().isArray().withMessage("Body must be an array of attendance records"),
    body("*.memberId").isString().trim().notEmpty().withMessage("Member ID is required for each record"),
    body("*.status").isIn(["present", "absent", "late", "excused"]).withMessage("Invalid attendance status"),
    body("*.notes").optional().isString().trim(),
  ],
  validate,
  async (req, res) => {
    const { sessionId } = req.params;
    const attendanceRecords = req.body;

    try {
      const recordsToUpsert = attendanceRecords.map((record: any) => ({
        where: {
          sessionId_memberId: {
            sessionId,
            memberId: record.memberId,
          },
        },
        update: {
          status: record.status,
          notes: record.notes,
          recordedAt: new Date(),
        },
        create: {
          sessionId,
          memberId: record.memberId,
          status: record.status,
          notes: record.notes,
        },
      }));

      // Use a transaction to ensure all updates are atomic
      const results = await prisma.$transaction(
        recordsToUpsert.map((record) => prisma.attendanceRecord.upsert(record))
      );

      res.json({ message: "Attendance recorded successfully", results });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to record attendance" });
    }
  }
);

// GET /api/admin/session/:sessionId/attendance - Get attendance for a session
router.get(
  "/admin/session/:sessionId/attendance",
  protect,
  isAdmin,
  [param("sessionId").isString().trim().notEmpty().withMessage("Session ID is required")],
  validate,
  async (req, res) => {
    const { sessionId } = req.params;

    try {
      const attendance = await prisma.attendanceRecord.findMany({
        where: { sessionId },
        include: {
          member: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
        },
      });
      res.json(attendance);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  }
);


// --- PUBLIC/USER ROUTES ---

// GET /api/kruzhok - Get a list of all active Kruzhoks
router.get("/kruzhok", async (_req, res) => {
  try {
    const kruzhoks = await prisma.kruzhok.findMany({
      where: { isActive: true },
      include: {
        admin: {
          select: { id: true, fullName: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });
    res.json(kruzhoks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch Kruzhoks" });
  }
});

// GET /api/kruzhok/my-clubs - Get a list of clubs the authenticated user is enrolled in
router.get("/kruzhok/my-clubs", protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const enrollments = await prisma.kruzhokMember.findMany({
      where: { userId },
      include: {
        kruzhok: {
          include: {
            admin: {
              select: { id: true, fullName: true },
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    const myClubs = enrollments.map((e) => e.kruzhok);
    res.json(myClubs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user's clubs" });
  }
});

// GET /api/kruzhok/my-attendance - Get the authenticated user's attendance record
router.get("/kruzhok/my-attendance", protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const memberRecords = await prisma.kruzhokMember.findMany({
      where: { userId },
      select: {
        id: true,
        kruzhok: {
          select: { id: true, name: true },
        },
      },
    });

    const memberIds = memberRecords.map((m) => m.id);

    const attendance = await prisma.attendanceRecord.findMany({
      where: {
        memberId: {
          in: memberIds,
        },
      },
      include: {
        session: {
          select: {
            sessionDate: true,
            topic: true,
            kruzhok: {
              select: { name: true, id: true },
            },
          },
        },
      },
      orderBy: {
        recordedAt: "desc",
      },
    });

    // Map the attendance records to include the kruzhok name directly
    const result = attendance.map((record) => ({
      status: record.status,
      notes: record.notes,
      recordedAt: record.recordedAt,
      sessionDate: record.session.sessionDate,
      sessionTopic: record.session.topic,
      kruzhokName: record.session.kruzhok.name,
      kruzhokId: record.session.kruzhok.id,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user's attendance" });
  }
});


export { router };
