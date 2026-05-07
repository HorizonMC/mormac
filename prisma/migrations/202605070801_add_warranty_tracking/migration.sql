-- Phase 3.1: Warranty tracking
ALTER TABLE "Repair" ADD COLUMN "warrantyDays" INTEGER NOT NULL DEFAULT 180;
ALTER TABLE "Repair" ADD COLUMN "warrantyExpiry" DATETIME;

UPDATE "Repair"
SET "warrantyExpiry" = datetime("completedAt", '+' || "warrantyDays" || ' days')
WHERE "completedAt" IS NOT NULL
  AND "warrantyExpiry" IS NULL;
