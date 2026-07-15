-- A floor can now carry a cover image (shown on the mobile floor card), stored
-- like every other image as a Media row. Additive and nullable: existing floors
-- keep working with no cover. SET NULL so deleting the media just clears it.
ALTER TABLE "Floor" ADD COLUMN "coverMediaId" TEXT;

ALTER TABLE "Floor" ADD CONSTRAINT "Floor_coverMediaId_fkey"
  FOREIGN KEY ("coverMediaId") REFERENCES "Media"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
