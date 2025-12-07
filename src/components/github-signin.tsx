import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Github } from "@/components/ui/github";

const GithubSignIn = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github");
      }}
    >
      <Button className="w-full" variant="outline">
        <Github />
        Masuk dengan GitHub
      </Button>
    </form>
  );
};

export { GithubSignIn };