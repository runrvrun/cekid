import Image from "next/image";
import { Star } from "lucide-react";
import { auth } from '@/lib/auth';
import prisma from "@/lib/prisma";
import Link from "next/link";
import AddReviewForm from '@/components/addreviewform';
import ImageSlider from '@/components/imageslider';
import ReportModal from '@/components/reportmodal';
import ApproveProductButton from '@/components/approveproductbutton';
import ProductBarcode from '@/components/productbarcode';
import { getUlasanForProduct } from '@/lib/prisma/products';
import { Decimal } from "@prisma/client/runtime/client";
import { BookOpen } from "lucide-react";
import { gradeEachNutrient } from "@/lib/nutrigrade";

type ProductImage = {
  id: bigint;
  url: string;
  isMain: boolean;
};

type Category = {
  id: bigint;
  name: string;
};

type NutritionExtraItem = {
  label?: string;
  value?: string | number;
  unit?: string;
};

type ProductNutrition = {
  servingSizeValue?: number | null;
  servingSizeUnit?: string | null;
  caloriesPerServing?: number | null;
  sugarPerServing?: number | null;
  sodiumPerServing?: number | null;
  saturatedFatPerServing?: number | null;
  sugarPer100?: number | null;
  sodiumPer100?: number | null;
  saturatedFatPer100?: number | null;
  extra?: unknown;
  nutriLevel?: string | null;
};

type Product = {
  id: bigint;
  name: string;
  rating?: Decimal | null;
  slug: string;
  description?: string | null;
  status?: string;
  upc?: string | null;
  productImages?: ProductImage[];
  productCategory?: { category: Category }[];
  productNutrition?: ProductNutrition | null;
};

const NUTRI_LEVEL_STYLES: Record<string, string> = {
  A: "bg-green-100 text-green-800 border-green-300",
  B: "bg-lime-100 text-lime-800 border-lime-300",
  C: "bg-yellow-100 text-yellow-800 border-yellow-300",
  D: "bg-red-100 text-red-800 border-red-300",
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

        if (session?.user?.id) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { lastViewedProductId: product.id, lastViewedProductDismissed: false },
            });
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

    const article = await getUlasanForProduct(product.slug);

    const perNutrientGrades = product.productNutrition
        ? gradeEachNutrient({
              servingSizeValue: product.productNutrition.servingSizeValue,
              sugarPerServing: product.productNutrition.sugarPerServing,
              sodiumPerServing: product.productNutrition.sodiumPerServing,
              saturatedFatPerServing: product.productNutrition.saturatedFatPerServing,
              sugarPer100: product.productNutrition.sugarPer100,
              sodiumPer100: product.productNutrition.sodiumPer100,
              saturatedFatPer100: product.productNutrition.saturatedFatPer100,
          })
        : { sugar: null, sodium: null, saturatedFat: null };

  return (
    <main className="max-w-3xl mx-auto p-6">
        {/* Product detail */}
                    <section className="mb-8 bg-base-100 p-6 flex flex-col items-center">
                        <ImageSlider
                            images={product.productImages ?? []}
                            alt={product.name ?? "Produk"}
                        />
                        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                        <ProductBarcode productId={String(product.id)} upc={product.upc} isSignedIn={!!session?.user} />
                        {product.status === "PENDING" && (
                            <span className="mb-2 inline-block w-fit text-xs font-medium px-2.5 py-1 rounded-full text-orange-700 bg-orange-50 border border-orange-200">
                                Menunggu moderasi admin
                            </span>
                        )}
                        <div className="flex items-center gap-3">
                          {(session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR") && (
                              <a href={`/product/${product.id}/edit`} className="text-blue-500 hover:underline text-sm">
                                  Edit Produk
                              </a>
                          )}
                          {(session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR") && product.status === "PENDING" && (
                              <ApproveProductButton productId={String(product.id)} />
                          )}
                          {session?.user && (
                            <ReportModal type="PRODUCT" productId={String(product.id)} />
                          )}
                        </div>
                    <div className="flex items-center gap-1 text-lg shrink-0">
                            {(product.rating ?? 0).toFixed(1)}
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        </div>
                        {product.description && (
                            <p className="text-gray-700 mb-2">{product.description}</p>
                        )}
                        {product.productCategory && product.productCategory.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {product.productCategory.map(({ category }) => (
                                    <span
                                        key={String(category.id)}
                                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
                                    >
                                        {category.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Nutrition info */}
                    {product.productNutrition && (
                        <section className="mb-8 bg-base-100 border border-gray-100 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xl font-bold">Informasi Gizi</h2>
                                {product.productNutrition.nutriLevel && (
                                    <span
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-full border text-lg font-bold ${
                                            NUTRI_LEVEL_STYLES[product.productNutrition.nutriLevel] ??
                                            "bg-gray-100 text-gray-700 border-gray-300"
                                        }`}
                                        title="Nutri Level (estimasi otomatis, bukan label regulasi resmi)"
                                    >
                                        {product.productNutrition.nutriLevel}
                                    </span>
                                )}
                            </div>
                            {product.productNutrition.nutriLevel && (
                                <p className="text-xs text-gray-400 mb-3">
                                    Nutri Level adalah estimasi otomatis berdasarkan kadar gula, natrium, dan lemak jenuh — bukan label regulasi resmi.
                                </p>
                            )}
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                {product.productNutrition.servingSizeValue != null && (
                                    <div>
                                        <dt className="text-gray-400">Ukuran Saji</dt>
                                        <dd className="font-medium">
                                            {product.productNutrition.servingSizeValue}
                                            {product.productNutrition.servingSizeUnit}
                                        </dd>
                                    </div>
                                )}
                                {product.productNutrition.caloriesPerServing != null && (
                                    <div>
                                        <dt className="text-gray-400">Kalori</dt>
                                        <dd className="font-medium">{product.productNutrition.caloriesPerServing} kkal</dd>
                                    </div>
                                )}
                                {product.productNutrition.sugarPerServing != null && (
                                    <div>
                                        <dt className="text-gray-400">Gula per Saji</dt>
                                        <dd className="font-medium flex items-center gap-1.5">
                                            {product.productNutrition.sugarPerServing} g
                                            {perNutrientGrades.sugar && (
                                                <span
                                                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs font-bold ${
                                                        NUTRI_LEVEL_STYLES[perNutrientGrades.sugar] ?? "bg-gray-100 text-gray-700 border-gray-300"
                                                    }`}
                                                >
                                                    {perNutrientGrades.sugar}
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                )}
                                {product.productNutrition.sodiumPerServing != null && (
                                    <div>
                                        <dt className="text-gray-400">Natrium per Saji</dt>
                                        <dd className="font-medium flex items-center gap-1.5">
                                            {product.productNutrition.sodiumPerServing} mg
                                            {perNutrientGrades.sodium && (
                                                <span
                                                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs font-bold ${
                                                        NUTRI_LEVEL_STYLES[perNutrientGrades.sodium] ?? "bg-gray-100 text-gray-700 border-gray-300"
                                                    }`}
                                                >
                                                    {perNutrientGrades.sodium}
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                )}
                                {product.productNutrition.saturatedFatPerServing != null && (
                                    <div>
                                        <dt className="text-gray-400">Lemak Jenuh per Saji</dt>
                                        <dd className="font-medium flex items-center gap-1.5">
                                            {product.productNutrition.saturatedFatPerServing} g
                                            {perNutrientGrades.saturatedFat && (
                                                <span
                                                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs font-bold ${
                                                        NUTRI_LEVEL_STYLES[perNutrientGrades.saturatedFat] ?? "bg-gray-100 text-gray-700 border-gray-300"
                                                    }`}
                                                >
                                                    {perNutrientGrades.saturatedFat}
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                )}
                                {Array.isArray(product.productNutrition.extra) &&
                                    (product.productNutrition.extra as NutritionExtraItem[]).map((item, i) => (
                                        <div key={i}>
                                            <dt className="text-gray-400">{item.label}</dt>
                                            <dd className="font-medium">
                                                {item.value} {item.unit}
                                            </dd>
                                        </div>
                                    ))}
                            </dl>
                        </section>
                    )}

                    {/* Similar Products */}
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">Produk Serupa</h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {similarProducts.map((p: any) => (
                        <Link key={p.id} href={`/${p.slug}`}>
                            <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
                                <div className="card-body">
                                    <Image
                                        src={p.image ?? "/product-placeholder.svg"}
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
             <div id="tulis-review">
                 <AddReviewForm productId={product.id} slug={product.slug} name={product.name} />
             </div>

                        {/* Related Article */}
                        {article && (
                            <section className="mb-8">
                                <Link
                                    href={`/r/${article.permalink}`}
                                    className="group flex flex-col gap-2 bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                        <BookOpen className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <h3 className="font-semibold text-sm text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">
                                        {article.title}
                                    </h3>
                                    {article.metaDescription && (
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            {article.metaDescription}
                                        </p>
                                    )}
                                </Link>
                            </section>
                        )}

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
            
                  {r.review && <p className="mb-3">{r.review}</p>}
                  {session?.user && (
                    <ReportModal
                      type="REVIEW"
                      reviewId={String(r.id)}
                      productId={String(product.id)}
                    />
                  )}
                </div>
              </div>
                                ))}
                            </div>
                        </section>
    </main>
  );
}