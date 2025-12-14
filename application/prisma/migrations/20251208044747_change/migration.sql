/*
  Warnings:

  - You are about to drop the column `humidity` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `weather_desc` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `weather_main` on the `batches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "batches" DROP COLUMN "humidity",
DROP COLUMN "temperature",
DROP COLUMN "weather_desc",
DROP COLUMN "weather_main";

-- AlterTable
ALTER TABLE "distribution_records" ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "weather_desc" TEXT,
ADD COLUMN     "weather_main" TEXT;

-- AlterTable
ALTER TABLE "farm_locations" ADD COLUMN     "humidity" DOUBLE PRECISION,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "weather_desc" TEXT,
ADD COLUMN     "weather_main" TEXT;

-- AlterTable
ALTER TABLE "processing_records" ADD COLUMN     "humidity" DOUBLE PRECISION,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "weather_desc" TEXT,
ADD COLUMN     "weather_main" TEXT;
