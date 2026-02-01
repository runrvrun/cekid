"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type SearchPayload = { query: string };

export default function SearchProduct({
    
    onSearch,
    initial = "",
}: {
    onSearch?: (payload: SearchPayload) => void;
    initial?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [value, setValue] = useState(initial);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();

        const formData = new FormData(e.currentTarget);
        const search = formData.get("search") as string;

        const params = new URLSearchParams();
        if (search){
            params.set("q",search)
        } else {
            params.delete("q");
        }

        router.replace(`${pathname}?${params.toString()}`);

        const q = value.trim();
        if (!q) {
            return;
        }
        onSearch?.({ query: q });
    };

    return (
        <form className="mx-auto w-full lg:w-1/2" onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 rounded-xl overflow-hidden bg-white border-2 border-black/10 focus-within:border-blue-500/50">
                <div className="flex items-center justify-center pl-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>
                <input
                    type="text"
                    name="search"
                    aria-label="Mau beli apa?"
                    placeholder="Mau beli apa?"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex-1 px-3 py-3 border-none focus:outline-none focus-ring-0 text-gray-700 placeholder:text-zinc-400"
                />
                <button type="submit"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:shadow-inner m-1 rounded-lg">
                    Cari
                </button>
            </div>
        </form>
    );
}