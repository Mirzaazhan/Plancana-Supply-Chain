/*
  Warnings:

  - The `humidity` column on the `batches` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "batches" DROP COLUMN "humidity",
ADD COLUMN     "humidity" DOUBLE PRECISION;
