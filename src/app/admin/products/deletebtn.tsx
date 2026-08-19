"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProduct } from "@/app/actions/deleteproduct";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Hapus produk ini? Tindakan tidak dapat dibatalkan.")) return;
    setLoading(true);
    const result = await deleteProduct(productId);
    if (!result.success) {
      alert(result.error ?? "Gagal menghapus produk");
      setLoading(false);
      return;
    }
    setDeleted(true);
  };

  if (deleted) {
    return <span className="text-xs text-gray-400">Terhapus</span>;
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
      title="Hapus"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
