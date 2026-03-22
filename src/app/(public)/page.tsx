export const runtime = "nodejs";
import Hero from "@/components/hero";
import SearchProduct from "@/components/searchproduct";
import ProductList from "@/components/productlist";
import AddProductLink from "@/components/addproductlink";

type HomeProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const query = (await searchParams)?.q as string;

  return (
    <main className="pb-8">
      {/* Hero + search section */}
      <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 px-4 pt-12 pb-16">
        <div className="max-w-xl mx-auto text-center">
          <Hero />
          <div className="mt-7">
            <SearchProduct initial={query} />
          </div>
          <AddProductLink />
        </div>
      </div>

      {/* Product list */}
      <div className="px-4 mt-8 max-w-screen-xl mx-auto">
        {!query && (
          <div className="font-bold mb-4">Paling Banyak Direview</div>
        )}
        <ProductList query={query} />
      </div>
    </main>
  );
}
