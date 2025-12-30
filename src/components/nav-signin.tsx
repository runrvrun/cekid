import { auth } from "@/lib/auth";
import { SignOut } from "@/components/signout";

const Navsignin = async () => {
  const session = await auth();

  return (
    <li>
      {!session ? (
        <a href="/signin" className="btn btn-primary">
          Masuk
        </a>
      ) : (
        <span>{session.user?.name}
            <SignOut />
        {session.user?.role === "ADMIN" && (
          <a href="/admin" className="ml-2 text-sm text-blue-500">
            Admin
          </a>
        )}
        </span>
      )}
    </li>
  );
};

export default Navsignin;