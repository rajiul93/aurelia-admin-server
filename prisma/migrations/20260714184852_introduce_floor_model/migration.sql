-- CreateEnum
CREATE TYPE "TransitionType" AS ENUM ('STAIRS', 'ELEVATOR', 'LIFT', 'RAMP', 'ESCALATOR');

-- CreateTable Floor
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "floorNo" INTEGER NOT NULL,
    "mapTileUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable FloorTranslation
CREATE TABLE "FloorTranslation" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "audience" "AudienceType" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable FloorTransitionPoint
CREATE TABLE "FloorTransitionPoint" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "type" "TransitionType" NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "connectsToFloorId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorTransitionPoint_pkey" PRIMARY KEY ("id")
);

-- Step 1: Create Floor records for existing tours (all spots go to Floor 1)
INSERT INTO "Floor" ("id", "tourId", "floorNo", "sortOrder", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  "id",
  1,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Tour";

-- Step 2: Add floorId column to Spot table (nullable first)
ALTER TABLE "Spot" ADD COLUMN "floorId" TEXT;

-- Step 3: Update all spots to belong to Floor 1 of their tour
UPDATE "Spot"
SET "floorId" = (
  SELECT "Floor"."id"
  FROM "Floor"
  WHERE "Floor"."tourId" = "Spot"."tourId" AND "Floor"."floorNo" = 1
  LIMIT 1
);

-- Step 4: Make floorId NOT NULL
ALTER TABLE "Spot" ALTER COLUMN "floorId" SET NOT NULL;

-- Step 5: Add FK constraint on floorId
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE;

-- Step 6: Add floorId column to TourRoute (nullable first)
ALTER TABLE "TourRoute" ADD COLUMN "floorId" TEXT;

-- Step 7: Update all routes to belong to Floor 1 of their tour
UPDATE "TourRoute"
SET "floorId" = (
  SELECT "Floor"."id"
  FROM "Floor"
  WHERE "Floor"."tourId" = "TourRoute"."tourId" AND "Floor"."floorNo" = 1
  LIMIT 1
);

-- Step 8: Make floorId NOT NULL
ALTER TABLE "TourRoute" ALTER COLUMN "floorId" SET NOT NULL;

-- Step 9: Add FK constraint on floorId
ALTER TABLE "TourRoute" ADD CONSTRAINT "TourRoute_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE;

-- Step 10: Drop old tourId FK from TourRoute (but keep tourId column for now, deprecated)
ALTER TABLE "TourRoute" DROP CONSTRAINT "TourRoute_tourId_fkey";
ALTER TABLE "TourRoute" DROP CONSTRAINT "TourRoute_tourId_key";

-- Step 11: Update Spot index from tourId to floorId
DROP INDEX "Spot_tourId_sortOrder_idx";
CREATE INDEX "Spot_floorId_sortOrder_idx" ON "Spot"("floorId", "sortOrder");

-- Step 12: Drop old tourId FK from Spot (but keep tourId column for now, deprecated)
ALTER TABLE "Spot" DROP CONSTRAINT "Spot_tourId_fkey";

-- CreateIndex Floor
CREATE UNIQUE INDEX "Floor_tourId_floorNo_key" ON "Floor"("tourId", "floorNo");
CREATE INDEX "Floor_tourId_idx" ON "Floor"("tourId");

-- CreateIndex FloorTranslation
CREATE UNIQUE INDEX "FloorTranslation_floorId_language_audience_key" ON "FloorTranslation"("floorId", "language", "audience");

-- CreateIndex FloorTransitionPoint
CREATE INDEX "FloorTransitionPoint_floorId_idx" ON "FloorTransitionPoint"("floorId");
CREATE INDEX "FloorTransitionPoint_connectsToFloorId_idx" ON "FloorTransitionPoint"("connectsToFloorId");

-- AddForeignKey Floor
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE;

-- AddForeignKey FloorTranslation
ALTER TABLE "FloorTranslation" ADD CONSTRAINT "FloorTranslation_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE;

-- AddForeignKey FloorTransitionPoint
ALTER TABLE "FloorTransitionPoint" ADD CONSTRAINT "FloorTransitionPoint_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE;
ALTER TABLE "FloorTransitionPoint" ADD CONSTRAINT "FloorTransitionPoint_connectsToFloorId_fkey" FOREIGN KEY ("connectsToFloorId") REFERENCES "Floor"("id") ON DELETE SET NULL;
