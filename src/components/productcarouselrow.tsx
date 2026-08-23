import Link from "next/link";
import ProductCard from "./productcard";
import type { ProductCardData } from "@/lib/prisma/homepage";

export default function ProductCarouselRow({
  title,
  seeAllHref,
  products,
}: {
  title: string;
  seeAllHref?: string;
  products: ProductCardData[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="font-bold text-lg">{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="text-sm text-primary hover:underline shrink-0">
            Lihat Semua
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <div key={p.id} className="flex-none w-[30%] sm:w-[19%] snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
