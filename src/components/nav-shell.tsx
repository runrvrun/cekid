"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Navitems from "@/components/nav-items";
import NavSearchBar from "@/components/nav-search-bar";
import UserDropdown from "@/components/user-dropdown";

type User = {
  name: string;
  email?: string | null;
  role: string;
};

type Props = {
  user: User | null;
};

/** Routes where the navbar search bar should be visible */
function useIsProductPage() {
  const pathname = usePathname();
  const excluded = new Set(["/", "/about", "/feedback", "/signin", "/signup"]);
  if (excluded.has(pathname)) return false;
  if (pathname.startsWith("/product/")) return false;
  return true;
}

export default function NavShell({ user }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isProductPage = useIsProductPage();

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-3 py-3">
        {/* Desktop: inline search bar */}
        {isProductPage && (
          <div className="relative hidden md:flex max-w-sm w-64">
            <NavSearchBar />
          </div>
        )}

        {/* Desktop nav links + user dropdown */}
        <ul className="hidden md:flex items-center gap-6 shrink-0">
          <Navitems />
          <li className="list-none">
            {user ? (
              <UserDropdown name={user.name} email={user.email} role={user.role} />
            ) : (
              <Link href="/signin" className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Login
              </Link>
            )}
          </li>
        </ul>

        {/* Mobile right-side controls */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Search toggle — only on product pages */}
          {isProductPage && (
            <button
              aria-label={mobileSearchOpen ? "Tutup pencarian" : "Buka pencarian"}
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
            >
              {mobileSearchOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
            </button>
          )}

          {/* Hamburger */}
          <button
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Mobile: expandable search row ───────────────────────────── */}
      {isProductPage && mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 border-b border-gray-100">
          <NavSearchBar />
        </div>
      )}

      {/* ── Mobile drawer ───────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel */}
          <div className="absolute left-0 top-0 h-full w-72 bg-white p-6 shadow-xl flex flex-col gap-4">
            <button
              className="mb-2 text-sm self-start hover:underline text-gray-600"
              onClick={() => setDrawerOpen(false)}
            >
              ✕ Close
            </button>

            <ul className="flex flex-col gap-4">
              <Navitems onClick={() => setDrawerOpen(false)} />
            </ul>

            <div className="h-px bg-gray-100 mt-2" />

            {/* Mobile user section */}
            {user ? (
              <div className="flex flex-col gap-1">
                {/* Identity */}
                <div className="flex items-center gap-2.5 px-1 py-2">
                  <div className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {(user.name || user.email || "U")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    {user.role === "ADMIN" || user.role === "MODERATOR" ? (
                      <span className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${user.role === "ADMIN" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                        {user.role === "ADMIN" ? "Admin" : "Moderator"}
                      </span>
                    ) : (
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    )}
                  </div>
                </div>

                <Link
                  href="/account"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2.5 px-1 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                  Ubah Password
                </Link>

                {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                  <Link
                    href="/admin"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-1 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Panel Admin
                  </Link>
                )}

                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2.5 px-1 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                href="/signin"
                onClick={() => setDrawerOpen(false)}
                className="w-full text-center px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
