"use client";
import React, { useState } from "react";
import { createProduct } from "@/app/actions/createproduct";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AddProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [upc, setUpc] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  // compress image to targetKB (approx) using canvas + iterative quality reduction
  async function compressImage(fileToCompress: File, targetKB = 50): Promise<File> {
    if (!fileToCompress.type.startsWith("image/")) return fileToCompress;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = URL.createObjectURL(fileToCompress);
    });

    // start with original dimensions
    let { width, height } = img;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return fileToCompress;

    // downscale if image is very large
    const maxDim = 1600;
    if (width > maxDim || height > maxDim) {
      const ratio = Math.max(width / maxDim, height / maxDim);
      width = Math.round(width / ratio);
      height = Math.round(height / ratio);
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // iterative quality reduction (binary search)
    let qualityLow = 0.1;
    let qualityHigh = 0.95;
    let bestBlob: Blob | null = null;

    for (let i = 0; i < 7; i++) {
      const q = (qualityLow + qualityHigh) / 2;
      // convert to jpeg for better compression
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const blob: Blob | null = await new Promise((res) =>
        canvas.toBlob(res, "image/jpeg", q)
      );
      if (!blob) break;
      const sizeKB = blob.size / 1024;
      bestBlob = blob;
      if (sizeKB > targetKB) {
        // too big -> lower quality
        qualityHigh = q;
      } else {
        // under target -> try higher quality
        qualityLow = q;
      }
    }

    // If still too large, progressively downscale and retry
    let attempts = 0;
    let finalBlob = bestBlob;
    while (finalBlob && finalBlob.size / 1024 > targetKB && attempts < 6) {
      attempts++;
      // reduce dimensions by 0.8
      width = Math.max(100, Math.round(width * 0.8));
      height = Math.max(100, Math.round(height * 0.8));
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      // try moderate quality
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      finalBlob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.7));
    }

    const outBlob = finalBlob ?? (bestBlob as Blob) ?? fileToCompress;
    const fileNameBase = fileToCompress.name.replace(/\.[^/.]+$/, "");
    const newFile = new File([outBlob], `${fileNameBase}.jpg`, { type: "image/jpeg" });
    return newFile;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Nama Barang wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      if (upc.trim()) fd.append("upc", upc.trim());
      if (description.trim()) fd.append("description", description.trim());

      if (file) {
        try {
          const compressed = await compressImage(file, 50); // target 50KB
          fd.append("image", compressed, compressed.name);
        } catch (compressErr) {
          // fallback to original file if compression fails
          fd.append("image", file);
        }
      }

      const result = await createProduct(fd);

      if (!result.success) {
        setError(result.error || "Gagal menambah produk");
        return;
      }

      const product = result.data;
      setSuccess(result.message || "Produk berhasil ditambahkan.");

      // reset local form state
      setName("");
      setUpc("");
      setDescription("");
      setFile(null);
      setPreview(null);

      // redirect to newly created product detail page if id available
      const id = product?.id ?? null;
      if (id) {
        router.push(`/product/${id}`);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-base-100 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Tambah Produk</h2>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {success && <div className="text-sm text-green-600 mb-3">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nama Barang *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kode UPC</label>
          <input
            value={upc}
            onChange={(e) => setUpc(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea textarea-bordered w-full"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Foto (opsional)</label>
          <input type="file" accept="image/*" onChange={onFileChange} className="file-input" />
          {preview && (
            <Image width={160} height={160} src={preview} alt="preview" className="mt-2 h-32 w-full object-cover rounded" />
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Produk"}
        </button>
      </form>
    </div>
  );
}