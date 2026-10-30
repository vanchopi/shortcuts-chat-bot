-- CreateTable
CREATE TABLE "TelegramWebhookUpdate" (
    "updateId" INTEGER NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramWebhookUpdate_pkey" PRIMARY KEY ("updateId")
);
