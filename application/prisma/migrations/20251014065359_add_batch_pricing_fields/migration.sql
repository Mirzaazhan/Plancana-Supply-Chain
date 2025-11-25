-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "buyerName" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'MYR',
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "pricePerUnit" DOUBLE PRECISION,
ADD COLUMN     "totalBatchValue" DOUBLE PRECISION;
