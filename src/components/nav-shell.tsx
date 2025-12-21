"use client";

import { useState, ReactNode } from "react";
import Navitems from "@/components/nav-items";

type Props = {
  signinSlot: ReactNode;
};

export default function NavShell({ signinSlot }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top bar */}
      <nav className="flex items-center justify-between px-4 py-3">
        <div className="font-bold text-lg"></div>

        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-6">
          <Navitems />
          {signinSlot}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-64 bg-white p-6 shadow-lg">
            <button className="mb-6 text-sm" onClick={() => setOpen(false)}>
              ✕ Close
            </button>

            <ul className="flex flex-col gap-4">
              <Navitems onClick={() => setOpen(false)} />
              {signinSlot}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
