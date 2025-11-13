-- AlterTable
ALTER TABLE "LessonVocabulary" ADD COLUMN IF NOT EXISTS "isSentence" BOOLEAN NOT NULL DEFAULT false;

