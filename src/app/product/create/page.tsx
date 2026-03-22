import AddProductForm from "@/components/addproductform";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();
  if (!session) redirect("/signin");

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="min-h-screen bg-base-100 flex items-start justify-center p-8">
      <div className="w-full max-w-lg">
        <AddProductForm mode="create" categories={categories} />
      </div>
    </main>
  );
};

export default Page;
