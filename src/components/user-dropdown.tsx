"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Props = {
  name: string;
  email?: string | null;
  role: string;
};

export default function UserDropdown({ name, email, role }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAdmin = role === "ADMIN";
  const isModerator = role === "MODERATOR";
  const initial = (name || email || "U")[0].toUpperCase();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {initial}
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight min-w-0">
          <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">
            {name}
          </span>
          {(isAdmin || isModerator) && (
            <span
              className={`text-xs font-semibold ${
                isAdmin ? "text-red-500" : "text-orange-500"
              }`}
            >
              {isAdmin ? "Admin" : "Moderator"}
            </span>
          )}
        </div>
        <svg
          className="w-3 h-3 text-gray-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {/* Identity header */}
          <div className="px-3 py-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {initial}
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              {isAdmin || isModerator ? (
                <span
                  className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${
                    isAdmin
                      ? "bg-red-100 text-red-600"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  {isAdmin ? "Admin" : "Moderator"}
                </span>
              ) : (
                <p className="text-xs text-gray-400 truncate">{email}</p>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="py-1">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              Ubah Password
            </Link>

            {(isAdmin || isModerator) && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  Panel Admin
                </Link>
              </>
            )}
          </div>

          <div className="h-px bg-gray-100" />

          <div className="py-1">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
