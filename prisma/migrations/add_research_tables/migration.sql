-- CreateTable
CREATE TABLE "ResearchSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default-user',
    "title" TEXT,
    "initialQuestion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "detailedInfo" TEXT,
    "sources" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResearchSession_userId_idx" ON "ResearchSession"("userId");

-- CreateIndex
CREATE INDEX "ResearchSession_createdAt_idx" ON "ResearchSession"("createdAt");

-- CreateIndex
CREATE INDEX "ResearchQuestion_sessionId_idx" ON "ResearchQuestion"("sessionId");

-- CreateIndex
CREATE INDEX "ResearchQuestion_order_idx" ON "ResearchQuestion"("order");

-- AddForeignKey
ALTER TABLE "ResearchQuestion" ADD CONSTRAINT "ResearchQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ResearchSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

