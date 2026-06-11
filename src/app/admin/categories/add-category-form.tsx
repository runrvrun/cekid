"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createCategory } from "@/app/actions/createcategory";

export default function AddCategoryForm() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError("");
    const result = await createCategory(value);
    setLoading(false);
    if (result.success) {
      setValue("");
    } else {
      setError(result.error ?? "Gagal menambah kategori");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          placeholder="Nama kategori baru"
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-40 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Tambah
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
