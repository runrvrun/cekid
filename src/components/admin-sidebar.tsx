"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BarChart2,
  Users,
  Flag,
  Package,
  BookOpen,
  Tag,
  Menu,
  X,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2, exact: false },
  { href: "/admin/users", label: "Pengguna", icon: Users, exact: false },
  { href: "/admin/products", label: "Produk", icon: Package, exact: false },
  { href: "/admin/categories", label: "Kategori", icon: Tag, exact: false },
  { href: "/admin/ulasan", label: "Ulasan", icon: BookOpen, exact: false },
  { href: "/admin/reports", label: "Laporan", icon: Flag, exact: false },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const renderNav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-0.5 p-3 flex-1">
      {nav.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-30">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Admin Panel
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu admin"
          className="p-2 -mr-2 text-gray-600 hover:text-gray-900"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 bg-white border-r border-gray-100 flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Admin Panel
          </p>
        </div>
        {renderNav()}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Admin Panel
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu admin"
                className="p-1 text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNav(() => setOpen(false))}
          </aside>
        </div>
      )}
    </>
  );
}
