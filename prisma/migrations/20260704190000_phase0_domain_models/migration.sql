-- CreateEnum
CREATE TYPE "TourMediaType" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "TimeOfDay" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "placeId" TEXT;

-- CreateTable
CREATE TABLE "DeviceRegistration" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "platform" "Platform" NOT NULL,
    "pushToken" TEXT,
    "tourAccessId" TEXT,
    "userId" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spot" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "thumbnailMediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotTranslation" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionText" TEXT NOT NULL DEFAULT '',
    "descriptionHtml" TEXT NOT NULL DEFAULT '',
    "interestingFactsText" TEXT NOT NULL DEFAULT '',
    "interestingFactsHtml" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotFaq" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotFaqTranslation" (
    "id" TEXT NOT NULL,
    "spotFaqId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "question" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "answerHtml" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotFaqTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourRoute" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteEdge" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "fromSpotId" TEXT NOT NULL,
    "toSpotId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "footprintGeo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourMedia" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "spotId" TEXT,
    "mediaId" TEXT NOT NULL,
    "type" "TourMediaType" NOT NULL,
    "language" "Language",
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiKnowledge" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "spotId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiKnowledgeTranslation" (
    "id" TEXT NOT NULL,
    "knowledgeId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiKnowledgeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppUiString" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "lifecycle" "FeatureLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUiString_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppUiStringTranslation" (
    "id" TEXT NOT NULL,
    "stringId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUiStringTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppAsset" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "timeOfDay" "TimeOfDay",
    "lifecycle" "FeatureLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppReleaseConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "appContentVersion" INTEGER NOT NULL DEFAULT 1,
    "apiVersion" INTEGER NOT NULL DEFAULT 1,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "publishStatus" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppReleaseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceRegistration_deviceId_key" ON "DeviceRegistration"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceRegistration_tourAccessId_idx" ON "DeviceRegistration"("tourAccessId");

-- CreateIndex
CREATE INDEX "DeviceRegistration_userId_idx" ON "DeviceRegistration"("userId");

-- CreateIndex
CREATE INDEX "Spot_tourId_sortOrder_idx" ON "Spot"("tourId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SpotTranslation_spotId_language_key" ON "SpotTranslation"("spotId", "language");

-- CreateIndex
CREATE INDEX "SpotFaq_spotId_sortOrder_idx" ON "SpotFaq"("spotId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SpotFaqTranslation_spotFaqId_language_key" ON "SpotFaqTranslation"("spotFaqId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "TourRoute_tourId_key" ON "TourRoute"("tourId");

-- CreateIndex
CREATE INDEX "RouteEdge_routeId_sortOrder_idx" ON "RouteEdge"("routeId", "sortOrder");

-- CreateIndex
CREATE INDEX "TourMedia_tourId_type_idx" ON "TourMedia"("tourId", "type");

-- CreateIndex
CREATE INDEX "TourMedia_spotId_idx" ON "TourMedia"("spotId");

-- CreateIndex
CREATE INDEX "AiKnowledge_tourId_sortOrder_idx" ON "AiKnowledge"("tourId", "sortOrder");

-- CreateIndex
CREATE INDEX "AiKnowledge_spotId_idx" ON "AiKnowledge"("spotId");

-- CreateIndex
CREATE UNIQUE INDEX "AiKnowledgeTranslation_knowledgeId_language_key" ON "AiKnowledgeTranslation"("knowledgeId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "AppUiString_key_key" ON "AppUiString"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AppUiStringTranslation_stringId_language_key" ON "AppUiStringTranslation"("stringId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "AppAsset_key_key" ON "AppAsset"("key");

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceRegistration" ADD CONSTRAINT "DeviceRegistration_tourAccessId_fkey" FOREIGN KEY ("tourAccessId") REFERENCES "TourAccess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceRegistration" ADD CONSTRAINT "DeviceRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_thumbnailMediaId_fkey" FOREIGN KEY ("thumbnailMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotTranslation" ADD CONSTRAINT "SpotTranslation_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotFaq" ADD CONSTRAINT "SpotFaq_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotFaqTranslation" ADD CONSTRAINT "SpotFaqTranslation_spotFaqId_fkey" FOREIGN KEY ("spotFaqId") REFERENCES "SpotFaq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourRoute" ADD CONSTRAINT "TourRoute_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteEdge" ADD CONSTRAINT "RouteEdge_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TourRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteEdge" ADD CONSTRAINT "RouteEdge_fromSpotId_fkey" FOREIGN KEY ("fromSpotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteEdge" ADD CONSTRAINT "RouteEdge_toSpotId_fkey" FOREIGN KEY ("toSpotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourMedia" ADD CONSTRAINT "TourMedia_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourMedia" ADD CONSTRAINT "TourMedia_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourMedia" ADD CONSTRAINT "TourMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledge" ADD CONSTRAINT "AiKnowledge_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledge" ADD CONSTRAINT "AiKnowledge_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeTranslation" ADD CONSTRAINT "AiKnowledgeTranslation_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "AiKnowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppUiStringTranslation" ADD CONSTRAINT "AppUiStringTranslation_stringId_fkey" FOREIGN KEY ("stringId") REFERENCES "AppUiString"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppAsset" ADD CONSTRAINT "AppAsset_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
