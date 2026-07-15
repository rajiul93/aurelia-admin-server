-- CreateTable
CREATE TABLE "Host" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "photoMediaId" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "availableFrom" TEXT,
    "availableTo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Host_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostTranslation" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "bio" TEXT NOT NULL,

    CONSTRAINT "HostTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Host_tourId_idx" ON "Host"("tourId");

-- CreateIndex
CREATE INDEX "HostTranslation_hostId_idx" ON "HostTranslation"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "HostTranslation_hostId_language_key" ON "HostTranslation"("hostId", "language");

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_photoMediaId_fkey" FOREIGN KEY ("photoMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostTranslation" ADD CONSTRAINT "HostTranslation_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE CASCADE ON UPDATE CASCADE;
