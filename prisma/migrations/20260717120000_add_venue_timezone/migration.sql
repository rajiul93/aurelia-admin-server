-- The venue's wall-clock timezone (IANA), used to evaluate host opening hours.
-- Purely additive: one column with a default, no backfill.
ALTER TABLE "AppReleaseConfig" ADD COLUMN "venueTimezone" TEXT NOT NULL DEFAULT 'Europe/Rome';
