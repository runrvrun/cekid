"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteUlasan } from "@/app/actions/deleteulasan";

export default function DeleteUlasanBtn({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Hapus ulasan ini? Tindakan tidak dapat dibatalkan.")) return;
    setLoading(true);
    const result = await deleteUlasan(id);
    if (!result.success) {
      alert(result.error ?? "Gagal menghapus");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
      title="Hapus"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
