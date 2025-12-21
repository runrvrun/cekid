import { auth } from "@/lib/auth";

import { signIn } from "@/lib/auth";
import { GoogleSignIn } from "@/components/google-signin";
import { GithubSignIn } from "@/components/github-signin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeAction } from "@/lib/executeAction";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

const Page = async () => {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
    <Link href="/">
      <Image
        src="/logo.png"
        alt="Cekid Logo"
        width={120}
        height={40}
        className="w-32 h-auto mx-auto mb-4"
      />
    </Link>
      <h1 className="text-2xl font-bold text-center mb-6">Masuk</h1>

      {/*<GoogleSignIn />*/}
      {/*<GithubSignIn />*/}
      <div className="relative">
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">
           Atau masuk dengan email
          </span>
        </div>
      </div>

      {/* Email/Password Sign In */}
      <form
        className="space-y-4"
        action={async (formData) => {
          "use server";
          await executeAction({
            actionFn: async () => {
              await signIn("credentials", formData);
            },
          });
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
          name="password"
          placeholder="Password"
          type="password"
          required
          autoComplete="current-password"
        />
        <Button className="w-full" type="submit">
          Masuk
        </Button>
      </form>

      <div className="text-center">
        <Button asChild variant="link">
          <Link href="/signup">Belum punya akun? Daftar</Link>
        </Button>
      </div>
    </div>
  );
};

export default Page;