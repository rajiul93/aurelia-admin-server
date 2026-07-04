/*
  Warnings:

  - You are about to drop the column `answer` on the `Faq` table. All the data in the column will be lost.
  - Added the required column `answer_html` to the `Faq` table without a default value. This is not possible if the table is not empty.
  - Added the required column `answer_text` to the `Faq` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Faq` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Faq" DROP COLUMN "answer",
ADD COLUMN     "answer_html" TEXT NOT NULL,
ADD COLUMN     "answer_text" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL;
