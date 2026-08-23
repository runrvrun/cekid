import prisma from "@/lib/prisma";
import AddCategoryForm from "./add-category-form";
import CategoryRow from "./category-row";
import { Tag } from "lucide-react";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      parentId: true,
      _count: { select: { productCategory: true, children: true } },
    },
  });

  const topLevel = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
  const childrenByParent = new Map<string, typeof categories>();
  for (const c of categories) {
    if (!c.parentId) continue;
    const key = String(c.parentId);
    childrenByParent.set(key, [...(childrenByParent.get(key) ?? []), c]);
  }

  const topLevelOptions = topLevel.map((c) => ({ id: String(c.id), name: c.name }));

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
        <AddCategoryForm parentOptions={topLevelOptions} />
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
            {topLevel.map((cat) => {
              const children = (childrenByParent.get(String(cat.id)) ?? []).sort((a, b) =>
                a.name.localeCompare(b.name)
              );
              return (
                <div key={String(cat.id)}>
                  <CategoryRow
                    id={String(cat.id)}
                    name={cat.name}
                    productCount={cat._count.productCategory}
                    hasChildren={cat._count.children > 0}
                    parentId={null}
                    parentOptions={topLevelOptions.filter((o) => o.id !== String(cat.id))}
                  />
                  {children.map((child) => (
                    <div key={String(child.id)} className="pl-8 border-t border-gray-50">
                      <CategoryRow
                        id={String(child.id)}
                        name={child.name}
                        productCount={child._count.productCategory}
                        hasChildren={child._count.children > 0}
                        parentId={String(child.parentId)}
                        parentOptions={topLevelOptions.filter((o) => o.id !== String(child.id))}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
