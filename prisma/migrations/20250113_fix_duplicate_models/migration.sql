-- Migration to fix duplicate ClubClass and Attendance models
-- This migration safely handles schema changes by checking for existing objects

-- Step 1: Drop foreign key constraints that reference old tables
DO $$ 
BEGIN
    -- Drop FK from ClubSession if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClubSession_classId_fkey') THEN
        ALTER TABLE "ClubSession" DROP CONSTRAINT "ClubSession_classId_fkey";
    END IF;
    
    -- Drop FK from ClassEnrollment if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClassEnrollment_classId_fkey') THEN
        ALTER TABLE "ClassEnrollment" DROP CONSTRAINT "ClassEnrollment_classId_fkey";
    END IF;
    
    -- Drop FK from ScheduleItem if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleItem_classId_fkey') THEN
        ALTER TABLE "ScheduleItem" DROP CONSTRAINT "ScheduleItem_classId_fkey";
    END IF;
    
    -- Drop FK from ClubResource if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClubResource_classId_fkey') THEN
        ALTER TABLE "ClubResource" DROP CONSTRAINT "ClubResource_classId_fkey";
    END IF;
    
    -- Drop FK from ClubAssignment if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClubAssignment_classId_fkey') THEN
        ALTER TABLE "ClubAssignment" DROP CONSTRAINT "ClubAssignment_classId_fkey";
    END IF;
END $$;

-- Step 2: Drop old tables if they exist (will cascade delete related data)
DROP TABLE IF EXISTS "ClubClass" CASCADE;
DROP TABLE IF EXISTS "Attendance" CASCADE;

-- Step 3: Drop old enums if they exist
DROP TYPE IF EXISTS "AttendanceStatus" CASCADE;

-- Step 4: Create new ClubClass table with enhanced schema
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

-- Step 5: Create new Attendance table with enhanced schema
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

-- Step 6: Create new enum
CREATE TYPE "AttendanceStatusNew" AS ENUM ('PRESENT', 'LATE', 'ABSENT');

-- Step 6.5: Create ScheduleStatus enum if not exists
DO $$ BEGIN
    CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 6.6: Create Schedule table if not exists
CREATE TABLE IF NOT EXISTS "Schedule" (
    "id" TEXT NOT NULL,
    "kruzhokId" TEXT NOT NULL,
    "classId" TEXT,
    "lessonTemplateId" TEXT,
    "title" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- Step 6.7: Create indexes for Schedule if not exists
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "Schedule_kruzhokId_scheduledDate_idx" ON "Schedule"("kruzhokId", "scheduledDate");
    CREATE INDEX IF NOT EXISTS "Schedule_scheduledDate_status_idx" ON "Schedule"("scheduledDate", "status");
    CREATE INDEX IF NOT EXISTS "Schedule_createdById_idx" ON "Schedule"("createdById");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Step 6.8: Add foreign key constraints for Schedule
DO $$
BEGIN
    -- Add Kruzhok FK if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Schedule_kruzhokId_fkey') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Kruzhok') THEN
            ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_kruzhokId_fkey" FOREIGN KEY ("kruzhokId") REFERENCES "Kruzhok"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    -- Add ClubClass FK if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Schedule_classId_fkey') THEN
        ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClubClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- Add KruzhokLessonTemplate FK if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Schedule_lessonTemplateId_fkey') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'KruzhokLessonTemplate') THEN
            ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_lessonTemplateId_fkey" FOREIGN KEY ("lessonTemplateId") REFERENCES "KruzhokLessonTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
    
    -- Add User FK if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Schedule_createdById_fkey') THEN
        ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 7: Create indexes for ClubClass
CREATE UNIQUE INDEX "ClubClass_kruzhokId_orderIndex_key" ON "ClubClass"("kruzhokId", "orderIndex");
CREATE INDEX "ClubClass_kruzhokId_isActive_idx" ON "ClubClass"("kruzhokId", "isActive");

-- Step 8: Create indexes for Attendance
CREATE UNIQUE INDEX "Attendance_scheduleId_studentId_key" ON "Attendance"("scheduleId", "studentId");
CREATE INDEX "Attendance_studentId_markedAt_idx" ON "Attendance"("studentId", "markedAt");

-- Step 9: Add foreign key constraints for ClubClass
ALTER TABLE "ClubClass" ADD CONSTRAINT "ClubClass_kruzhokId_fkey" FOREIGN KEY ("kruzhokId") REFERENCES "Kruzhok"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubClass" ADD CONSTRAINT "ClubClass_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 10: Add foreign key constraints for Attendance (only if referenced tables exist)
DO $$
BEGIN
    -- Only add Schedule FK if Schedule table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Schedule') THEN
        ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- Add User FKs (User table should always exist)
    ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
END $$;
