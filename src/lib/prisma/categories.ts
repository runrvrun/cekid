import prisma from "@/lib/prisma";

export type CategoryOption = { id: string; name: string };

/**
 * Categories a product can actually be tagged with — leaf nodes only.
 * Parent categories (Minuman, Makanan, ...) are purely organizational and
 * are never assigned directly to a product. Leaf names are prefixed with
 * their parent for display ("Minuman > Air Mineral") when they have one.
 */
export async function getLeafCategoriesForSelect(): Promise<CategoryOption[]> {
  const categories = await prisma.category.findMany({
    where: { children: { none: {} } },
    orderBy: [{ parent: { name: "asc" } }, { name: "asc" }],
    select: { id: true, name: true, parent: { select: { name: true } } },
  });

  return categories.map((c) => ({
    id: String(c.id),
    name: c.parent ? `${c.parent.name} > ${c.name}` : c.name,
  }));
}

/** Plain leaf category names, for AI category-suggestion matching. */
export async function getLeafCategoryNames(): Promise<string[]> {
  const categories = await prisma.category.findMany({
    where: { children: { none: {} } },
    select: { name: true },
  });
  return categories.map((c) => c.name);
}
