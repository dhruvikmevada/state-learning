-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PM', 'PMO', 'DEPARTMENT_APPROVER', 'EXECUTIVE_READONLY', 'STANDARD_CONTRIBUTOR');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "WorkflowStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'APPROVED_REUSABLE', 'REJECTED', 'CLOSED');
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STANDARD_CONTRIBUTOR',
    "department" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "azureAdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Lessons
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'SUBMITTED',
    "pmApproval" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "pmoApproval" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "departmentApproval" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "finalReusableApproval" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "pmApprovalDate" TIMESTAMP(3),
    "pmoApprovalDate" TIMESTAMP(3),
    "departmentApprovalDate" TIMESTAMP(3),
    "finalApprovalDate" TIMESTAMP(3),
    "pmApprovalBy" TEXT,
    "pmoApprovalBy" TEXT,
    "departmentApprovalBy" TEXT,
    "projectNumber" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "client" TEXT,
    "location" TEXT,
    "projectType" TEXT,
    "system" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "lessonLearned" TEXT,
    "preventiveAction" TEXT,
    "costImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costAvoided" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scheduleImpact" INTEGER NOT NULL DEFAULT 0,
    "vendorRelated" BOOLEAN NOT NULL DEFAULT false,
    "vendorName" TEXT,
    "claimsRelevant" BOOLEAN NOT NULL DEFAULT false,
    "evidenceLink" TEXT,
    "minutesLink" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdByDepartment" TEXT NOT NULL,
    "primaryResponsibleDepartment" TEXT NOT NULL,
    "dateIdentified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "dateClosed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- Approval Audits
CREATE TABLE "approval_audits" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "approval_audits_pkey" PRIMARY KEY ("id")
);

-- Config Thresholds
CREATE TABLE "config_thresholds" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "config_thresholds_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_azureAdId_key" ON "users"("azureAdId");
CREATE UNIQUE INDEX "lessons_lessonId_key" ON "lessons"("lessonId");
CREATE INDEX "lessons_workflowStatus_idx" ON "lessons"("workflowStatus");
CREATE INDEX "lessons_system_idx" ON "lessons"("system");
CREATE INDEX "lessons_phase_idx" ON "lessons"("phase");
CREATE INDEX "lessons_severity_idx" ON "lessons"("severity");
CREATE INDEX "lessons_primaryResponsibleDepartment_idx" ON "lessons"("primaryResponsibleDepartment");
CREATE INDEX "lessons_projectNumber_idx" ON "lessons"("projectNumber");
CREATE INDEX "lessons_createdAt_idx" ON "lessons"("createdAt");
CREATE INDEX "approval_audits_lessonId_idx" ON "approval_audits"("lessonId");
CREATE INDEX "approval_audits_changedAt_idx" ON "approval_audits"("changedAt");
CREATE UNIQUE INDEX "config_thresholds_key_key" ON "config_thresholds"("key");

-- Foreign Keys
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "approval_audits" ADD CONSTRAINT "approval_audits_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "approval_audits" ADD CONSTRAINT "approval_audits_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
