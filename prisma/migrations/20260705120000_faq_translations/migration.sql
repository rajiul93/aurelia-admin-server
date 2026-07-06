-- Move FAQ category and FAQ content into per-language translation tables.

CREATE TABLE "FaqCategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqCategoryTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FaqTranslation" (
    "id" TEXT NOT NULL,
    "faqId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "question" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "answer_html" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqTranslation_pkey" PRIMARY KEY ("id")
);

INSERT INTO "FaqCategoryTranslation" ("id", "categoryId", "language", "title", "slug", "createdAt", "updatedAt")
SELECT
    'fct_' || "id",
    "id",
    'en'::"Language",
    "title",
    "slug",
    "createdAt",
    "updatedAt"
FROM "FaqCategory";

INSERT INTO "FaqTranslation" ("id", "faqId", "language", "question", "answer_text", "answer_html", "createdAt", "updatedAt")
SELECT
    'ft_' || "id",
    "id",
    'en'::"Language",
    "question",
    "answer_text",
    "answer_html",
    "createdAt",
    "updatedAt"
FROM "Faq";

DROP INDEX "FaqCategory_slug_key";

ALTER TABLE "FaqCategory" DROP COLUMN "title",
DROP COLUMN "slug";

ALTER TABLE "Faq" DROP COLUMN "question",
DROP COLUMN "answer_text",
DROP COLUMN "answer_html";

CREATE UNIQUE INDEX "FaqCategoryTranslation_categoryId_language_key" ON "FaqCategoryTranslation"("categoryId", "language");

CREATE UNIQUE INDEX "FaqCategoryTranslation_language_slug_key" ON "FaqCategoryTranslation"("language", "slug");

CREATE UNIQUE INDEX "FaqTranslation_faqId_language_key" ON "FaqTranslation"("faqId", "language");

ALTER TABLE "FaqCategoryTranslation" ADD CONSTRAINT "FaqCategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FaqCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FaqTranslation" ADD CONSTRAINT "FaqTranslation_faqId_fkey" FOREIGN KEY ("faqId") REFERENCES "Faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;
