-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FeatureLifecycle" AS ENUM ('PLANNED', 'BETA', 'ACTIVE', 'DEPRECATED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "TourAccessStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('SIGN_IN');

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'ARCHIVE', 'ROLLBACK', 'REVOKE', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('ios', 'android');

-- AlterEnum
ALTER TYPE "BillingCycle" ADD VALUE IF NOT EXISTS 'WEEKLY';
ALTER TYPE "BillingCycle" ADD VALUE IF NOT EXISTS 'YEARLY';

-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coverMediaId" TEXT,
    "publishStatus" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "tourBundleVersion" INTEGER NOT NULL DEFAULT 1,
    "mediaVersion" INTEGER NOT NULL DEFAULT 1,
    "aiKnowledgeVersion" INTEGER NOT NULL DEFAULT 1,
    "routeVersion" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourTranslation" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourAccess" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "TourAccessStatus" NOT NULL DEFAULT 'ACTIVE',
    "ticketCount" INTEGER NOT NULL DEFAULT 1,
    "allowSubscriptionFeatures" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "activatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourAccessTour" (
    "tourAccessId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "TourAccessTour_pkey" PRIMARY KEY ("tourAccessId","tourId")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'SIGN_IN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "tourAccessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceSession" (
    "id" TEXT NOT NULL,
    "tourAccessId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "platform" "Platform" NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "staffAuthUserId" TEXT,
    "module" TEXT NOT NULL,
    "actionType" "AuditActionType" NOT NULL,
    "entityId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tour_slug_key" ON "Tour"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TourTranslation_tourId_language_key" ON "TourTranslation"("tourId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "TourTranslation_language_slug_key" ON "TourTranslation"("language", "slug");

-- CreateIndex
CREATE INDEX "TourAccess_email_idx" ON "TourAccess"("email");

-- CreateIndex
CREATE INDEX "TourAccess_status_idx" ON "TourAccess"("status");

-- CreateIndex
CREATE INDEX "OtpChallenge_email_purpose_idx" ON "OtpChallenge"("email", "purpose");

-- CreateIndex
CREATE INDEX "DeviceSession_deviceId_idx" ON "DeviceSession"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSession_tourAccessId_deviceId_key" ON "DeviceSession"("tourAccessId", "deviceId");

-- CreateIndex
CREATE INDEX "AuditLog_module_createdAt_idx" ON "AuditLog"("module", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_staffAuthUserId_idx" ON "AuditLog"("staffAuthUserId");

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourTranslation" ADD CONSTRAINT "TourTranslation_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourAccessTour" ADD CONSTRAINT "TourAccessTour_tourAccessId_fkey" FOREIGN KEY ("tourAccessId") REFERENCES "TourAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourAccessTour" ADD CONSTRAINT "TourAccessTour_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpChallenge" ADD CONSTRAINT "OtpChallenge_tourAccessId_fkey" FOREIGN KEY ("tourAccessId") REFERENCES "TourAccess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_tourAccessId_fkey" FOREIGN KEY ("tourAccessId") REFERENCES "TourAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
