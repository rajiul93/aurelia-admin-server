-- Audience-specific content and quick-tour flags.

CREATE TYPE "AudienceType" AS ENUM ('CHILDREN', 'ADULTS', 'STUDENTS', 'PROFESSORS');

ALTER TABLE "Spot" ADD COLUMN "includedInQuickTour" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "TourTranslation" ADD COLUMN "audience" "AudienceType" NOT NULL DEFAULT 'ADULTS';
DROP INDEX "TourTranslation_tourId_language_key";
DROP INDEX "TourTranslation_language_slug_key";
CREATE UNIQUE INDEX "TourTranslation_tourId_language_audience_key" ON "TourTranslation"("tourId", "language", "audience");
CREATE UNIQUE INDEX "TourTranslation_language_audience_slug_key" ON "TourTranslation"("language", "audience", "slug");

ALTER TABLE "SpotTranslation" ADD COLUMN "audience" "AudienceType" NOT NULL DEFAULT 'ADULTS';
DROP INDEX "SpotTranslation_spotId_language_key";
CREATE UNIQUE INDEX "SpotTranslation_spotId_language_audience_key" ON "SpotTranslation"("spotId", "language", "audience");

ALTER TABLE "SpotFaqTranslation" ADD COLUMN "audience" "AudienceType" NOT NULL DEFAULT 'ADULTS';
DROP INDEX "SpotFaqTranslation_spotFaqId_language_key";
CREATE UNIQUE INDEX "SpotFaqTranslation_spotFaqId_language_audience_key" ON "SpotFaqTranslation"("spotFaqId", "language", "audience");

ALTER TABLE "AiKnowledgeTranslation" ADD COLUMN "audience" "AudienceType" NOT NULL DEFAULT 'ADULTS';
DROP INDEX "AiKnowledgeTranslation_knowledgeId_language_key";
CREATE UNIQUE INDEX "AiKnowledgeTranslation_knowledgeId_language_audience_key" ON "AiKnowledgeTranslation"("knowledgeId", "language", "audience");

ALTER TABLE "TourMedia" ADD COLUMN "audience" "AudienceType" NOT NULL DEFAULT 'ADULTS';
ALTER TABLE "TourMedia" ADD COLUMN "includedInQuickTour" BOOLEAN NOT NULL DEFAULT true;
