-- Per-tour visit date + optional start time on the access grant's tour join.
-- Purely additive: two nullable columns, no backfill, no data loss.
ALTER TABLE "TourAccessTour" ADD COLUMN "tourDate" TIMESTAMP(3);
ALTER TABLE "TourAccessTour" ADD COLUMN "startTime" TEXT;
