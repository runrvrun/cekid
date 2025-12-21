import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { Star } from "lucide-react";

type Product = {
  id: number;
  name: string;
  image?: string | null;
  rating?: number | null;
};

export default async function ProductList({ query }: { query?: string }) {
  const where = query
    ? {
      AND: [
        { deletedAt: null },
        { name: { contains: query, mode: "insensitive" as const } },
      ],
    }
    : { deletedAt: null };

  const productsFromDb = await prisma.product.findMany({
    where,
    take: 12,
    orderBy: { createdAt: "desc" },
  });

  const products: Product[] = productsFromDb.map((p) => ({
    id: Number(p.id),
    name: p.name ?? "",
    image: p.image ?? null,
    rating:
      typeof p.rating === "number"
        ? p.rating
        : p.rating
          ? Number(p.rating)
          : null,
  }));

  return (
    <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/product/${p.id}`}
          className="card bg-base-100 shadow hover:shadow-lg transition-shadow"
        >
          <figure>
            <Image
              src={p.image ?? "/product-placeholder.png"}
              alt={p.name}
              className="h-40 w-full object-cover"
              width={160}
              height={160}
            />
          </figure>
          <div className="card-body flex items-center justify-between m-2 min-h-[3.5rem]">
            <h3
              className="
      card-title
      text-base
      leading-snug
      line-clamp-2
      overflow-hidden
      max-w-[70%]
    "
            >
              {p.name}
            </h3>

            <div className="flex items-center gap-1 text-lg shrink-0">
              {(p.rating ?? 0).toFixed(1)}
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>

        </Link>
      ))}
    </div>
  );
}