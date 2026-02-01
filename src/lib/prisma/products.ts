import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

const getProductBySlug = async (slug: string) => {
  try {
    const slugSchema = z.string().min(1);
    const validatedSlug = slugSchema.parse(slug);
    const product = await prisma.product.findUnique({
      where: { slug: validatedSlug },
    });
    return product;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      switch (err.code) {
        case "P2002":
          throw new Error("Slug already registered");
        case "P2003":
          throw new Error("Invalid reference data");
        default:
          throw new Error("Database error");
      }
    }

    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unexpected error occurred");
    }
};

export { getProductBySlug };