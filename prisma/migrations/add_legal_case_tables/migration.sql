-- CreateTable
CREATE TABLE "LegalCaseSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default-user',
    "title" TEXT,
    "topic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalCaseSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalCase" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detailedAnalysis" TEXT,
    "sources" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalCaseSession_userId_idx" ON "LegalCaseSession"("userId");

-- CreateIndex
CREATE INDEX "LegalCaseSession_topic_idx" ON "LegalCaseSession"("topic");

-- CreateIndex
CREATE INDEX "LegalCaseSession_createdAt_idx" ON "LegalCaseSession"("createdAt");

-- CreateIndex
CREATE INDEX "LegalCase_sessionId_idx" ON "LegalCase"("sessionId");

-- CreateIndex
CREATE INDEX "LegalCase_order_idx" ON "LegalCase"("order");

-- AddForeignKey
ALTER TABLE "LegalCase" ADD CONSTRAINT "LegalCase_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LegalCaseSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

