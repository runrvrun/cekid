import { signUp } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GoogleSignIn } from "@/components/google-signin";
import { GithubSignIn } from "@/components/github-signin";
import { auth } from "@/lib/auth";

const Page = async () => {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <Link href="/">
      <img
        src="/logo.png"
        alt="Cekid Logo"
        className="w-32 h-auto mx-auto mb-4"
      />
    </Link>
      <h1 className="text-2xl font-bold text-center mb-6">Buat Akun</h1>

      <GoogleSignIn />
      <GithubSignIn />

      <div className="relative">
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">
            Atau daftar dengan email
          </span>
        </div>
      </div>

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