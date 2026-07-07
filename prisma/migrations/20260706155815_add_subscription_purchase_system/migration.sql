-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TourAccessSource" AS ENUM ('ADMIN', 'SELF_SERVICE');

-- AlterEnum
ALTER TYPE "AuditActionType" ADD VALUE 'PAYMENT';

-- DropIndex
DROP INDEX "TourMedia_spotId_audience_language_idx";

-- AlterTable
ALTER TABLE "TourAccess" ADD COLUMN     "source" "TourAccessSource" NOT NULL DEFAULT 'ADMIN';

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationInDays" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevicePricingTier" (
    "id" TEXT NOT NULL,
    "deviceCount" INTEGER NOT NULL,
    "additionalPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevicePricingTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPricingSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "multiDeviceDiscountEnabled" BOOLEAN NOT NULL DEFAULT true,
    "multiDeviceDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "maxDevicesPerPurchase" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPricingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPurchase" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "deviceCount" INTEGER NOT NULL,
    "basePriceAtPurchase" DECIMAL(10,2) NOT NULL,
    "deviceSurchargeAtPurchase" DECIMAL(10,2) NOT NULL,
    "discountPercentAtPurchase" DECIMAL(5,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "tourAccessId" TEXT,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPurchaseTour" (
    "purchaseId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "SubscriptionPurchaseTour_pkey" PRIMARY KEY ("purchaseId","tourId")
);

-- CreateIndex
CREATE UNIQUE INDEX "DevicePricingTier_deviceCount_key" ON "DevicePricingTier"("deviceCount");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPurchase_stripePaymentIntentId_key" ON "SubscriptionPurchase"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "SubscriptionPurchase_email_idx" ON "SubscriptionPurchase"("email");

-- CreateIndex
CREATE INDEX "SubscriptionPurchase_status_idx" ON "SubscriptionPurchase"("status");

-- AddForeignKey
ALTER TABLE "SubscriptionPurchase" ADD CONSTRAINT "SubscriptionPurchase_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPurchase" ADD CONSTRAINT "SubscriptionPurchase_tourAccessId_fkey" FOREIGN KEY ("tourAccessId") REFERENCES "TourAccess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPurchaseTour" ADD CONSTRAINT "SubscriptionPurchaseTour_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "SubscriptionPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPurchaseTour" ADD CONSTRAINT "SubscriptionPurchaseTour_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
