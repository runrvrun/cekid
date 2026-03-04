"use client";

import { useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navitems from "@/components/nav-items";
import NavSearchBar from "@/components/nav-search-bar";

type Props = {
  signinSlot: ReactNode;
};

/** Routes where the navbar search bar should be visible */
function useIsProductPage() {
  const pathname = usePathname();

  // Show on any slug-style product page: /<anything>
  // but NOT on known non-product top-level routes
  const excluded = new Set(["/", "/about", "/feedback", "/signin", "/signup"]);
  if (excluded.has(pathname)) return false;

  // Also hide on /product/create and /product/*/edit
  if (pathname.startsWith("/product/")) return false;

  // Any other top-level slug → product detail page
  return true;
}

export default function NavShell({ signinSlot }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isProductPage = useIsProductPage();

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-4 py-3 gap-3">
        {/* Brand / logo placeholder — kept empty to match original */}
        <div className="font-bold text-lg shrink-0" />

        {/* Desktop: inline search bar (center) */}
        {isProductPage && (
          <div className="relative hidden md:flex flex-1 max-w-sm">
            <NavSearchBar />
          </div>
        )}

        {/* Desktop nav links + sign-in */}
        <ul className="hidden md:flex items-center gap-6 shrink-0">
          <Navitems />
          {signinSlot}
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
                /* X icon */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                /* Search icon */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
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
            {/* Hamburger icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
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
          <div className="relative">
            <NavSearchBar />
          </div>
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
              className="mb-2 text-sm self-start hover:underline"
              onClick={() => setDrawerOpen(false)}
            >
              ✕ Close
            </button>

            <ul className="flex flex-col gap-4">
              <Navitems onClick={() => setDrawerOpen(false)} />
              {signinSlot}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
