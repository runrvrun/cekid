"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { uploadUlasanImage } from "@/app/actions/uploadulasanimage";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Link2,
  List,
  ListOrdered,
  ImageIcon,
  Package,
  Quote,
  Loader2,
  Sparkles,
} from "lucide-react";

interface UlasanEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
}

function parseContentForPreview(content: string): string {
  return content.replace(
    /\[product slug=([^\]]+)\]/g,
    (_, slug) =>
      `<div style="border:1px solid #bfdbfe;border-radius:12px;padding:16px;background:#eff6ff;margin:16px 0;display:flex;align-items:center;gap:12px">` +
      `<div style="font-size:24px">📦</div>` +
      `<div><div style="color:#2563eb;font-weight:600;font-size:14px">Snippet Produk</div>` +
      `<div style="color:#1d4ed8;font-size:13px;margin-top:2px">slug: <code style="background:#dbeafe;padding:2px 6px;border-radius:4px">${slug}</code></div>` +
      `<div style="color:#60a5fa;font-size:12px;margin-top:4px">Kartu produk akan tampil di halaman publik</div></div></div>`
  );
}

export default function UlasanEditor({
  initialContent = "",
  onChange,
}: UlasanEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [showSnippetInput, setShowSnippetInput] = useState(false);
  const [snippetSlug, setSnippetSlug] = useState("");
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<[number, number] | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (pendingSelection && textareaRef.current) {
      textareaRef.current.setSelectionRange(pendingSelection[0], pendingSelection[1]);
      textareaRef.current.focus();
      setPendingSelection(null);
    }
  }, [pendingSelection]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const wrap = useCallback(
    (before: string, after: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = content.substring(start, end);
      const newContent =
        content.substring(0, start) + before + selected + after + content.substring(end);
      setContent(newContent);
      onChange(newContent);
      setPendingSelection([start + before.length, start + before.length + selected.length]);
    },
    [content, onChange]
  );

  const insertAt = useCallback(
    (text: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const newContent = content.substring(0, start) + text + content.substring(start);
      setContent(newContent);
      onChange(newContent);
      setPendingSelection([start + text.length, start + text.length]);
    },
    [content, onChange]
  );

  const handleLink = useCallback(() => {
    const url = prompt("Masukkan URL tautan:");
    if (!url) return;
    wrap(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, "</a>");
  }, [wrap]);

  const handleImageFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        });
        const fd = new FormData();
        fd.append("image", compressed);
        const result = await uploadUlasanImage(fd);
        if (result.success && result.url) {
          insertAt(`<img src="${result.url}" alt="gambar" class="ulasan-img" />`);
        } else {
          alert(result.error ?? "Gagal mengunggah gambar");
        }
      } catch {
        alert("Gagal mengunggah gambar");
      } finally {
        setUploading(false);
      }
    },
    [insertAt]
  );

  const handleSnippetInsert = useCallback(() => {
    const slug = snippetSlug.trim();
    if (!slug) return;
    insertAt(`[product slug=${slug}]`);
    setSnippetSlug("");
    setShowSnippetInput(false);
  }, [snippetSlug, insertAt]);

  const handleAiWrite = useCallback(async () => {
    if (!content.trim()) {
      alert("Tulis poin-poin review terlebih dahulu, lalu AI akan mengembangkannya menjadi artikel lengkap.");
      return;
    }
    if (
      !confirm(
        "AI akan mengembangkan poin-poin yang ada menjadi artikel review lengkap. Konten saat ini akan digantikan. Lanjutkan?"
      )
    ) {
      return;
    }

    abortRef.current = new AbortController();
    setAiLoading(true);
    setMode("edit");

    const notes = content;
    setContent("");
    onChange("");

    try {
      const res = await fetch("/api/ai-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Gagal menghubungi AI");
        // Restore original content on error
        setContent(notes);
        onChange(notes);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
        onChange(accumulated);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        alert("Terjadi kesalahan saat menghubungi AI");
        setContent(notes);
        onChange(notes);
      }
    } finally {
      setAiLoading(false);
      abortRef.current = null;
    }
  }, [content, onChange]);

  const handleCancelAi = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const toolbarBtn =
    "p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900 disabled:opacity-40";

  const isLocked = uploading || aiLoading;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50">
        <div className="flex">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === "edit"
                ? "text-gray-900 bg-white border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Tulis
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === "preview"
                ? "text-gray-900 bg-white border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pratinjau
          </button>
        </div>

        {/* AI Write button */}
        {aiLoading ? (
          <button
            type="button"
            onClick={handleCancelAi}
            className="flex items-center gap-1.5 mr-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Batalkan
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAiWrite}
            disabled={isLocked}
            className="flex items-center gap-1.5 mr-2 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Tulis dengan AI
          </button>
        )}
      </div>

      {mode === "edit" && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
            <button type="button" title="Bold" className={toolbarBtn} disabled={isLocked} onClick={() => wrap("<strong>", "</strong>")}>
              <Bold className="w-4 h-4" />
            </button>
            <button type="button" title="Italic" className={toolbarBtn} disabled={isLocked} onClick={() => wrap("<em>", "</em>")}>
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button type="button" title="Heading 2" className={toolbarBtn} disabled={isLocked} onClick={() => wrap("<h2>", "</h2>")}>
              <Heading2 className="w-4 h-4" />
            </button>
            <button type="button" title="Heading 3" className={toolbarBtn} disabled={isLocked} onClick={() => wrap("<h3>", "</h3>")}>
              <Heading3 className="w-4 h-4" />
            </button>
            <button type="button" title="Kutipan" className={toolbarBtn} disabled={isLocked} onClick={() => wrap("<blockquote>", "</blockquote>")}>
              <Quote className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button type="button" title="Daftar tak berurutan" className={toolbarBtn} disabled={isLocked} onClick={() => wrap("<ul>\n  <li>", "</li>\n</ul>")}>
              <List className="w-4 h-4" />
            </button>
            <button type="button" title="Daftar berurutan" className={toolbarBtn} disabled={isLocked} onClick={() => wrap("<ol>\n  <li>", "</li>\n</ol>")}>
              <ListOrdered className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button type="button" title="Tambah tautan" className={toolbarBtn} disabled={isLocked} onClick={handleLink}>
              <Link2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Unggah gambar"
              className={toolbarBtn}
              disabled={isLocked}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button
              type="button"
              title="Tambah snippet produk"
              disabled={isLocked}
              className={`${toolbarBtn} ${showSnippetInput ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}`}
              onClick={() => setShowSnippetInput((v) => !v)}
            >
              <Package className="w-4 h-4" />
            </button>
          </div>

          {/* Product snippet input */}
          {showSnippetInput && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-200">
              <Package className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-xs text-blue-700 font-medium shrink-0">Slug produk:</span>
              <input
                type="text"
                value={snippetSlug}
                onChange={(e) => setSnippetSlug(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSnippetInsert()}
                placeholder="contoh: nama-produk"
                className="flex-1 text-sm border border-blue-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 bg-white"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSnippetInsert}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sisipkan
              </button>
              <button
                type="button"
                onClick={() => { setShowSnippetInput(false); setSnippetSlug(""); }}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Batal
              </button>
            </div>
          )}

          {/* AI loading banner */}
          {aiLoading && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 border-b border-violet-200">
              <Loader2 className="w-4 h-4 text-violet-500 animate-spin shrink-0" />
              <span className="text-sm text-violet-700 font-medium">AI sedang menulis artikel...</span>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            readOnly={aiLoading}
            onChange={(e) => {
              if (aiLoading) return;
              setContent(e.target.value);
              onChange(e.target.value);
            }}
            className={`w-full px-4 py-3 min-h-[420px] font-mono text-sm focus:outline-none resize-y text-gray-800 leading-relaxed transition-colors ${
              aiLoading ? "bg-gray-50 cursor-not-allowed" : "bg-white"
            }`}
            placeholder="Tulis poin-poin review di sini, lalu klik &quot;Tulis dengan AI&quot; untuk mengembangkannya menjadi artikel lengkap..."
          />
        </>
      )}

      {mode === "preview" && (
        <div className="min-h-[420px] p-6">
          {content.trim() ? (
            <div
              className="ulasan-content"
              dangerouslySetInnerHTML={{ __html: parseContentForPreview(content) }}
            />
          ) : (
            <p className="text-gray-400 text-sm italic">Belum ada konten untuk ditampilkan.</p>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImageFile(file);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
