import prisma from "@/lib/prisma";

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [
    totalProducts,
    totalReviews,
    totalUsers,
    newProductsThisMonth,
    newProductsLastMonth,
    newReviewsThisMonth,
    newReviewsLastMonth,
    newUsersThisMonth,
    newUsersLastMonth,
    topRatedProducts,
    mostReviewedProducts,
    reviewsByRating,
    productsByStatus,
    usersByRole,
    recentActivity,
  ] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.review.count(),
    prisma.user.count(),

    // New products this month vs last month
    prisma.product.count({
      where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.product.count({
      where: {
        deletedAt: null,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),

    // New reviews this month vs last month
    prisma.review.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.review.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),

    // New users this month vs last month
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),

    // Top rated products (min 3 reviews)
    prisma.product.findMany({
      where: { deletedAt: null, reviewCount: { gte: 3 } },
      orderBy: { rating: "desc" },
      take: 5,
      select: { name: true, slug: true, rating: true, reviewCount: true },
    }),

    // Most reviewed products
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { reviewCount: "desc" },
      take: 5,
      select: { name: true, slug: true, rating: true, reviewCount: true },
    }),

    // Reviews grouped by rating
    prisma.review.groupBy({
      by: ["rating"],
      _count: { rating: true },
      orderBy: { rating: "desc" },
    }),

    // Products by status
    prisma.product.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { status: true },
    }),

    // Users by role
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),

    // Recent reviews with product name
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        rating: true,
        review: true,
        createdAt: true,
        anonymous: true,
        user: { select: { name: true } },
        product: { select: { name: true, slug: true } },
      },
    }),
  ]);

  function pctChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? "+100%" : "—";
    const pct = ((current - previous) / previous) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
  }

  function pctColor(current: number, previous: number) {
    if (previous === 0) return "text-gray-400";
    return current >= previous ? "text-green-600" : "text-red-500";
  }

  const growthStats = [
    {
      label: "Produk Baru",
      value: newProductsThisMonth,
      prev: newProductsLastMonth,
      sub: "30 hari terakhir",
    },
    {
      label: "Review Baru",
      value: newReviewsThisMonth,
      prev: newReviewsLastMonth,
      sub: "30 hari terakhir",
    },
    {
      label: "Pengguna Baru",
      value: newUsersThisMonth,
      prev: newUsersLastMonth,
      sub: "30 hari terakhir",
    },
  ];

  const statusLabel: Record<string, string> = {
    ACTIVE: "Aktif",
    PENDING: "Pending",
    INACTIVE: "Nonaktif",
  };
  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-500",
    PENDING: "bg-orange-400",
    INACTIVE: "bg-gray-300",
  };

  const totalReviewsByRating = reviewsByRating.reduce(
    (s, r) => s + r._count.rating,
    0
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Analytics</h1>

      {/* Growth cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {growthStats.map(({ label, value, prev, sub }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {value.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-gray-400">
              {sub} &nbsp;
              <span className={`font-semibold ${pctColor(value, prev)}`}>
                {pctChange(value, prev)}
              </span>{" "}
              vs bulan lalu
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Products by status */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">
            Produk by Status
          </h2>
          <div className="flex flex-col gap-3">
            {productsByStatus.map((s) => {
              const pct =
                totalProducts > 0
                  ? ((s._count.status / totalProducts) * 100).toFixed(0)
                  : "0";
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {statusLabel[s.status] ?? s.status}
                    </span>
                    <span className="font-medium">
                      {s._count.status.toLocaleString("id-ID")} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${statusColor[s.status] ?? "bg-gray-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews by rating */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">
            Distribusi Rating Review
          </h2>
          <div className="flex flex-col gap-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const found = reviewsByRating.find((r) => r.rating === star);
              const count = found?._count.rating ?? 0;
              const pct =
                totalReviewsByRating > 0
                  ? ((count / totalReviewsByRating) * 100).toFixed(0)
                  : "0";
              return (
                <div key={star}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{"★".repeat(star)}</span>
                    <span className="font-medium">
                      {count.toLocaleString("id-ID")} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top rated */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">
            Produk Rating Tertinggi
            <span className="text-xs font-normal text-gray-400 ml-1">
              (min. 3 review)
            </span>
          </h2>
          <div className="flex flex-col gap-2">
            {topRatedProducts.map((p, i) => (
              <div key={p.slug} className="flex items-center gap-3 py-1">
                <span className="text-xs font-bold text-gray-300 w-4 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={`/${p.slug}`}
                    className="text-sm font-medium text-gray-800 hover:underline truncate block"
                  >
                    {p.name}
                  </a>
                  <p className="text-xs text-gray-400">
                    {p.reviewCount} review
                  </p>
                </div>
                <span className="text-sm font-semibold text-yellow-500 shrink-0">
                  ★ {Number(p.rating).toFixed(1)}
                </span>
              </div>
            ))}
            {topRatedProducts.length === 0 && (
              <p className="text-sm text-gray-400">Belum ada data.</p>
            )}
          </div>
        </div>

        {/* Most reviewed */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">
            Produk Paling Banyak Diulas
          </h2>
          <div className="flex flex-col gap-2">
            {mostReviewedProducts.map((p, i) => (
              <div key={p.slug} className="flex items-center gap-3 py-1">
                <span className="text-xs font-bold text-gray-300 w-4 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={`/${p.slug}`}
                    className="text-sm font-medium text-gray-800 hover:underline truncate block"
                  >
                    {p.name}
                  </a>
                  <p className="text-xs text-gray-400">
                    ★ {Number(p.rating).toFixed(1)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-700 shrink-0">
                  {(p.reviewCount ?? 0).toLocaleString("id-ID")} ulasan
                </span>
              </div>
            ))}
            {mostReviewedProducts.length === 0 && (
              <p className="text-sm text-gray-400">Belum ada data.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent reviews */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-sm text-gray-700 mb-4">
          Review Terbaru
        </h2>
        <div className="flex flex-col divide-y divide-gray-50">
          {recentActivity.map((r) => (
            <div
              key={String(r.id)}
              className="py-3 flex items-start gap-3"
            >
              <div className="shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                {r.anonymous
                  ? "?"
                  : (r.user?.name ?? "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">
                    {r.anonymous ? "Anonim" : (r.user?.name ?? "Pengguna")}
                  </span>
                  <span className="text-xs text-yellow-500">
                    {"★".repeat(r.rating)}
                  </span>
                  <span className="text-xs text-gray-400">pada</span>
                  <a
                    href={`/${r.product.slug}`}
                    className="text-xs text-blue-600 hover:underline truncate max-w-[160px]"
                  >
                    {r.product.name}
                  </a>
                </div>
                {r.review && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {r.review}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })
                  : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
