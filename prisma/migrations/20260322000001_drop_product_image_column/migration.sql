-- AlterTable: remove the denormalized image column now that ProductImage table is used
ALTER TABLE "Product" DROP COLUMN IF EXISTS "image";
