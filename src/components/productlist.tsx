import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  image?: string | null;
  rating?: number | null;
};

export default async function ProductList({ query }: { query?: string }) {
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { upc: { contains: query } },
        ],
        AND: [
          { deletedAt: null }
        ]
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
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
          <div className="card-body flex items-center justify-between">
            <h3 className="card-title text-base">{p.name}</h3>
            <div className="text-lg font-semibold text-blue-600">
              {(p.rating ?? 0).toFixed(1)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}