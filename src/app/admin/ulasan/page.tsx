import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, ExternalLink } from "lucide-react";
import DeleteUlasanBtn from "./delete-btn";

export default async function AdminUlasanPage() {
  const posts = await prisma.ulasan.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      permalink: true,
      status: true,
      createdAt: true,
      publishedAt: true,
      author: { select: { name: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ulasan</h1>
        <Link
          href="/admin/ulasan/new"
          className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Buat Ulasan
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Belum ada ulasan.</p>
          <Link
            href="/admin/ulasan/new"
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-gray-700 font-medium hover:underline"
          >
            <Plus className="w-4 h-4" />
            Buat ulasan pertama
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Judul
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Permalink
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Tanggal
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map((post) => (
                <tr key={String(post.id)} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[240px]">
                      {post.title}
                    </p>
                    <p className="text-xs text-gray-400 md:hidden mt-0.5">
                      /r/{post.permalink}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-gray-500 text-xs font-mono">/r/{post.permalink}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {new Date(post.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {post.status === "PUBLISHED" && (
                        <a
                          href={`/r/${post.permalink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Lihat halaman publik"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        href={`/admin/ulasan/${String(post.id)}/edit`}
                        className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteUlasanBtn id={String(post.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    PUBLISHED: "bg-green-100 text-green-700",
  };
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PUBLISHED: "Dipublikasikan",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
