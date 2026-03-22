import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import ProductStatusButton from "./statusbtn";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Nonaktif" },
];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));
  const pageSize = 20;

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(status
      ? { status: status as "ACTIVE" | "PENDING" | "INACTIVE" }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { upc: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const [products, totalCount, pendingCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        upc: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        user: { select: { name: true } },
        productImages: {
          where: { isMain: true },
          take: 1,
          select: { url: true },
        },
        productCategory: {
          select: { category: { select: { name: true } } },
          take: 3,
        },
      },
    }),
    prisma.product.count({ where }),
    prisma.product.count({ where: { status: "PENDING", deletedAt: null } }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  function buildHref(params: Record<string, string | undefined>) {
    const merged = { q, status, page, ...params };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
        {pendingCount > 0 && (
          <a
            href={buildHref({ status: "PENDING", page: "1" })}
            className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition"
          >
            <span className="font-bold">{pendingCount}</span> produk menunggu
            persetujuan
          </a>
        )}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Cari nama atau barcode..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition"
        >
          Cari
        </button>
        {(q || status) && (
          <a
            href="/admin/products"
            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition"
          >
            Reset
          </a>
        )}
      </form>

      <p className="text-sm text-gray-500 mb-3">
        {totalCount.toLocaleString("id-ID")} produk ditemukan
      </p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Produk
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                  Kategori
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                  Ditambahkan oleh
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                  Rating
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => {
                const imageUrl = p.productImages[0]?.url ?? null;
                return (
                  <tr
                    key={String(p.id)}
                    className={`hover:bg-gray-50 transition-colors ${
                      p.status === "PENDING"
                        ? "bg-orange-50/40"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <Image
                            src={imageUrl ?? "/product-placeholder.svg"}
                            alt={p.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/${p.slug}`}
                            target="_blank"
                            className="font-medium text-gray-900 hover:underline line-clamp-1"
                          >
                            {p.name}
                          </Link>
                          {p.upc && (
                            <p className="text-xs text-gray-400 font-mono">
                              {p.upc}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.productCategory.map(({ category }) => (
                          <span
                            key={category.name}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                      <div>
                        <p>{p.user?.name ?? <span className="italic text-gray-300">Anonim</span>}</p>
                        <p className="text-gray-400">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString(
                                "id-ID",
                                { day: "numeric", month: "short", year: "numeric" }
                              )
                            : ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="text-xs text-gray-600">
                        <span className="text-yellow-500">★</span>{" "}
                        {Number(p.rating ?? 0).toFixed(1)}
                        <span className="text-gray-400 ml-1">
                          ({p.reviewCount ?? 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ProductStatusButton
                        productId={String(p.id)}
                        currentStatus={p.status as "ACTIVE" | "PENDING" | "INACTIVE"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/product/${p.id}/edit`}
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-400 text-sm"
                  >
                    Tidak ada produk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          {currentPage > 1 && (
            <a
              href={buildHref({ page: String(currentPage - 1) })}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition"
            >
              ← Sebelumnya
            </a>
          )}
          <span className="text-sm text-gray-500">
            Halaman {currentPage} dari {totalPages}
          </span>
          {currentPage < totalPages && (
            <a
              href={buildHref({ page: String(currentPage + 1) })}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition"
            >
              Selanjutnya →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
