import AddProductForm from "@/components/addproductform";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();
  if (!session) redirect("/signin");
  if (session.user?.role !== "ADMIN") redirect("/");

  return (
    <main className="min-h-screen bg-base-100 flex items-start justify-center p-8">
      <div className="w-full max-w-lg">
        <AddProductForm />
      </div>
    </main>
  );
};

export default Page;