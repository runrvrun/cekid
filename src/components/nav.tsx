import { auth } from "@/lib/auth";
import NavShell from "@/components/nav-shell";

export default async function Nav() {
  const session = await auth();

  const user = session?.user
    ? {
        name: session.user.name ?? session.user.email ?? "User",
        email: session.user.email ?? null,
        role: session.user.role ?? "USER",
      }
    : null;

  return <NavShell user={user} />;
}
