-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastViewedProductDismissed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastViewedProductId" BIGINT;
