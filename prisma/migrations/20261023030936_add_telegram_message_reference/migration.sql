/*
  Warnings:

  - A unique constraint covering the columns `[telegramChatId,telegramMessageId]` on the table `Consultation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "telegramChatId" TEXT,
ADD COLUMN     "telegramMessageId" INTEGER;

-- CreateIndex
CREATE INDEX "Consultation_conversationId_idx" ON "Consultation"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_telegramChatId_telegramMessageId_key" ON "Consultation"("telegramChatId", "telegramMessageId");
