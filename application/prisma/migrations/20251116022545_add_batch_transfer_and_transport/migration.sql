-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "BatchStatus" ADD VALUE 'IN_DISTRIBUTION';

-- CreateTable
CREATE TABLE "batch_transfers" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "fromActorId" TEXT NOT NULL,
    "fromActorRole" "UserRole" NOT NULL,
    "toActorId" TEXT NOT NULL,
    "toActorRole" "UserRole" NOT NULL,
    "transferType" TEXT NOT NULL DEFAULT 'OWNERSHIP_TRANSFER',
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferLocation" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "conditions" JSONB,
    "documents" TEXT[],
    "signature" TEXT,
    "notes" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "statusBefore" "BatchStatus" NOT NULL,
    "statusAfter" "BatchStatus" NOT NULL,
    "blockchainTxId" TEXT,
    "blockchainHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_transfers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "batch_transfers" ADD CONSTRAINT "batch_transfers_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
