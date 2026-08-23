import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import ProductCard from "@/components/productcard";
import { getCategoryProductsPage } from "@/lib/prisma/homepage";

const PAGE_SIZE = 20;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const id = (await params).id;
  const categoryId = BigInt(id);
  const data = await getCategoryProductsPage(categoryId, 1, PAGE_SIZE);
  if (!data) notFound();

  return {
    title: { absolute: `${data.category.name} - beliga.id` },
  };
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const id = (await params).id;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));

  let categoryId: bigint;
  try {
    categoryId = BigInt(id);
  } catch {
    notFound();
  }

  const data = await getCategoryProductsPage(categoryId, currentPage, PAGE_SIZE);
  if (!data) notFound();

  const totalPages = Math.ceil(data.totalCount / PAGE_SIZE);

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{data.category.name}</h1>

      {data.products.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Belum ada produk di kategori ini.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-center mt-8">
          {currentPage > 1 && (
            <Link
              href={`/kategori/${id}?page=${currentPage - 1}`}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition"
            >
              ← Sebelumnya
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Halaman {currentPage} dari {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/kategori/${id}?page=${currentPage + 1}`}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition"
            >
              Selanjutnya →
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
