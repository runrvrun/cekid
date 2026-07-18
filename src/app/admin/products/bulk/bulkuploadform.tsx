"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import { bulkCreateProducts } from "@/app/actions/bulkcreateproducts";

type Result = {
  fileName: string;
  success: boolean;
  name?: string;
  slug?: string;
  error?: string;
};

export default function BulkUploadForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? []));
    setResults([]);
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setError(null);
    setResults([]);
    setProcessing(true);
    setProgress({ done: 0, total: files.length });

    try {
      const fd = new FormData();
      for (const file of files) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.25,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });
        fd.append("images", compressed, file.name);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }

      const result = await bulkCreateProducts(fd);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("results" in result && result.results) {
        setResults(result.results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses gambar");
    } finally {
      setProcessing(false);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl">
      <p className="text-sm text-gray-500 mb-4">
        Unggah beberapa foto produk sekaligus (satu foto = satu produk). AI akan
        otomatis mengisi nama, deskripsi, dan kategori, lalu langsung menyimpan
        produk sebagai <span className="font-medium text-green-700">Aktif</span> tanpa perlu ditinjau ulang.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFileChange}
        disabled={processing}
        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-900 file:text-white hover:file:bg-gray-700 disabled:opacity-50"
      />

      {files.length > 0 && !processing && (
        <p className="text-xs text-gray-500 mt-2">{files.length} foto dipilih</p>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={files.length === 0 || processing}
        className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
      >
        {processing
          ? `Memproses ${progress.done}/${progress.total}...`
          : "Unggah dan Buat Produk"}
      </button>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {results.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {results.filter((r) => r.success).length} dari {results.length} produk berhasil dibuat
          </p>
          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {results.map((r, i) => (
              <li key={i} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                <span className="text-gray-500 truncate">{r.fileName}</span>
                {r.success ? (
                  <Link
                    href={`/${r.slug}`}
                    target="_blank"
                    className="text-green-700 hover:underline shrink-0"
                  >
                    ✓ {r.name}
                  </Link>
                ) : (
                  <span className="text-red-600 shrink-0">✗ {r.error}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
