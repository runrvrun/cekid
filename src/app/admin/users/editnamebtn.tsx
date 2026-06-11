"use client";

import { useState } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { updateUserName } from "@/app/actions/updateusername";

type Props = { userId: string; name: string };

export default function EditNameBtn({ userId, name }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (value.trim() === name) { setEditing(false); return; }
    setSaving(true);
    setError("");
    const result = await updateUserName(userId, value);
    setSaving(false);
    if (result.success) {
      setEditing(false);
    } else {
      setError(result.error ?? "Gagal menyimpan");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setValue(name); setEditing(false); setError(""); }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="border border-gray-300 rounded-lg px-2 py-0.5 text-sm w-32 focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-40"
            title="Simpan"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => { setValue(name); setEditing(false); setError(""); }}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
            title="Batal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 group/name max-w-[140px]"
      title="Ubah nama"
    >
      <span className="font-medium text-gray-900 truncate">{name}</span>
      <Pencil className="w-3 h-3 text-gray-300 group-hover/name:text-gray-500 shrink-0 transition-colors" />
    </button>
  );
}
