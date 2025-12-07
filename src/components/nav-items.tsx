import Link from "next/link";

const Navitems = async () => {
 const navItems = [
   { href: "/", label: "Beranda" },
   { href: "/about", label: "Tentang" },
 ];

  return (
    <>
      {navItems.map((item) => (
        <li key={item.href} style={{ marginRight: '1rem' }}>
            <Link href={item.href} className="nav-link">
              {item.label}
            </Link>
        </li>
      ))}
    </>
  );
};

export default Navitems;