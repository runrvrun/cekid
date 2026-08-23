import AddProductForm from "@/components/addproductform";
import { auth } from "@/lib/auth";
import { getLeafCategoriesForSelect } from "@/lib/prisma/categories";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();
  if (!session) redirect("/signin");

  const categories = await getLeafCategoriesForSelect();

  return (
    <main className="min-h-screen bg-base-100 flex items-start justify-center p-8">
      <div className="w-full max-w-lg">
        <AddProductForm mode="create" categories={categories} />
      </div>
    </main>
  );
};

export default Page;
