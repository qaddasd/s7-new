import { Router } from "express";
import { prisma } from "../db.js";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validate.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { UserRole } from "@prisma/client";
import crypto from "crypto";

const router = Router();

// Helper function to generate a unique access code
function generateAccessCode(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

// --- ADMIN ROUTES ---

// POST /api/kruzhok - Create a new Kruzhok (requires subscription)
router.post(
  "/api/kruzhok",
  requireAuth,
  [
    body("name").isString().trim().notEmpty().withMessage("Kruzhok name is required"),
    body("description").optional().isString().trim(),
    body("maxCapacity").optional().isInt({ min: 0 }).toInt(),
  ],
  validate,
  async (req, res) => {
    const { name, description, maxCapacity } = req.body;
    const userId = req.user.id;

    try {
      // Check subscription
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription || subscription.status !== "ACTIVE") {
        return res.status(403).json({ message: "Active subscription required to create kruzhok" });
      }

      // Check kruzhok limit
      const userKruzhoks = await prisma.kruzhok.count({
        where: { adminId: userId },
      });

      if (userKruzhoks >= subscription.maxKruzhoks) {
        return res.status(403).json({
          message: `Kruzhok limit reached. Your plan allows ${subscription.maxKruzhoks} kruzhoks.`,
          currentCount: userKruzhoks,
          maxAllowed: subscription.maxKruzhoks,
        });
      }

      // Generate access code
      const accessCode = generateAccessCode();

      const kruzhok = await prisma.kruzhok.create({
        data: {
          name,
          description,
          maxCapacity,
          adminId: userId,
          accessCode,
        },
      });

      res.status(201).json(kruzhok);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create Kruzhok" });
    }
  }
);

// POST /api/admin/kruzhok - Create a new Kruzhok (admin - no limits)
router.post(
  "/admin/kruzhok",
  requireAuth,
  requireAdmin,
  [
    body("name").isString().trim().notEmpty().withMessage("Kruzhok name is required"),
    body("description").optional().isString().trim(),
    body("maxCapacity").optional().isInt({ min: 0 }).toInt(),
    body("adminId").optional().isString().trim().notEmpty().withMessage("Admin ID must be a valid string"),
    body("isPaid").optional().isBoolean().withMessage("isPaid must be a boolean"),
  ],
  validate,
  async (req, res) => {
    const { name, description, maxCapacity, adminId, isPaid } = req.body;

    try {
      // If isPaid is true, simulate payment processing
      let subscriptionStatus = "FREE";
      let subscriptionExpiresAt = null;

      if (isPaid) {
        // Simulate payment processing (in real scenario, integrate with payment gateway)
        // For now, we'll mark it as PENDING_PAYMENT and require admin to confirm
        subscriptionStatus = "PENDING_PAYMENT";
      }

      // Generate access code for free clubs or as backup for paid clubs
      const accessCode = generateAccessCode();

      const kruzhok = await prisma.kruzhok.create({
        data: {
          name,
          description,
          maxCapacity,
          adminId: adminId || null,
          isPaid: isPaid || false,
          accessCode,
          subscriptionStatus,
          subscriptionExpiresAt,
        },
      });

      res.status(201).json({
        ...kruzhok,
        message: isPaid
          ? "Paid club created. Waiting for payment confirmation."
          : "Free club created successfully.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create Kruzhok" });
    }
  }
);

// POST /api/admin/kruzhok/:id/confirm-payment - Confirm payment for paid club
router.post(
  "/admin/kruzhok/:id/confirm-payment",
  requireAuth,
  requireAdmin,
  [param("id").isString().trim().notEmpty().withMessage("Kruzhok ID is required")],
  validate,
  async (req, res) => {
    const { id } = req.params;

    try {
      const kruzhok = await prisma.kruzhok.findUnique({ where: { id } });

      if (!kruzhok) {
        return res.status(404).json({ message: "Kruzhok not found" });
      }

      if (!kruzhok.isPaid) {
        return res.status(400).json({ message: "This is not a paid club" });
      }

      // Set subscription to active for 1 year
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const updated = await prisma.kruzhok.update({
        where: { id },
        data: {
          subscriptionStatus: "ACTIVE_PAID",
          subscriptionExpiresAt: expiresAt,
        },
      });

      res.json({
        ...updated,
        message: "Payment confirmed. Subscription is now active.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  }
);

// PUT /api/admin/kruzhok/:id - Update Kruzhok details
router.put(
  "/admin/kruzhok/:id",
  requireAuth,
  requireAdmin,
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
  requireAuth,
  requireAdmin,
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

// GET /api/admin/kruzhok/:id/enrollment-requests - Get pending enrollment requests
router.get(
  "/admin/kruzhok/:id/enrollment-requests",
  requireAuth,
  requireAdmin,
  [param("id").isString().trim().notEmpty().withMessage("Kruzhok ID is required")],
  validate,
  async (req, res) => {
    const { id: kruzhokId } = req.params;

    try {
      const requests = await prisma.kruzhokMember.findMany({
        where: {
          kruzhokId,
          enrollmentStatus: "PENDING",
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });
      res.json(requests);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch enrollment requests" });
    }
  }
);

// POST /api/admin/kruzhok/:id/approve-enrollment/:memberId - Approve enrollment request
router.post(
  "/admin/kruzhok/:id/approve-enrollment/:memberId",
  requireAuth,
  requireAdmin,
  [
    param("id").isString().trim().notEmpty().withMessage("Kruzhok ID is required"),
    param("memberId").isString().trim().notEmpty().withMessage("Member ID is required"),
  ],
  validate,
  async (req, res) => {
    const { id: kruzhokId, memberId } = req.params;

    try {
      const member = await prisma.kruzhokMember.update({
        where: { id: memberId },
        data: {
          enrollmentStatus: "APPROVED",
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      res.json({
        ...member,
        message: "Enrollment request approved",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to approve enrollment" });
    }
  }
);

// POST /api/admin/kruzhok/:id/reject-enrollment/:memberId - Reject enrollment request
router.post(
  "/admin/kruzhok/:id/reject-enrollment/:memberId",
  requireAuth,
  requireAdmin,
  [
    param("id").isString().trim().notEmpty().withMessage("Kruzhok ID is required"),
    param("memberId").isString().trim().notEmpty().withMessage("Member ID is required"),
  ],
  validate,
  async (req, res) => {
    const { id: kruzhokId, memberId } = req.params;

    try {
      // Delete the rejected enrollment request
      await prisma.kruzhokMember.delete({
        where: { id: memberId },
      });

      res.json({ message: "Enrollment request rejected and deleted" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to reject enrollment" });
    }
  }
);

// POST /api/admin/kruzhok/:id/enroll - Enroll a user into the Kruzhok (direct admin enrollment)
router.post(
  "/admin/kruzhok/:id/enroll",
  requireAuth,
  requireAdmin,
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
          enrollmentStatus: "APPROVED", // Direct admin enrollment is auto-approved
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
  requireAuth,
  requireAdmin,
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
  requireAuth,
  requireAdmin,
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
  requireAuth,
  requireAdmin,
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
  requireAuth,
  requireAdmin,
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
router.post(
  "/admin/session/:sessionId/attendance",
  requireAuth,
  requireAdmin,
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
  requireAuth,
  requireAdmin,
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

// POST /api/kruzhok/enroll-by-code - User enrollment using access code
router.post(
  "/kruzhok/enroll-by-code",
  requireAuth,
  [body("accessCode").isString().trim().notEmpty().withMessage("Access code is required")],
  validate,
  async (req, res) => {
    const userId = req.user.id;
    const { accessCode } = req.body;

    try {
      // Find the kruzhok by access code
      const kruzhok = await prisma.kruzhok.findUnique({
        where: { accessCode },
      });

      if (!kruzhok) {
        return res.status(404).json({ message: "Invalid access code" });
      }

      // Check if user is already enrolled
      const existingEnrollment = await prisma.kruzhokMember.findUnique({
        where: {
          kruzhokId_userId: {
            kruzhokId: kruzhok.id,
            userId,
          },
        },
      });

      if (existingEnrollment) {
        return res.status(409).json({
          message: "You are already enrolled in this Kruzhok",
          status: existingEnrollment.enrollmentStatus,
        });
      }

      // Create enrollment request with PENDING status (needs admin approval)
      const enrollment = await prisma.kruzhokMember.create({
        data: {
          kruzhokId: kruzhok.id,
          userId,
          enrollmentStatus: "PENDING", // Pending approval from club owner
        },
        include: {
          kruzhok: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(201).json({
        ...enrollment,
        message: "Enrollment request sent. Waiting for club owner approval.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to process enrollment request" });
    }
  }
);

// GET /api/kruzhok/my-clubs - Get a list of clubs the authenticated user is enrolled in
router.get("/kruzhok/my-clubs", requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const enrollments = await prisma.kruzhokMember.findMany({
      where: {
        userId,
        enrollmentStatus: "APPROVED", // Only show approved enrollments
      },
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

// GET /api/kruzhok/my-requests - Get user's pending enrollment requests
router.get("/kruzhok/my-requests", requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const requests = await prisma.kruzhokMember.findMany({
      where: {
        userId,
        enrollmentStatus: "PENDING",
      },
      include: {
        kruzhok: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch enrollment requests" });
  }
});

// GET /api/kruzhok/my-attendance - Get the authenticated user's attendance record
router.get("/kruzhok/my-attendance", requireAuth, async (req, res) => {
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
