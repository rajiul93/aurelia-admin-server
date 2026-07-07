-- CreateEnum
CREATE TYPE "KnowledgeCategory" AS ENUM ('KNOWLEDGE', 'INFO_PAGE', 'LEGAL');

-- AlterTable
ALTER TABLE "AppReleaseConfig" ADD COLUMN     "knowledgeVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" "KnowledgeCategory" NOT NULL,
    "includeInAssistant" BOOLEAN NOT NULL DEFAULT true,
    "lifecycle" "FeatureLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticleTranslation" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL DEFAULT '',
    "bodyText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_key_key" ON "KnowledgeArticle"("key");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_category_idx" ON "KnowledgeArticle"("category");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticleTranslation_articleId_language_key" ON "KnowledgeArticleTranslation"("articleId", "language");

-- AddForeignKey
ALTER TABLE "KnowledgeArticleTranslation" ADD CONSTRAINT "KnowledgeArticleTranslation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
