/*
  Warnings:

  - The `status` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Review` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('PENDING', 'INACTIVE', 'ACTIVE');

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "status",
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "status",
ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING';
