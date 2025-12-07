"use client";
import { signOut } from "next-auth/react";
import Link from "next/link";

const SignOut = () => {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
      <Link href="" onClick={handleSignOut} className="mx-2">
        (Keluar)
      </Link>
  );
};

export { SignOut };