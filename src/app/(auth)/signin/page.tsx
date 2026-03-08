import { auth } from "@/lib/auth";
import { signIn } from "@/lib/auth";
import { GoogleSignIn } from "@/components/google-signin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeAction } from "@/lib/executeAction";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) => {
  const params = await searchParams;
  const error = params?.error;

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
        <span style={{ color: "#666666" }}>/</span>
        <span style={{ color: "#f97316" }}>ga</span>
      </Link>

      {error && (
        <div className="mt-4 mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded">
          {error === "OAuthAccountNotLinked"
            ? "Email ini sudah terdaftar menggunakan metode login lain. Silakan login menggunakan email & password untuk menghubungkan akun."
            : "Terjadi kesalahan saat login. Silakan coba lagi."}
        </div>
      )}

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

      <GoogleSignIn />
    </div>
  );
};

export default Page;
