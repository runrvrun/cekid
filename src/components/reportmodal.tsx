"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { createReport } from "@/app/actions/createreport";

const PRODUCT_REASONS = [
  "Gambar produk salah atau tidak sesuai",
  "Gambar produk tidak pantas",
  "Informasi produk tidak akurat",
  "Produk duplikat",
  "Lainnya",
];

const REVIEW_REASONS = [
  "Review menyesatkan atau tidak jujur",
  "Review mengandung kata kasar atau ujaran kebencian",
  "Review tidak relevan dengan produk",
  "Review spam",
  "Lainnya",
];

type Props =
  | { type: "PRODUCT"; productId: string; reviewId?: never }
  | { type: "REVIEW"; reviewId: string; productId: string };

export default function ReportModal({ type, productId, reviewId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const reasons = type === "PRODUCT" ? PRODUCT_REASONS : REVIEW_REASONS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalReason = reason === "Lainnya" ? custom.trim() : reason;
    if (!finalReason) {
      setError("Pilih atau isi alasan laporan.");
      return;
    }

    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.set("type", type);
    fd.set("reason", finalReason);
    if (productId) fd.set("productId", productId);
    if (reviewId) fd.set("reviewId", reviewId);

    const result = await createReport(fd);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setDone(true);
    }
  }

  function handleClose() {
    setOpen(false);
    setReason("");
    setCustom("");
    setError("");
    setDone(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
        title={type === "PRODUCT" ? "Laporkan produk" : "Laporkan review"}
      >
        <Flag className="w-3.5 h-3.5" />
        Laporkan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            {done ? (
              <div className="text-center py-4">
                <p className="text-lg font-semibold mb-2">Laporan Terkirim</p>
                <p className="text-sm text-gray-500 mb-6">
                  Terima kasih. Laporan kamu akan kami tinjau secepatnya.
                </p>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-base mb-4">
                  {type === "PRODUCT" ? "Laporkan Produk" : "Laporkan Review"}
                </h3>
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-2 mb-4">
                    {reasons.map((r) => (
                      <label key={r} className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="reason"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="mt-0.5"
                        />
                        <span className="text-sm">{r}</span>
                      </label>
                    ))}
                  </div>

                  {reason === "Lainnya" && (
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                      rows={3}
                      placeholder="Jelaskan alasan laporan..."
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      maxLength={500}
                    />
                  )}

                  {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {loading ? "Mengirim..." : "Kirim Laporan"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
