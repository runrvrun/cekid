import Link from "next/link";

type Props = {
  onClick?: () => void;
};

const Navitems = ({ onClick }: Props) => {
  const navItems = [
    { href: "/", label: "Beranda" },
    { href: "/about", label: "Tentang" },
  ];

  return (
    <>
      {navItems.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="block py-2 text-base hover:underline"
            onClick={onClick}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </>
  );
};

export default Navitems;
