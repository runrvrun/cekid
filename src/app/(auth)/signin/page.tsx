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
      {/*<GithubSignIn />*/}

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