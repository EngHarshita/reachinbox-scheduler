/*
  Warnings:

  - You are about to drop the column `expires_at` on the `rate_limit_counters` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `rate_limit_counters` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `rate_limit_counters` table. All the data in the column will be lost.
  - You are about to drop the column `bot_access_token` on the `slack_connections` table. All the data in the column will be lost.
  - You are about to drop the column `channel_name` on the `slack_connections` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `slack_connections` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,window_start]` on the table `rate_limit_counters` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,team_id]` on the table `slack_connections` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `access_token` to the `slack_connections` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "emails_scheduled_at_status_idx";

-- DropIndex
DROP INDEX "rate_limit_counters_expires_at_idx";

-- DropIndex
DROP INDEX "rate_limit_counters_user_id_key_key";

-- DropIndex
DROP INDEX "slack_connections_user_id_idx";

-- DropIndex
DROP INDEX "slack_connections_user_id_team_id_channel_id_key";

-- AlterTable
ALTER TABLE "rate_limit_counters" DROP COLUMN "expires_at",
DROP COLUMN "key",
DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "slack_connections" DROP COLUMN "bot_access_token",
DROP COLUMN "channel_name",
DROP COLUMN "is_active",
ADD COLUMN     "access_token" TEXT NOT NULL,
ALTER COLUMN "channel_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "google_access_token" TEXT,
ADD COLUMN     "google_id" TEXT,
ADD COLUMN     "google_token_expiry" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "emails_scheduled_at_idx" ON "emails"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_counters_user_id_window_start_key" ON "rate_limit_counters"("user_id", "window_start");

-- CreateIndex
CREATE UNIQUE INDEX "slack_connections_user_id_team_id_key" ON "slack_connections"("user_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
