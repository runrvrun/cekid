-- CreateEnum
CREATE TYPE "ProductImageKind" AS ENUM ('PHOTO', 'NUTRITION_LABEL');

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "kind" "ProductImageKind" NOT NULL DEFAULT 'PHOTO';

-- CreateTable
CREATE TABLE "ProductNutrition" (
    "id" BIGSERIAL NOT NULL,
    "productId" BIGINT NOT NULL,
    "servingSizeValue" DOUBLE PRECISION,
    "servingSizeUnit" VARCHAR(10),
    "sugarPerServing" DOUBLE PRECISION,
    "sodiumPerServing" DOUBLE PRECISION,
    "saturatedFatPerServing" DOUBLE PRECISION,
    "sugarPer100" DOUBLE PRECISION,
    "sodiumPer100" DOUBLE PRECISION,
    "saturatedFatPer100" DOUBLE PRECISION,
    "extra" JSONB,
    "nutriLevel" VARCHAR(1),
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ProductNutrition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductNutrition_productId_key" ON "ProductNutrition"("productId");

-- AddForeignKey
ALTER TABLE "ProductNutrition" ADD CONSTRAINT "ProductNutrition_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
