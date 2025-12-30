"use client";
import React, { useEffect, useState } from "react";
import { createReview } from "@/app/actions/createreview";
import { getUserReview } from "@/app/actions/getuserreview";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

type Props = {
  productId: number;
  name: string;
};

export default function AddReviewForm({ productId, name }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  const ratingLabels: Record<number, string> = {
    1: "Tidak suka",
    2: "Kurang suka",
    3: "Biasa saja",
    4: "Suka!",
    5: "Suka sekali!",
  };

  // Load existing review on mount
  useEffect(() => {
    const loadReview = async () => {
      const existing = await getUserReview(productId);
      if (existing) {
        setRating(existing.rating);
        setReview(existing.review ?? "");
        setAnonymous(existing.anonymous);
        setHasExistingReview(true);
      }
    };

    loadReview();
  }, [productId]);

  const handleStarClick = (star: number) => {
    setRating(star);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!rating) {
      setError("Rating wajib diisi.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("productId", String(productId));
      fd.append("rating", String(rating));
      fd.append("anonymous", anonymous ? "true" : "false");
      if (review.trim()) fd.append("review", review.trim());

      const result = await createReview(fd);

      if (!result.success) {
        setError(result.error || "Gagal menambah review");
        return;
      }

      setSuccess(result.message || "Review berhasil ditambahkan.");
      setRating(5);
      setReview("");

      router.push(`/product/${productId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-base-100">
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {success && <div className="text-sm text-green-600 mb-3">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 mb-2 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              className="bg-transparent border-none p-0"
              aria-label={`Beri rating ${star} bintang`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill={star <= rating ? "#facc15" : "#e5e7eb"}
                viewBox="0 0 24 24"
                stroke="#facc15"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 17.75l-6.172 3.245 1.179-6.88L2 9.755l6.914-1.005L12 2.25l3.086 6.5L22 9.755l-5.007 4.36 1.179 6.88z"
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Rating label */}
        <div className="text-center text-sm text-gray-600 mb-3">
          {ratingLabels[rating] ?? ""}
        </div>

        <div className="form-control">
          <textarea
            name="review"
            className="textarea textarea-bordered w-full"
            placeholder="Apakah kamu suka produk ini? Berikan reviewmu di sini..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
          />
        </div>

        {/* Anonymous */}
        <div className="form-control">
          <label className="cursor-pointer label">
            <input
              type="checkbox"
              name="anonymous"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="checkbox checkbox-primary"
            />
            <span className="label-text">Beri review secara anonim</span>
          </label>
        </div>

        <Button type="submit" className="btn btn-primary w-full">
          Berikan Review
        </Button>
      </form>
    </div>
  );
}
