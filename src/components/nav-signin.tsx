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
        </span>
      )}
    </li>
  );
};

export default Navsignin;