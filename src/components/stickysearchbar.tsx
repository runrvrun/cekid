"use client";

import { useEffect, useRef, useState } from "react";
import SearchProduct from "./searchproduct";

export default function StickySearchBar({ initial }: { initial?: string }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Marker placed at the end of the hero section — once it scrolls above the viewport, the hero has been scrolled past */}
      <div ref={sentinelRef} />

      <div
        className={`fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-md px-4 py-2.5 transition-transform duration-200 ${
          showSticky ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-xl mx-auto">
          <SearchProduct initial={initial} />
        </div>
      </div>
    </>
  );
}
