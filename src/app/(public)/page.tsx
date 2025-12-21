export const runtime = "nodejs";
import SearchProduct from "@/components/searchproduct";
import ProductList from "@/components/productlist";
import AddProductLink from "@/components/addproductlink";

type HomeProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const query = (await searchParams)?.q as string;

  return (
    <html lang="id">
      <body className="min-h-screen bg-base-100">
        <main className="max-w-6xl mx-auto px-4 py-8">
          <SearchProduct />
          <AddProductLink query={query} />
          <ProductList query={query} />
        </main>
      </body>
    </html>
  );
}