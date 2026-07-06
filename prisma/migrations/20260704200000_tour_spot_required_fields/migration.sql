-- AlterTable
ALTER TABLE "Spot" ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SpotFaqTranslation" ADD COLUMN     "answerJson" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "SpotTranslation" ADD COLUMN     "quillJson" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "shortDesc" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "TourMedia" ADD COLUMN     "thumbnailMediaId" TEXT;

-- AddForeignKey
ALTER TABLE "TourMedia" ADD CONSTRAINT "TourMedia_thumbnailMediaId_fkey" FOREIGN KEY ("thumbnailMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
