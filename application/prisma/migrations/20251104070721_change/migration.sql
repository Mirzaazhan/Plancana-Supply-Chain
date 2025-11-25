/*
  Warnings:

  - Added the required column `estimatedTime` to the `transport_routes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transport_routes" DROP COLUMN "estimatedTime",
ADD COLUMN     "estimatedTime" INTEGER NOT NULL;
