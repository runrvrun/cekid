"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X, Star } from "lucide-react";
import { dismissReviewPrompt } from "@/app/actions/dismissreviewprompt";
import { createReview } from "@/app/actions/createreview";

type Props = {
  product: { id: string; slug: string; name: string } | null;
};

export default function ReviewPromptPopup({ product }: Props) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product || hidden) return null;
  if (pathname === `/${product.slug}`) return null;

  const handleDismiss = () => {
    setHidden(true);
    dismissReviewPrompt();
  };

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    setError(null);

    const fd = new FormData();
    fd.append("productId", product.id);
    fd.append("rating", String(rating));
    fd.append("anonymous", "false");
    if (comment.trim()) fd.append("review", comment.trim());

    const result = await createReview(fd);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || "Gagal mengirim review");
      return;
    }

    setSubmitted(true);
    setTimeout(() => setHidden(true), 1800);
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

      {submitted ? (
        <p className="text-sm text-green-700 font-medium py-2 pr-5">
          Makasih atas reviewnya! 🎉
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold text-gray-900 mb-1 pr-5">
            Jadi beli {product.name}?
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Kasih rating & cerita gimana rasanya buat bantu orang lain.
          </p>

          <div className="flex gap-1 justify-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="bg-transparent border-none p-0"
                aria-label={`Beri rating ${star} bintang`}
              >
                <Star
                  className="w-6 h-6"
                  fill={rating != null && star <= rating ? "#facc15" : "#e5e7eb"}
                  stroke="#facc15"
                />
              </button>
            ))}
          </div>

          {rating != null && (
            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Gimana rasanya? (opsional)"
                rows={2}
                className="textarea textarea-bordered w-full text-sm"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground text-xs font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Mengirim..." : "Kirim Review"}
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
          )}

          {rating == null && (
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-gray-500 hover:underline"
            >
              Nanti aja
            </button>
          )}
        </>
      )}
    </div>
  );
}
