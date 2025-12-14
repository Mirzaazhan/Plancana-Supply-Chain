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
ALTER TABLE "batch_location_history" ADD CONSTRAINT "batch_location_history_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
