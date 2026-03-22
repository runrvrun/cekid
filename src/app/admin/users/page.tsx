import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import ChangeRoleButton from "./changerolebtn";
import BanModal from "./banmodal";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const { q, role } = await searchParams;

  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(role ? { role: role as "USER" | "ADMIN" | "MODERATOR" } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { product: true, review: true } },
    },
  });

  const roleLabel: Record<string, string> = {
    USER: "User",
    MODERATOR: "Moderator",
    ADMIN: "Admin",
  };

  const roleColor: Record<string, string> = {
    USER: "bg-gray-100 text-gray-600",
    MODERATOR: "bg-orange-100 text-orange-700",
    ADMIN: "bg-red-100 text-red-700",
  };

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-gray-100 text-gray-500",
    SUSPENDED: "bg-red-100 text-red-600",
    PENDING_VERIFICATION: "bg-yellow-100 text-yellow-700",
  };

  const statusLabel: Record<string, string> = {
    ACTIVE: "Aktif",
    INACTIVE: "Nonaktif",
    SUSPENDED: "Dibanned",
    PENDING_VERIFICATION: "Belum Verifikasi",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Pengguna</h1>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Cari nama atau email..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
        />
        <select
          name="role"
          defaultValue={role ?? ""}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Semua Role</option>
          <option value="USER">User</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition"
        >
          Cari
        </button>
        {(q || role) && (
          <a
            href="/admin/users"
            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition"
          >
            Reset
          </a>
        )}
      </form>

      <p className="text-sm text-gray-500 mb-3">
        {users.length.toLocaleString("id-ID")} pengguna ditemukan
      </p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Pengguna
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Produk
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Review
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                  Bergabung
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Ubah Role
                </th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const isBanned = u.status === "SUSPENDED";
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${isBanned ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isBanned
                              ? "bg-red-100 text-red-400"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {(u.name ?? u.email ?? "U")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-900 truncate max-w-[140px]">
                              {u.name ?? "—"}
                            </p>
                            <span
                              className={`text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${roleColor[u.role] ?? "bg-gray-100 text-gray-500"}`}
                            >
                              {roleLabel[u.role] ?? u.role}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 truncate max-w-[160px]">
                            {u.email ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[u.status] ?? "bg-gray-100 text-gray-500"}`}
                      >
                        {statusLabel[u.status] ?? u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u._count.product}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u._count.review}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap hidden md:table-cell">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ChangeRoleButton
                        userId={u.id}
                        currentRole={u.role}
                      />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        {u.id !== session?.user?.id && u.role !== "ADMIN" && (
                          <BanModal
                            userId={u.id}
                            userName={u.name ?? u.email ?? "Pengguna"}
                            isBanned={isBanned}
                            productCount={u._count.product}
                            reviewCount={u._count.review}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="px-4 py-8 text-center text-gray-400 text-sm"
                  >
                    Tidak ada pengguna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
