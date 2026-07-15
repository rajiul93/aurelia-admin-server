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

-- CreateIndex Floor
CREATE UNIQUE INDEX "Floor_tourId_floorNo_key" ON "Floor"("tourId", "floorNo");
CREATE INDEX "Floor_tourId_idx" ON "Floor"("tourId");

-- CreateIndex FloorTranslation
CREATE UNIQUE INDEX "FloorTranslation_floorId_language_audience_key" ON "FloorTranslation"("floorId", "language", "audience");

-- CreateIndex FloorTransitionPoint
CREATE INDEX "FloorTransitionPoint_floorId_idx" ON "FloorTransitionPoint"("floorId");
CREATE INDEX "FloorTransitionPoint_connectsToFloorId_idx" ON "FloorTransitionPoint"("connectsToFloorId");

-- AddForeignKey Floor
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey FloorTranslation
ALTER TABLE "FloorTranslation" ADD CONSTRAINT "FloorTranslation_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey FloorTransitionPoint
ALTER TABLE "FloorTransitionPoint" ADD CONSTRAINT "FloorTransitionPoint_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FloorTransitionPoint" ADD CONSTRAINT "FloorTransitionPoint_connectsToFloorId_fkey" FOREIGN KEY ("connectsToFloorId") REFERENCES "Floor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every existing tour gets a Floor 1, which all of its spots and its
-- route move onto. Pre-Floor data was single-level (Spot."floor" was always 0),
-- and tour.repository.getFloor1ByTourId() looks up floorNo = 1, so Floor 1 is
-- the floor the admin API defaults to for these tours.
INSERT INTO "Floor" ("id", "tourId", "floorNo", "sortOrder", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  "id",
  1,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Tour";

-- Spot: move from Tour to Floor
ALTER TABLE "Spot" ADD COLUMN "floorId" TEXT;

UPDATE "Spot"
SET "floorId" = (
  SELECT "Floor"."id"
  FROM "Floor"
  WHERE "Floor"."tourId" = "Spot"."tourId" AND "Floor"."floorNo" = 1
  LIMIT 1
);

ALTER TABLE "Spot" ALTER COLUMN "floorId" SET NOT NULL;
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Spot."tourId" stays (deprecated, now nullable) so the Tour.spots relation keeps working.
ALTER TABLE "Spot" ALTER COLUMN "tourId" DROP NOT NULL;

-- Spot."floor" (the old integer floor number) is superseded by the Floor relation.
ALTER TABLE "Spot" DROP COLUMN "floor";

DROP INDEX "Spot_tourId_sortOrder_idx";
CREATE INDEX "Spot_floorId_sortOrder_idx" ON "Spot"("floorId", "sortOrder");

-- TourRoute: move from Tour to Floor (one route per floor)
ALTER TABLE "TourRoute" ADD COLUMN "floorId" TEXT;

UPDATE "TourRoute"
SET "floorId" = (
  SELECT "Floor"."id"
  FROM "Floor"
  WHERE "Floor"."tourId" = "TourRoute"."tourId" AND "Floor"."floorNo" = 1
  LIMIT 1
);

ALTER TABLE "TourRoute" ALTER COLUMN "floorId" SET NOT NULL;
ALTER TABLE "TourRoute" ADD CONSTRAINT "TourRoute_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "TourRoute_floorId_key" ON "TourRoute"("floorId");

-- TourRoute."tourId" stays as a deprecated, unconstrained column: the Tour relation
-- is gone from the schema, so its FK and its one-route-per-tour unique index go too.
-- ("TourRoute_tourId_key" is a unique index, not a table constraint.)
ALTER TABLE "TourRoute" DROP CONSTRAINT "TourRoute_tourId_fkey";
DROP INDEX "TourRoute_tourId_key";
ALTER TABLE "TourRoute" ALTER COLUMN "tourId" DROP NOT NULL;
