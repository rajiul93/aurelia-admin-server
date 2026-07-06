-- CreateTable
CREATE TABLE "TourBundle" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "tourBundleVersion" INTEGER NOT NULL,
    "mediaVersion" INTEGER NOT NULL,
    "aiKnowledgeVersion" INTEGER NOT NULL,
    "routeVersion" INTEGER NOT NULL,
    "languages" JSONB NOT NULL,
    "manifest" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "searchDocuments" JSONB NOT NULL,
    "checksum" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "signatureAlgorithm" TEXT NOT NULL,
    "fileCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourBundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TourBundle_bundleId_key" ON "TourBundle"("bundleId");

-- CreateIndex
CREATE INDEX "TourBundle_tourId_createdAt_idx" ON "TourBundle"("tourId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TourBundle_tourId_tourBundleVersion_key" ON "TourBundle"("tourId", "tourBundleVersion");

-- AddForeignKey
ALTER TABLE "TourBundle" ADD CONSTRAINT "TourBundle_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
