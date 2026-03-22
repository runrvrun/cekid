import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/changepasswordform";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, password: true, role: true },
  });

  if (!user) redirect("/signin");

  const roleLabelMap: Record<string, string> = {
    ADMIN: "Admin",
    MODERATOR: "Moderator",
    USER: "User",
  };

  return (
    <main className="min-h-screen bg-base-100">
      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Profile card */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold shrink-0">
            {(user.name ?? user.email ?? "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-base-content/60">{user.email}</p>
            {user.role !== "USER" && (
              <span
                className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                  user.role === "ADMIN"
                    ? "bg-red-100 text-red-600"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {roleLabelMap[user.role]}
              </span>
            )}
          </div>
        </div>

        {/* Change password section */}
        <div className="bg-base-100 border border-base-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Ubah Password</h2>
          <ChangePasswordForm hasPassword={!!user.password} />
        </div>
      </div>
    </main>
  );
}
