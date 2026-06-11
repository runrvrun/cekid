import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookOpen } from "lucide-react";

export default async function UlasanSection() {
  const all = await prisma.ulasan.findMany({
    where: { status: "PUBLISHED" },
    select: {
      permalink: true,
      title: true,
      metaDescription: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  if (all.length === 0) return null;

  // Pick 3 at random
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, 3);

  return (
    <section className="px-4 mt-10 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Ulasan Produk</h2>
        {all.length > 3 && (
          <Link href="/ulasan" className="text-sm text-blue-600 hover:underline">
            Lihat semua
          </Link>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {picks.map((post) => (
          <Link
            key={post.permalink}
            href={`/r/${post.permalink}`}
            className="group flex flex-col gap-2 bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
              {post.title}
            </h3>
            {post.metaDescription && (
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                {post.metaDescription}
              </p>
            )}
            {post.publishedAt && (
              <p className="text-xs text-gray-400 mt-auto pt-1">
                {new Date(post.publishedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
