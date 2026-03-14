-- CreateTable
CREATE TABLE "NewsContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "hookSentence" TEXT NOT NULL DEFAULT '',
    "trivia" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "signalScores" JSONB NOT NULL DEFAULT '{}',
    "signalBadge" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsContent_sourceUrl_key" ON "NewsContent"("sourceUrl");
