import AddProductForm from "@/components/addproductform";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

const Page = async ({ params }: { params: { productid: bigint } }) => {
  const session = await auth();
  const id = (await params).productid;

  if (!session) redirect("/signin");

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MODERATOR") redirect("/");

  const product = await prisma.product.findUnique({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      upc: true,
      productImages: {
        select: { id: true, url: true, isMain: true },
        orderBy: { id: "asc" },
      },
    },
    where: { id },
  });

  if (!product) redirect("/");

  const productForForm = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    upc: product.upc,
    images: product.productImages,
  };

  return (
    <main className="min-h-screen bg-base-100 flex items-start justify-center p-8">
      <div className="w-full max-w-lg">
        <AddProductForm
          mode="edit"
          initialData={productForForm}
          canEditMain={true}
        />
      </div>
    </main>
  );
};

export default Page;
