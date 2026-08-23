import prisma from "@/lib/prisma";

const STATUS_FILTER = { in: ["ACTIVE", "PENDING"] as ("ACTIVE" | "PENDING")[] };

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  mainImageUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  status: string;
};

function toCardData(p: {
  id: bigint;
  slug: string;
  name: string;
  status: string;
  rating: unknown;
  reviewCount: number | null;
  productImages: { url: string }[];
}): ProductCardData {
  return {
    id: String(p.id),
    slug: p.slug,
    name: p.name,
    mainImageUrl: p.productImages[0]?.url ?? null,
    rating: p.rating != null ? Number(p.rating) : null,
    reviewCount: p.reviewCount ?? 0,
    status: p.status,
  };
}

const CARD_SELECT = {
  id: true,
  slug: true,
  name: true,
  status: true,
  rating: true,
  reviewCount: true,
  productImages: {
    where: { isMain: true },
    select: { url: true },
    take: 1,
  },
} as const;

export async function getMostReviewedProducts(take = 10): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { status: STATUS_FILTER, deletedAt: null },
    select: CARD_SELECT,
    orderBy: { reviewCount: "desc" },
    take,
  });
  return products.map(toCardData);
}

export async function getNewestProducts(take = 10): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { status: STATUS_FILTER, deletedAt: null },
    select: CARD_SELECT,
    orderBy: { createdAt: "desc" },
    take,
  });
  return products.map(toCardData);
}

export async function getCategoryByName(name: string) {
  return prisma.category.findFirst({ where: { name } });
}

export async function getProductsByCategoryName(
  name: string,
  take = 10
): Promise<{ category: { id: string; name: string }; products: ProductCardData[] } | null> {
  const category = await getCategoryByName(name);
  if (!category) return null;

  const products = await prisma.product.findMany({
    where: {
      status: STATUS_FILTER,
      deletedAt: null,
      productCategory: { some: { categoryId: category.id } },
    },
    select: CARD_SELECT,
    orderBy: { reviewCount: "desc" },
    take,
  });

  return {
    category: { id: String(category.id), name: category.name },
    products: products.map(toCardData),
  };
}

export async function getCategoryProductsPage(
  categoryId: bigint,
  page: number,
  pageSize: number
): Promise<{ category: { id: string; name: string }; products: ProductCardData[]; totalCount: number } | null> {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return null;

  const where = {
    status: STATUS_FILTER,
    deletedAt: null,
    productCategory: { some: { categoryId } },
  };

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      select: CARD_SELECT,
      orderBy: { reviewCount: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    category: { id: String(category.id), name: category.name },
    products: products.map(toCardData),
    totalCount,
  };
}
