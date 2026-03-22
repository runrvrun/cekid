// components/Header.tsx
import Link from "next/link";
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
      <Link href="/" className="font-bold text-2xl shrink-0 no-underline">
        <span className="text-green-600">enak</span>
        <span className="text-gray-400">/</span>
        <span className="text-orange-500">ga</span>
      </Link>

      <Nav />
    </header>
  );
}
