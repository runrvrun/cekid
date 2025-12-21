import NavShell from "@/components/nav-shell";
import Navsignin from "@/components/nav-signin";

export default async function Nav() {
  return <NavShell signinSlot={<Navsignin />} />;
}
