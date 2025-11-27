-- Remove foreign key constraints to support hybrid storage (blockchain + database)
-- Batches might only exist on blockchain, not in database

-- DropForeignKey
ALTER TABLE "batch_transfers" DROP CONSTRAINT IF EXISTS "batch_transfers_batchId_fkey";

-- DropForeignKey
ALTER TABLE "distribution_records" DROP CONSTRAINT IF EXISTS "distribution_records_batchId_fkey";
