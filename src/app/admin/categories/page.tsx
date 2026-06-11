import prisma from "@/lib/prisma";
import AddCategoryForm from "./add-category-form";
import CategoryRow from "./category-row";
import { Tag } from "lucide-react";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { productCategory: true } },
    },
  });

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
        <AddCategoryForm />
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
            {categories.map((cat) => (
              <CategoryRow
                key={String(cat.id)}
                id={String(cat.id)}
                name={cat.name}
                productCount={cat._count.productCategory}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
