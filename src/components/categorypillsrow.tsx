import Link from "next/link";
import type { TopLevelCategory } from "@/lib/prisma/homepage";

export default function CategoryPillsRow({
  categories,
  seeAllHref,
}: {
  categories: TopLevelCategory[];
  seeAllHref: string;
}) {
  if (categories.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="font-bold text-lg">Kategori</h2>
        <Link href={seeAllHref} className="text-sm text-primary hover:underline shrink-0">
          Lihat Semua
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/kategori/${c.id}`}
            className="group flex-none w-[31%] snap-start px-3 py-2.5 rounded-xl border border-gray-200 flex items-center justify-center text-center hover:border-primary transition-colors"
            title={c.name}
          >
            <span className="text-xs font-light text-gray-700 leading-snug line-clamp-2 group-hover:text-primary">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
