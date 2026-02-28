// components/Header.tsx
import Link from "next/link";
import Nav from "./nav";
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
});

export default function Header() {
  return (
    <header className={plusJakarta.className}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0rem 2rem",
        borderBottom: "1px solid #eaeaea",
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: "1.5rem",
          textDecoration: "none",
        }}
      >
        <span style={{ color: "#16a34a" }}>enak</span>
        <span style={{ color: "#666666" }}>/</span>
        <span style={{ color: "#f97316" }}>ga</span>
      </Link>

      <Nav />
    </header>
  );
}