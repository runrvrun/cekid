// components/Header.tsx
import Link from "next/link";
import Image from "next/image";
import Nav from "./nav";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export default function Header() {
  return (
    <header
      className={`${plusJakarta.className} flex items-center justify-between px-8 border-b border-gray-100`}
    >
      <Link href="/" className="shrink-0 no-underline">
        <Image
          src="/logo.png"
          alt="beliga.id"
          width={767}
          height={379}
          className="h-9 w-auto"
          priority
        />
      </Link>

      <Nav />
    </header>
  );
}
