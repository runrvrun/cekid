import prisma from "@/lib/prisma";
import Link from "next/link";
import { Users, Package, Star, Flag } from "lucide-react";

export default async function AdminDashboardPage() {
  const [userCount, productCount, reviewCount, pendingReports, pendingProducts] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.review.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.product.count({ where: { status: "PENDING", deletedAt: null } }),
    ]);

  const stats = [
    {
      label: "Total Pengguna",
      value: userCount.toLocaleString("id-ID"),
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Produk",
      value: productCount.toLocaleString("id-ID"),
      icon: Package,
      href: null,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Total Review",
      value: reviewCount.toLocaleString("id-ID"),
      icon: Star,
      href: null,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "Laporan Pending",
      value: pendingReports.toLocaleString("id-ID"),
      icon: Flag,
      href: "/admin/reports",
      color: "bg-red-50 text-red-600",
    },
  ];

  const recentProducts = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href, color }) => {
          const card = (
            <div
              className={`bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 ${
                href ? "hover:border-gray-300 transition-colors" : ""
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          );
          return href ? (
            <Link key={label} href={href}>
              {card}
            </Link>
          ) : (
            <div key={label}>{card}</div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent products */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">
            Produk Terbaru
          </h2>
          <div className="flex flex-col gap-2">
            {recentProducts.map((p) => (
              <div
                key={String(p.id)}
                className="flex items-center justify-between gap-2 py-1.5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/${p.slug}`}
                    className="text-sm font-medium text-gray-800 hover:underline truncate block"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {p.user?.name ?? "Anonim"} &middot;{" "}
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })
                      : ""}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">
            Perlu Perhatian
          </h2>
          <div className="flex flex-col gap-3">
            <ActionItem
              label="Produk menunggu persetujuan"
              count={pendingProducts}
              href="/"
              countColor="bg-orange-100 text-orange-700"
            />
            <ActionItem
              label="Laporan belum ditangani"
              count={pendingReports}
              href="/admin/reports"
              countColor="bg-red-100 text-red-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-orange-100 text-orange-700",
    INACTIVE: "bg-gray-100 text-gray-500",
  };
  const label: Record<string, string> = {
    ACTIVE: "Aktif",
    PENDING: "Pending",
    INACTIVE: "Nonaktif",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${map[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {label[status] ?? status}
    </span>
  );
}

function ActionItem({
  label,
  count,
  href,
  countColor,
}: {
  label: string;
  count: number;
  href: string;
  countColor: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors"
    >
      <span className="text-sm text-gray-700">{label}</span>
      <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${countColor}`}>
        {count}
      </span>
    </Link>
  );
}
