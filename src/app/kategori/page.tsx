import Link from "next/link";
import { Metadata } from "next";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: { absolute: "Semua Kategori - beliga.id" },
};

export default async function CategoriesIndexPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });

  const childrenByParent = new Map<string, typeof categories>();
  for (const c of categories) {
    if (!c.parentId) continue;
    const key = String(c.parentId);
    childrenByParent.set(key, [...(childrenByParent.get(key) ?? []), c]);
  }

  const topLevel = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.name.localeCompare(b.name));

  function renderChildren(parentId: string, depth: number) {
    const children = (childrenByParent.get(parentId) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    if (children.length === 0) return null;
    return (
      <ul className={depth === 1 ? "mt-2 space-y-1" : "mt-1 ml-4 space-y-1"}>
        {children.map((c) => (
          <li key={String(c.id)}>
            <Link
              href={`/kategori/${c.id}`}
              className={`hover:underline hover:text-primary transition-colors ${
                depth === 1 ? "text-sm text-gray-700" : "text-xs text-gray-500"
              }`}
            >
              {c.name}
            </Link>
            {renderChildren(String(c.id), depth + 1)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Semua Kategori</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {topLevel.map((cat) => (
          <div key={String(cat.id)} className="bg-white border border-gray-100 rounded-xl p-4">
            <Link
              href={`/kategori/${cat.id}`}
              className="font-semibold text-gray-900 hover:text-primary transition-colors"
            >
              {cat.name}
            </Link>
            {renderChildren(String(cat.id), 1)}
          </div>
        ))}
      </div>
    </main>
  );
}
