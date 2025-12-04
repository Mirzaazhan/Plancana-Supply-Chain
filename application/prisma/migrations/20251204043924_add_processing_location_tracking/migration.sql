-- AlterTable
ALTER TABLE "processing_records" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "processingLocation" TEXT;
