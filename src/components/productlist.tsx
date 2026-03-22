import Link from "next/link";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { Star } from "lucide-react";
import { Prisma, Product as DbProduct } from "@/generated/prisma/client";
import { redirect } from "next/navigation";
import { generateQueryEmbedding } from "@/lib/embeddings";
import { Button } from "./ui/button";

type Product = {
  id: bigint;
  name: string;
  upc?: string | null;
  slug: string;
  mainImageUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
};

export default async function ProductList({ query }: { query?: string }) {
  const where = query
    ? {
      deletedAt: null,
      OR: [
        {
          name: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          upc: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    }
  : { deletedAt: null };

 const productsFromDb = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      upc: true,
      reviewCount: true,
      rating: true,
      productImages: {
        where: { isMain: true },
        select: { url: true },
        take: 1,
      },
    },
    take: 20,
    orderBy: { reviewCount: "desc" },
  });

  if (productsFromDb.length === 1) {
    redirect(`/${productsFromDb[0].slug}`);
  }

  let finalProducts = productsFromDb;
  let isSemanticFallback = false;

if (query && productsFromDb.length === 0) {
  isSemanticFallback = true;

  // does not work because no pgvector extension in prisma, need to switch to self-hosted postgres
  /*
  const queryEmbedding = await generateQueryEmbedding(query);

  const similarProducts = await prisma.$queryRaw<DbProduct[]>`
  SELECT id,
    name,
    slug,
    upc,
    image,
    "reviewCount",
    "ratingSum",
         (embedding <=> ${queryEmbedding}::vector) AS distance
  FROM "Product"
  WHERE deleted_at IS NULL
  AND embedding IS NOT NULL
  AND embedding <=> ${queryEmbedding}::vector < 0.35
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 8
`;

  finalProducts = similarProducts;
  */
}

  const products: Product[] = finalProducts.map((p) => ({
    id: p.id,
    name: p.name ?? "",
    upc: p.upc ?? null,
    slug: p.slug ?? "",
    mainImageUrl: p.productImages[0]?.url ?? null,
    reviewCount: typeof p.reviewCount === "number" ? p.reviewCount : 0,
    rating:
      typeof p.rating === "number"
        ? p.rating
        : p.rating
          ? Number(p.rating)
          : null,
  }));

  return (
    <span>
    {isSemanticFallback && (
      <p className="col-span-full text-sm text-gray-500 text-center">
        Pencarian tidak ditemukan, coba gunakan kata kunci lain atau buat produk baru jika belum terdaftar.
        </p>
    )}
    <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/${p.slug}`}
          className="card bg-base-100 shadow hover:shadow-lg transition-shadow"
        >
          <figure>
            <Image
              src={p.mainImageUrl ?? "/product-placeholder.png"}
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
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              {(p.rating ?? 0).toFixed(1)}
              ({p.reviewCount ?? 0})
            </div>
          </div>

        </Link>
      ))}
    </div>
    </span>
  );
}