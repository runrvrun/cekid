"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { updateCategory } from "@/app/actions/updatecategory";
import { deleteCategory } from "@/app/actions/deletecategory";

type Props = {
  id: string;
  name: string;
  productCount: number;
};

export default function CategoryRow({ id, name, productCount }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (value.trim() === name) { setEditing(false); return; }
    setSaving(true);
    setError("");
    const result = await updateCategory(id, value);
    setSaving(false);
    if (result.success) {
      setEditing(false);
    } else {
      setError(result.error ?? "Gagal menyimpan");
    }
  };

  const handleDelete = async () => {
    const msg = productCount > 0
      ? `Kategori "${name}" digunakan oleh ${productCount} produk. Menghapus kategori akan melepas asosiasi dari produk-produk tersebut. Lanjutkan?`
      : `Hapus kategori "${name}"?`;
    if (!confirm(msg)) return;
    setDeleting(true);
    const result = await deleteCategory(id);
    if (!result.success) {
      alert(result.error ?? "Gagal menghapus");
      setDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setValue(name); setEditing(false); setError(""); }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="input py-1 text-sm h-8 max-w-xs"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        ) : (
          <span className="text-sm font-medium text-gray-800">{name}</span>
        )}
      </div>

      <span className="text-xs text-gray-400 shrink-0">
        {productCount} produk
      </span>

      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
              title="Simpan"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { setValue(name); setEditing(false); setError(""); }}
              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              title="Batal"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
              title="Hapus"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
