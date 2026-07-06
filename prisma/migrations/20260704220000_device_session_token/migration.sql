-- AlterTable
ALTER TABLE "DeviceSession" ADD COLUMN "sessionTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSession_sessionTokenHash_key" ON "DeviceSession"("sessionTokenHash");
