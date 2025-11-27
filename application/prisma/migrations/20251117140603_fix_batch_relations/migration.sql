-- DropForeignKey
ALTER TABLE "batch_transfers" DROP CONSTRAINT "batch_transfers_batchId_fkey";

-- DropForeignKey
ALTER TABLE "distribution_records" DROP CONSTRAINT "distribution_records_batchId_fkey";

-- AddForeignKey
ALTER TABLE "batch_transfers" ADD CONSTRAINT "batch_transfers_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("batchId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_records" ADD CONSTRAINT "distribution_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("batchId") ON DELETE RESTRICT ON UPDATE CASCADE;
