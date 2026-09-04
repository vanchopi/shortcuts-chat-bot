-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('COLLECTING_INFO', 'WAITING_FOR_MASTER', 'ANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ConsultationStep" AS ENUM ('WAITING_REFERENCE', 'WAITING_CURRENT_PHOTO', 'WAITING_HAIR_HISTORY', 'WAITING_FOR_MASTER', 'COMPLETED');

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "currentHairImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "currentStep" "ConsultationStep" NOT NULL DEFAULT 'WAITING_REFERENCE',
ADD COLUMN     "hairHistory" TEXT,
ADD COLUMN     "masterResponse" TEXT,
ADD COLUMN     "referenceImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" "ConsultationStatus" NOT NULL DEFAULT 'COLLECTING_INFO';
