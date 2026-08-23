export const runtime = "nodejs";
import Hero from "@/components/hero";
import SearchProduct from "@/components/searchproduct";
import StickySearchBar from "@/components/stickysearchbar";
import ProductList from "@/components/productlist";
import AddProductLink from "@/components/addproductlink";
import UlasanSection from "@/components/ulasansection";

type HomeProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const query = (await searchParams)?.q as string;

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

      {/* Product list */}
      <div className="px-4 mt-10 max-w-screen-xl mx-auto">
        {!query && (
          <div className="font-bold mb-4">Paling Banyak Direview</div>
        )}
        <ProductList query={query} />
      </div>

      {/* Ulasan section — hidden when user is searching */}
      {!query && <UlasanSection />}
    </main>
  );
}
