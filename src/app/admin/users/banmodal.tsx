"use client";

import { useState } from "react";
import { banUser, unbanUser } from "@/app/actions/banuser";

type Props = {
  userId: string;
  userName: string;
  isBanned: boolean;
  productCount: number;
  reviewCount: number;
};

export default function BanModal({
  userId,
  userName,
  isBanned,
  productCount,
  reviewCount,
}: Props) {
  const [open, setOpen] = useState(false);
  const [deleteContent, setDeleteContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBan() {
    setLoading(true);
    setError("");
    const result = await banUser(userId, { deleteContent });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  }

  async function handleUnban() {
    setLoading(true);
    setError("");
    const result = await unbanUser(userId);
    setLoading(false);
    if (result.error) setError(result.error);
    else setOpen(false);
  }

  if (isBanned) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-green-600 hover:text-green-800 font-medium whitespace-nowrap"
        >
          Cabut Ban
        </button>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
              <h3 className="font-semibold text-base mb-2">Cabut Ban?</h3>
              <p className="text-sm text-gray-500 mb-5">
                Pengguna <span className="font-medium text-gray-800">{userName}</span> akan
                dapat login kembali.
              </p>
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleUnban}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? "Memproses..." : "Cabut Ban"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap"
      >
        Ban
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-base mb-2">Ban Pengguna?</h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-800">{userName}</span> tidak
              akan bisa login setelah di-ban.
            </p>

            {(productCount > 0 || reviewCount > 0) && (
              <label className="flex items-start gap-2.5 cursor-pointer mb-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={deleteContent}
                  onChange={(e) => setDeleteContent(e.target.checked)}
                  className="mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Hapus semua konten pengguna
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[
                      productCount > 0 && `${productCount} produk`,
                      reviewCount > 0 && `${reviewCount} review`,
                    ]
                      .filter(Boolean)
                      .join(" dan ")}{" "}
                    akan dihapus
                  </p>
                </div>
              </label>
            )}

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setOpen(false); setDeleteContent(false); setError(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleBan}
                disabled={loading}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {loading ? "Memproses..." : "Ban Pengguna"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
