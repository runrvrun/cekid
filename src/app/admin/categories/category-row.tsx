"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { updateCategory } from "@/app/actions/updatecategory";
import { deleteCategory } from "@/app/actions/deletecategory";

type Props = {
  id: string;
  name: string;
  productCount: number;
  hasChildren: boolean;
  parentId: string | null;
  parentOptions: { id: string; name: string }[];
};

export default function CategoryRow({
  id,
  name,
  productCount,
  hasChildren,
  parentId,
  parentOptions,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [selectedParentId, setSelectedParentId] = useState(parentId ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (value.trim() === name && selectedParentId === (parentId ?? "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    const result = await updateCategory(id, value, selectedParentId || null);
    setSaving(false);
    if (result.success) {
      setEditing(false);
    } else {
      setError(result.error ?? "Gagal menyimpan");
    }
  };

  const handleCancel = () => {
    setValue(name);
    setSelectedParentId(parentId ?? "");
    setEditing(false);
    setError("");
  };

  const handleDelete = async () => {
    const parts = [];
    if (productCount > 0) parts.push(`digunakan oleh ${productCount} produk`);
    if (hasChildren) parts.push("punya subkategori yang akan menjadi kategori utama");
    const msg =
      parts.length > 0
        ? `Kategori "${name}" ${parts.join(" dan ")}. Lanjutkan hapus?`
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
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-1">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="input py-1 text-sm h-8 max-w-xs"
              />
              {(!hasChildren || parentId) && (
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="input py-1 text-sm h-8 w-36"
                >
                  <option value="">Kategori utama</option>
                  {parentOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      di bawah: {o.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
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
              onClick={handleCancel}
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
