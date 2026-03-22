import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (
    session?.user?.role !== "ADMIN" &&
    session?.user?.role !== "MODERATOR"
  ) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <AdminSidebar />
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">{children}</main>
    </div>
  );
}
