"use client";
import React, { useState } from "react";
import { createReview } from "@/app/actions/createreview";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export default function AddReviewForm({ productId }: { productId: number }) {
  const router = useRouter();
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      if (review.trim()) fd.append("review", review.trim());
      
      const result = await createReview(fd);

      if (!result.success) {
        setError(result.error || "Gagal menambah review");
        return;
      }

      const product = result.data;
      setSuccess(result.message || "Review berhasil ditambahkan.");

      // reset local form state
      setRating(5);
      setReview("");

      // redirect back to product detail
      if (productId) {
        router.push(`/product/${productId}`);
        return;
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-base-100 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Beri review</h2>

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

        <div className="form-control">
          <textarea
            name="review"
            className="textarea textarea-bordered w-full"
            placeholder="Tulis komentar (opsional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          type="submit"
          className="btn btn-primary w-full"
          disabled={rating === 0}
        >
         Beri Nilai
        </Button>
      </form>
    </div>
  );
}