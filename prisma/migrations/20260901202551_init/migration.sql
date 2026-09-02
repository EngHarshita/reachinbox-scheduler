-- AlterEnum
ALTER TYPE "EmailStatus" ADD VALUE 'PROCESSING';

-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "smtp_response" TEXT;
