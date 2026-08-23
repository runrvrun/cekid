import prisma from "@/lib/prisma";

export type CategoryOption = { id: string; name: string };

/**
 * All categories, at any level (1-3), for the product tagging picker.
 * Products can be tagged at any level, not just leaves. Display name is
 * prefixed with its full ancestor path ("Perawatan Diri > Mata") for context.
 */
export async function getCategoriesForSelect(): Promise<CategoryOption[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      parent: {
        select: {
          name: true,
          parent: { select: { name: true } },
        },
      },
    },
  });

  return categories.map((c) => {
    const path = [c.parent?.parent?.name, c.parent?.name, c.name].filter(
      (n): n is string => Boolean(n)
    );
    return { id: String(c.id), name: path.join(" > ") };
  });
}

/** Plain category names (any level), for AI category-suggestion matching. */
export async function getAllCategoryNames(): Promise<string[]> {
  const categories = await prisma.category.findMany({ select: { name: true } });
  return categories.map((c) => c.name);
}
