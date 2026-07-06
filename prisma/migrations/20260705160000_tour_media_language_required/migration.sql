-- Require language on spot/tour media for audience + language specific downloads.

UPDATE "TourMedia" SET "language" = 'en' WHERE "language" IS NULL;

ALTER TABLE "TourMedia" ALTER COLUMN "language" SET NOT NULL;
ALTER TABLE "TourMedia" ALTER COLUMN "language" SET DEFAULT 'en';

CREATE INDEX "TourMedia_spotId_audience_language_idx" ON "TourMedia"("spotId", "audience", "language");
