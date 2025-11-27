-- CreateTable
CREATE TABLE "distribution_records" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "distributionType" TEXT,
    "warehouseLocation" TEXT,
    "warehouseLat" DOUBLE PRECISION,
    "warehouseLng" DOUBLE PRECISION,
    "storageConditions" TEXT,
    "temperatureControl" TEXT,
    "humidity" DOUBLE PRECISION,
    "vehicleType" TEXT,
    "vehicleId" TEXT,
    "driverName" TEXT,
    "route" JSONB,
    "quantityReceived" DOUBLE PRECISION,
    "quantityDistributed" DOUBLE PRECISION,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "distributionCost" DOUBLE PRECISION,
    "storageCost" DOUBLE PRECISION,
    "handlingCost" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "qualityCheckPassed" BOOLEAN,
    "qualityNotes" TEXT,
    "documents" TEXT[],
    "notes" TEXT,
    "destinationType" TEXT,
    "destination" TEXT,
    "blockchainTxId" TEXT,
    "blockchainHash" TEXT,
    "distributionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "distribution_records" ADD CONSTRAINT "distribution_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
