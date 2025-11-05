/*
  Warnings:

  - You are about to drop the column `contentId` on the `LearningData` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `LearningData` table. All the data in the column will be lost.
  - You are about to drop the column `interactionType` on the `LearningData` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `LearningData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LearningData" DROP COLUMN "contentId",
DROP COLUMN "data",
DROP COLUMN "interactionType",
ADD COLUMN     "commonTopics" TEXT,
ADD COLUMN     "improvementAreas" TEXT,
ADD COLUMN     "lastFeedback" TEXT,
ADD COLUMN     "preferredTone" TEXT,
ADD COLUMN     "totalArticles" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalEmails" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPosts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalProtocols" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalQuotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalScripts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalStories" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSummaries" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "writingLevel" TEXT;

-- CreateTable
CREATE TABLE "Idiom" (
    "id" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "hebrew" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ביטוי',
    "learned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idiom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Synonym" (
    "id" TEXT NOT NULL,
    "primary" TEXT NOT NULL,
    "alternatives" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Synonym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICorrection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default-user',
    "originalText" TEXT NOT NULL,
    "correctedText" TEXT NOT NULL,
    "patterns" TEXT,
    "correctionType" TEXT NOT NULL DEFAULT 'manual',
    "category" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "forbiddenWords" TEXT,
    "preferredWords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationPattern" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default-user',
    "badPattern" TEXT NOT NULL,
    "goodPattern" TEXT NOT NULL,
    "context" TEXT,
    "examples" TEXT,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "patternType" TEXT NOT NULL DEFAULT 'translation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Idiom_english_idx" ON "Idiom"("english");

-- CreateIndex
CREATE INDEX "Idiom_learned_idx" ON "Idiom"("learned");

-- CreateIndex
CREATE INDEX "Synonym_primary_idx" ON "Synonym"("primary");

-- CreateIndex
CREATE INDEX "AICorrection_userId_idx" ON "AICorrection"("userId");

-- CreateIndex
CREATE INDEX "AICorrection_createdAt_idx" ON "AICorrection"("createdAt");

-- CreateIndex
CREATE INDEX "TranslationPattern_userId_idx" ON "TranslationPattern"("userId");

-- CreateIndex
CREATE INDEX "TranslationPattern_badPattern_idx" ON "TranslationPattern"("badPattern");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationPattern_userId_badPattern_goodPattern_key" ON "TranslationPattern"("userId", "badPattern", "goodPattern");
