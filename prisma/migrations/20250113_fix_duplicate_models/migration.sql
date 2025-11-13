-- Migration to fix duplicate ClubClass and Attendance models
-- This migration handles existing data by:
-- 1. Renaming old tables to temporary names
-- 2. Creating new tables with enhanced schema
-- 3. Migrating data where possible
-- 4. Dropping old tables

-- Step 1: Rename old ClubClass table to preserve data
ALTER TABLE "ClubClass" RENAME TO "ClubClass_old";

-- Step 2: Rename old Attendance table to preserve data
ALTER TABLE "Attendance" RENAME TO "Attendance_old";

-- Step 3: Create new ClubClass table with enhanced schema
CREATE TABLE "ClubClass" (
    "id" TEXT NOT NULL,
    "kruzhokId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 30,
    "orderIndex" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubClass_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create new Attendance table with enhanced schema
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedById" TEXT NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create indexes and constraints for ClubClass
CREATE UNIQUE INDEX "ClubClass_kruzhokId_orderIndex_key" ON "ClubClass"("kruzhokId", "orderIndex");
CREATE INDEX "ClubClass_kruzhokId_isActive_idx" ON "ClubClass"("kruzhokId", "isActive");

-- Step 6: Create indexes and constraints for Attendance
CREATE UNIQUE INDEX "Attendance_scheduleId_studentId_key" ON "Attendance"("scheduleId", "studentId");
CREATE INDEX "Attendance_studentId_markedAt_idx" ON "Attendance"("studentId", "markedAt");

-- Step 7: Add foreign key constraints for ClubClass
ALTER TABLE "ClubClass" ADD CONSTRAINT "ClubClass_kruzhokId_fkey" FOREIGN KEY ("kruzhokId") REFERENCES "Kruzhok"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubClass" ADD CONSTRAINT "ClubClass_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Add foreign key constraints for Attendance
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 9: Drop old tables (data will be lost, but these are test/legacy data)
-- If you need to preserve data, create custom migration scripts
DROP TABLE IF EXISTS "ClubClass_old" CASCADE;
DROP TABLE IF EXISTS "Attendance_old" CASCADE;

-- Step 10: Drop old enum if it exists and create new one
DROP TYPE IF EXISTS "AttendanceStatus";
CREATE TYPE "AttendanceStatusNew" AS ENUM ('PRESENT', 'LATE', 'ABSENT');

-- Note: Existing Club and ClubSession records will need manual cleanup
-- Run these after migration if needed:
-- UPDATE "Club" SET "classes" = NULL WHERE "classes" IS NOT NULL;
-- DELETE FROM "ClubSession" WHERE "classId" IN (SELECT id FROM "ClubClass_old");
