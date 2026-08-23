"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { dismissReviewPrompt } from "@/app/actions/dismissreviewprompt";

type Props = {
  product: { slug: string; name: string } | null;
};

export default function ReviewPromptPopup({ product }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);

  if (!product || hidden) return null;
  if (pathname === `/${product.slug}`) return null;

  const handleDismiss = () => {
    setHidden(true);
    dismissReviewPrompt();
  };

  const handleReview = () => {
    setHidden(true);
    router.push(`/${product.slug}#tulis-review`);
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:max-w-sm bg-white border border-gray-200 rounded-xl shadow-lg p-4">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
      <p className="text-sm font-semibold text-gray-900 mb-1 pr-5">
        Udah coba {product.name}?
      </p>
      <p className="text-xs text-gray-500 mb-3">
        Kamu baru lihat produk ini. Kalau udah beli, yuk kasih tau orang lain gimana rasanya!
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleReview}
          className="flex-1 bg-primary text-primary-foreground text-xs font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Tulis Review
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-gray-500 hover:underline px-1"
        >
          Nanti aja
        </button>
      </div>
    </div>
  );
}
