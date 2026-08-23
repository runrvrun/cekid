export const runtime = "nodejs";
import Hero from "@/components/hero";
import SearchProduct from "@/components/searchproduct";
import StickySearchBar from "@/components/stickysearchbar";
import ProductList from "@/components/productlist";
import ProductCarouselRow from "@/components/productcarouselrow";
import AddProductLink from "@/components/addproductlink";
import UlasanSection from "@/components/ulasansection";
import {
  getMostReviewedProducts,
  getNewestProducts,
  getProductsByCategoryName,
} from "@/lib/prisma/homepage";

const CATEGORY_ROWS = ["Minuman Bersoda", "Mie Instan"];

type HomeProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const query = (await searchParams)?.q as string;

  const [mostReviewed, newest, categoryRows] = query
    ? [[], [], []]
    : await Promise.all([
        getMostReviewedProducts(10),
        getNewestProducts(10),
        Promise.all(CATEGORY_ROWS.map((name) => getProductsByCategoryName(name, 10))),
      ]);

  return (
    <main className="pb-8">
      {/* Hero + search section */}
      <div className="bg-gradient-to-br from-[#005091] via-[#003D73] to-[#002544] px-4 pt-12 pb-16">
        <div className="max-w-xl mx-auto text-center">
          <Hero />
          <div className="mt-7">
            <SearchProduct initial={query} />
          </div>
          <AddProductLink />
        </div>
      </div>

      <StickySearchBar initial={query} />

      {query ? (
        /* Search results */
        <div className="px-4 mt-10 max-w-screen-xl mx-auto">
          <ProductList query={query} />
        </div>
      ) : (
        /* Default browsing rows */
        <div className="mt-10 max-w-screen-xl mx-auto">
          <ProductCarouselRow title="Paling Banyak Direview" products={mostReviewed} />
          <ProductCarouselRow title="Produk Terbaru" products={newest} />
          {categoryRows.map(
            (row) =>
              row && (
                <ProductCarouselRow
                  key={row.category.id}
                  title={row.category.name}
                  seeAllHref={`/kategori/${row.category.id}`}
                  products={row.products}
                />
              )
          )}
        </div>
      )}

      {/* Ulasan section — hidden when user is searching */}
      {!query && <UlasanSection />}
    </main>
  );
}
