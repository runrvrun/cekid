"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import UlasanEditor from "@/components/ulasan-editor";
import { createUlasan } from "@/app/actions/createulasan";
import { updateUlasan } from "@/app/actions/updateulasan";
import { generateMetaDescription } from "@/app/actions/generatemetadescription";
import { Loader2, Sparkles } from "lucide-react";

// Used when auto-generating permalink from title
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Used when user types directly in permalink field — preserves trailing hyphens
function sanitizePermalink(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

type UlasanData = {
  id?: string;
  title?: string;
  permalink?: string;
  content?: string;
  metaDescription?: string;
  status?: "DRAFT" | "PUBLISHED";
};

export default function UlasanForm({ initial }: { initial?: UlasanData }) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [permalink, setPermalink] = useState(initial?.permalink ?? "");
  const [permalinkTouched, setPermalinkTouched] = useState(isEdit);
  const [content, setContent] = useState(initial?.content ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(initial?.status ?? "DRAFT");
  const [loading, setLoading] = useState(false);
  const [metaAiLoading, setMetaAiLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      if (!permalinkTouched) {
        setPermalink(slugify(val));
      }
    },
    [permalinkTouched]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = { title, permalink, content, metaDescription, status };

    const result = isEdit
      ? await updateUlasan(initial!.id!, data)
      : await createUlasan(data);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Terjadi kesalahan");
      return;
    }

    router.push("/admin/ulasan");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Judul <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="input"
            placeholder="Judul ulasan"
            required
          />
        </div>

        {/* Permalink */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Permalink <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 shrink-0">enakga.com/r/</span>
            <input
              type="text"
              value={permalink}
              onChange={(e) => {
                setPermalinkTouched(true);
                setPermalink(sanitizePermalink(e.target.value));
              }}
              className="input flex-1"
              placeholder="review-nama-produk"
              required
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
            className="input"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Dipublikasikan</option>
          </select>
        </div>
      </div>

      {/* Content editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Konten
        </label>
        <UlasanEditor initialContent={content} onChange={setContent} />
        <p className="text-xs text-gray-400 mt-1.5">
          Gunakan HTML. Gunakan <code className="bg-gray-100 px-1 rounded">[product slug=nama-produk]</code> untuk menyisipkan kartu produk.
        </p>
      </div>

      {/* SEO Meta description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700">
              Meta Description <span className="text-gray-400 font-normal">(SEO)</span>
            </label>
            <button
              type="button"
              disabled={metaAiLoading}
              onClick={async () => {
                setMetaAiLoading(true);
                const result = await generateMetaDescription(content);
                setMetaAiLoading(false);
                if (result.success) {
                  setMetaDescription(result.text);
                } else {
                  alert(result.error ?? "Gagal membuat meta description");
                }
              }}
              className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-40"
            >
              {metaAiLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {metaAiLoading ? "Membuat..." : "Tulis dengan AI"}
            </button>
          </div>
          <span className={`text-xs ${metaDescription.length > 160 ? "text-red-500" : "text-gray-400"}`}>
            {metaDescription.length}/160
          </span>
        </div>
        <textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          maxLength={160}
          rows={3}
          className="textarea resize-none"
          placeholder="Deskripsi singkat untuk mesin pencari (maks. 160 karakter)"
        />
        <p className="text-xs text-gray-400 mt-1">
          Akan muncul sebagai deskripsi di hasil pencarian Google.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Simpan Perubahan" : "Buat Ulasan"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/ulasan")}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
