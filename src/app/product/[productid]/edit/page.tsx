import AddProductForm from "@/components/addproductform";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

const Page = async ({ params }: { params: { productid: bigint } }) => {
  const session = await auth();
  const id = (await params).productid;

  if (!session) redirect("/signin");
  if (session.user?.role !== "ADMIN") redirect("/");

   const product = await prisma.product.findUnique({
    where: { id },
  });

  return (
    <main className="min-h-screen bg-base-100 flex items-start justify-center p-8">
      <div className="w-full max-w-lg">
        <AddProductForm mode="edit" initialData={product ?? undefined} />
      </div>
    </main>
  );
};

export default Page;