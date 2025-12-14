-- AlterTable
ALTER TABLE "batch_transfers" ADD COLUMN     "humidity" DOUBLE PRECISION,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "weather_desc" TEXT,
ADD COLUMN     "weather_main" TEXT;
