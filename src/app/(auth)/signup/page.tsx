import { signUp } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GoogleSignIn } from "@/components/google-signin";
import { auth } from "@/lib/auth";
import Image from "next/image";

const Page = async () => {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="text-center max-w-sm mx-auto w-full p-10 border rounded-lg shadow">
<Link
        href="/"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: "1.5rem",
          textDecoration: "none",
            display: "inline-block",
        }}
      >
        <span style={{ color: "#16a34a" }}>enak</span>
        <span style={{ color: "#f97316" }}>ga</span>
      </Link>
       <p className="text-sm text-muted-foreground mb-4">
          Beli atau skip?
        </p>

      {/*<GoogleSignIn />*/}

      {/* Email/Password Sign Up */}
      <form
        className="space-y-4"
        action={async (formData) => {
          "use server";
          const res = await signUp(formData);
          if (res.success) {
            redirect("/signin");
          }
        }}
      >
        <Input
          name="email"
          placeholder="Email"
          type="email"
          required
          autoComplete="email"
        />
        <Input
          name="name"
          placeholder="Nama"
          type="text"
          required
          autoComplete="name"
        />
        <Input
          name="password"
          placeholder="Password"
          type="password"
          required
          autoComplete="new-password"
        />
        <Button className="w-full" type="submit">
          Daftar
        </Button>
      </form>

      <div className="text-center">
        <Button asChild variant="link">
          <Link href="/signin">Sudah punya akun? Masuk</Link>
        </Button>
      </div>
    </div>
  );
};

export default Page;