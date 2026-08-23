import prisma from "@/lib/prisma";
import AddCategoryForm from "./add-category-form";
import CategoryRow from "./category-row";
import { Tag } from "lucide-react";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
      _count: { select: { productCategory: true, children: true } },
    },
  });

  const byId = new Map(categories.map((c) => [String(c.id), c]));

  function ancestorPath(id: string): string {
    const parts: string[] = [];
    let current = byId.get(id);
    while (current) {
      parts.unshift(current.name);
      current = current.parentId ? byId.get(String(current.parentId)) : undefined;
    }
    return parts.join(" > ");
  }

  function depthOf(id: string): number {
    let depth = 1;
    let current = byId.get(id);
    while (current?.parentId) {
      depth += 1;
      current = byId.get(String(current.parentId));
    }
    return depth;
  }

  // A category can be a parent target only if it isn't already at the
  // deepest level (3) — its children would otherwise exceed 3 levels.
  const parentOptions = categories
    .filter((c) => depthOf(String(c.id)) <= 2)
    .map((c) => ({ id: String(c.id), name: ancestorPath(String(c.id)) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const childrenByParent = new Map<string, typeof categories>();
  for (const c of categories) {
    if (!c.parentId) continue;
    const key = String(c.parentId);
    childrenByParent.set(key, [...(childrenByParent.get(key) ?? []), c]);
  }

  const topLevel = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.name.localeCompare(b.name));

  function renderRow(cat: (typeof categories)[number], depth: number) {
    const children = (childrenByParent.get(String(cat.id)) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return (
      <div key={String(cat.id)}>
        <div style={{ paddingLeft: `${depth * 1.5}rem` }} className={depth > 0 ? "border-t border-gray-50" : ""}>
          <CategoryRow
            id={String(cat.id)}
            name={cat.name}
            productCount={cat._count.productCategory}
            hasChildren={cat._count.children > 0}
            parentId={cat.parentId ? String(cat.parentId) : null}
            parentOptions={parentOptions.filter((o) => o.id !== String(cat.id))}
          />
        </div>
        {children.map((child) => renderRow(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kategori</h1>
        <span className="text-sm text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
          {categories.length}
        </span>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <AddCategoryForm parentOptions={parentOptions} />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Tag className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-400">Belum ada kategori.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {topLevel.map((cat) => renderRow(cat, 0))}
          </div>
        )}
      </div>
    </div>
  );
}
