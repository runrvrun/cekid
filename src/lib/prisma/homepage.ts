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

/**
 * Products can be tagged at any level (leaf, mid, or top). Browsing a
 * category should show everything tagged with it OR any of its descendants
 * — e.g. "Minuman" aggregates products tagged with "Minuman" itself, its
 * children ("Kopi", "Teh", ...), and their children ("Kopi Instan", ...).
 * For a leaf category this is a no-op (it has no descendants).
 */
async function getCategoryAndDescendantIds(categoryId: bigint): Promise<bigint[]> {
  const children = await prisma.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });
  const childIds = children.map((c) => c.id);

  let grandchildIds: bigint[] = [];
  if (childIds.length > 0) {
    const grandchildren = await prisma.category.findMany({
      where: { parentId: { in: childIds } },
      select: { id: true },
    });
    grandchildIds = grandchildren.map((c) => c.id);
  }

  return [categoryId, ...childIds, ...grandchildIds];
}

export async function getProductsByCategoryName(
  name: string,
  take = 10
): Promise<{ category: { id: string; name: string }; products: ProductCardData[] } | null> {
  const category = await getCategoryByName(name);
  if (!category) return null;

  const categoryIds = await getCategoryAndDescendantIds(category.id);

  const products = await prisma.product.findMany({
    where: {
      status: STATUS_FILTER,
      deletedAt: null,
      productCategory: { some: { categoryId: { in: categoryIds } } },
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

  const categoryIds = await getCategoryAndDescendantIds(categoryId);

  const where = {
    status: STATUS_FILTER,
    deletedAt: null,
    productCategory: { some: { categoryId: { in: categoryIds } } },
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

export type TopLevelCategory = { id: string; name: string };

export async function getTopLevelCategories(): Promise<TopLevelCategory[]> {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return categories.map((c) => ({ id: String(c.id), name: c.name }));
}
