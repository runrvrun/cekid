import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ResolveButton from "./resolvebtn";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const { status } = await searchParams;
  const filter = status === "resolved" ? "RESOLVED" : "PENDING";

  const reports = await prisma.report.findMany({
    where: { status: filter },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { name: true, email: true } },
      resolver: { select: { name: true } },
      product: { select: { name: true, slug: true } },
      review: {
        select: {
          id: true,
          review: true,
          rating: true,
          product: { select: { slug: true, name: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Laporan</h1>

      {/* Tab filter */}
      <div className="flex gap-2 mb-6">
        <a
          href="/admin/reports"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === "PENDING"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Belum Ditangani
          {filter === "PENDING" && reports.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {reports.length}
            </span>
          )}
        </a>
        <a
          href="/admin/reports?status=resolved"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === "RESOLVED"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Sudah Ditangani
        </a>
      </div>

      {reports.length === 0 && (
        <p className="text-gray-400 text-sm">Tidak ada laporan.</p>
      )}

      <div className="flex flex-col gap-3">
        {reports.map((r) => {
          const isProduct = r.type === "PRODUCT";
          const productSlug = isProduct
            ? r.product?.slug
            : r.review?.product?.slug;
          const productName = isProduct
            ? r.product?.name
            : r.review?.product?.name;

          return (
            <div
              key={String(r.id)}
              className="border border-gray-100 rounded-xl p-4 bg-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Badge */}
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${
                      isProduct
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {isProduct ? "Produk" : "Review"}
                  </span>

                  {/* Reason */}
                  <p className="font-medium text-sm mb-1">{r.reason}</p>

                  {/* Context */}
                  {isProduct ? (
                    <p className="text-xs text-gray-500 mb-2">
                      Produk:{" "}
                      {productSlug ? (
                        <a
                          href={`/${productSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {productName}
                        </a>
                      ) : (
                        <span className="italic text-gray-400">
                          (produk dihapus)
                        </span>
                      )}
                    </p>
                  ) : (
                    <div className="text-xs text-gray-500 mb-2">
                      <p>
                        Produk:{" "}
                        {productSlug ? (
                          <a
                            href={`/${productSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {productName}
                          </a>
                        ) : (
                          <span className="italic text-gray-400">
                            (produk dihapus)
                          </span>
                        )}
                      </p>
                      {r.review?.review && (
                        <p className="mt-1 text-gray-400 italic line-clamp-2">
                          &ldquo;{r.review.review}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reporter */}
                  <p className="text-xs text-gray-400">
                    Dilaporkan oleh{" "}
                    <span className="font-medium text-gray-600">
                      {r.reporter.name ?? r.reporter.email ?? "Pengguna"}
                    </span>{" "}
                    &middot;{" "}
                    {new Date(r.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  {/* Resolved by */}
                  {r.status === "RESOLVED" && r.resolver && (
                    <p className="text-xs text-green-600 mt-1">
                      Ditangani oleh {r.resolver.name} &middot;{" "}
                      {r.resolvedAt
                        ? new Date(r.resolvedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </p>
                  )}
                </div>

                {/* Action */}
                {r.status === "PENDING" && (
                  <ResolveButton reportId={String(r.id)} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
