-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "humidity" TEXT,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "weather_desc" TEXT,
ADD COLUMN     "weather_main" TEXT;
