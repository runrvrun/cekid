import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { ProductCardData } from "@/lib/prisma/homepage";

export default function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link href={`/${product.slug}`} className="block group">
      <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={product.mainImageUrl ?? "/product-placeholder.svg"}
          alt={product.name}
          width={300}
          height={300}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      </div>
      {product.status === "PENDING" && (
        <span className="mt-1.5 inline-block w-fit text-[10px] font-medium px-2 py-0.5 rounded-full text-orange-700 bg-orange-50 border border-orange-200">
          Menunggu moderasi
        </span>
      )}
      <h3 className="text-sm font-medium leading-snug line-clamp-2 mt-1.5 text-gray-900">
        {product.name}
      </h3>
      <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
        <span>{(product.rating ?? 0).toFixed(1)}</span>
        <span className="text-gray-400">({product.reviewCount ?? 0})</span>
      </div>
    </Link>
  );
}
