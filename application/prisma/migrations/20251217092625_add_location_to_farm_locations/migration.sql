-- AlterTable
ALTER TABLE "batch_transfers" ADD COLUMN     "humidity" DOUBLE PRECISION,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "weather_desc" TEXT,
ADD COLUMN     "weather_main" TEXT;

-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "parentBatchId" TEXT,
ADD COLUMN     "recallNotes" TEXT,
ADD COLUMN     "recallReason" TEXT,
ADD COLUMN     "recallSeverity" TEXT,
ADD COLUMN     "recalledAt" TIMESTAMP(3),
ADD COLUMN     "recalledBy" TEXT,
ADD COLUMN     "recalledByRole" TEXT,
ADD COLUMN     "splitDate" TIMESTAMP(3),
ADD COLUMN     "splitReason" TEXT;

-- AlterTable
ALTER TABLE "distribution_records" ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "weather_desc" TEXT,
ADD COLUMN     "weather_main" TEXT;

-- AlterTable
ALTER TABLE "farm_locations" ADD COLUMN     "humidity" DOUBLE PRECISION,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "weather_desc" TEXT,
ADD COLUMN     "weather_main" TEXT;

-- AlterTable
ALTER TABLE "processing_records" ADD COLUMN     "humidity" DOUBLE PRECISION,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "weather_desc" TEXT,
ADD COLUMN     "weather_main" TEXT;

-- CreateTable
CREATE TABLE "batch_location_history" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "geom_point" geography(Point, 4326),

    CONSTRAINT "batch_location_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "batch_location_history_batchId_timestamp_idx" ON "batch_location_history"("batchId", "timestamp");

-- CreateIndex
CREATE INDEX "batch_location_history_geom_point_idx" ON "batch_location_history" USING GIST ("geom_point");

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_parentBatchId_fkey" FOREIGN KEY ("parentBatchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_location_history" ADD CONSTRAINT "batch_location_history_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
