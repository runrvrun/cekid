import Image from "next/image";
import { Star } from "lucide-react";
import { auth } from '@/lib/auth';
import prisma from "@/lib/prisma";
import Link from "next/link";
import AddReviewForm from '@/components/addreviewform';
import { Decimal } from "@prisma/client/runtime/client";

type Product = {
  id: bigint;
  name: string;
  image?: string | null;
  rating?: Decimal | null;
  slug: string;
  description?: string | null;
};

export default async function ProductDetail({ product }: { product: Product }) {
    const session = await auth();

    if (!product) {
            return (
                <main className="max-w-3xl mx-auto p-6">
                    <div className="text-center text-gray-600">Produk tidak ditemukan.</div>
                    <div className="mt-4 text-center">
                        <Link href="/" className="text-blue-600 hover:underline">
                            Kembali ke beranda
                        </Link>
                    </div>
                </main>
            );
        }
    
        const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ??
        "http://localhost:3000";
    
       const res = await fetch(
      `${baseUrl}/api/recommendations?productId=${product.id}`,
      { cache: "no-store" }
    );
    
    if (!res.ok) {
      console.error("Recommendation API failed:", res.status);
      return [];
    }
    
    const text = await res.text();
    
    if (!text) {
      console.error("Recommendation API returned empty body");
      return [];
    }
    const similarProducts = JSON.parse(text);

    const reviews = await prisma.review.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            user: {
                select: { name: true }
            }
        }
    });

    var userreviewed = null;

    const userreview = await prisma.review.findFirst({
        where: { productId: product.id, userId: session?.user?.id }, // TODO: replace null with current user ID when auth is implemented
    });

    if (userreview?.id) {
        userreviewed = true;
    }

  return (
    <main className="max-w-3xl mx-auto p-6">
        {/* Product detail */}
                    <section className="mb-8 bg-base-100 p-6 flex flex-col items-center">
                        <Image
                            src={product.image ?? "/product-placeholder.png"}
                            alt={product.name ?? "Produk"}
                            className="w-full h-96 object-cover rounded"
                            width={800}
                            height={800}
                        />
                        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                        {session?.user?.role === "ADMIN" && (
                            <a href={`/product/${product.id}/edit`} className="text-blue-500 hover:underline">
                                Edit Produk
                            </a>
                        )}
                    <div className="flex items-center gap-1 text-lg shrink-0">
                            {(product.rating ?? 0).toFixed(1)}
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        </div>
                        {product.description && (
                            <p className="text-gray-700 mb-2">{product.description}</p>
                        )}
                    </section>
                    {/* Similar Products */}
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">Produk Serupa</h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {similarProducts.map((p: any) => (
                        <Link key={p.id} href={`/product/${p.id}`}>
                            <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
                                <div className="card-body">
                                    <Image
                                        src={p.image ?? "/product-placeholder.png"}
                                        alt={p.name}
                                        className="w-full h-48 object-cover rounded"
                                        width={400}
                                        height={400}
                                    />
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
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
             <AddReviewForm productId={product.id} slug={product.slug} name={product.name} />
            
                        {/* Reviews */}
                        <section>
                            <h2 className="text-xl font-bold mb-4">Reviews</h2>
                            <div className="flex flex-col gap-4">
                                {reviews.length === 0 && (
                                    <div className="text-gray-600">Belum ada review untuk produk ini.</div>
                                )}
            
                                {reviews.map((r) => (
                                    <div key={r.id} className="card bg-base-100 w-full">
                <div className="card-body">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">
                      {r.anonymous ? "Pengguna" : (r.user?.name ?? "Pengguna")}
                    </span>
                    <span className="text-sm text-gray-400">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
            
                  {/* replaced numeric rating with stars */}
                  <div className="flex items-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-4 h-4"
                        fill={star <= (r.rating ?? 0) ? "#facc15" : "#e5e7eb"}
                        stroke="#facc15"
                      />
                    ))}
                  </div>
            
                  {r.review && <p className="mb-4">{r.review}</p>}
                </div>
              </div>
                                ))}
                            </div>
                        </section>
    </main>
  );
}