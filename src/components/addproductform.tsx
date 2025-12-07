"use client";
import React, { useState } from "react";
import { createProduct } from "@/app/actions/createproduct";
import { useRouter } from "next/navigation";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Button } from "./ui/button";

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
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

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

      // --- 🔥 Compress image BEFORE sending to server ---
      if (file) {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.8,               // target max size
          maxWidthOrHeight: 800,     // downscale dimension
          useWebWorker: true,
        });

        fd.append("image", compressedFile);
      }

      const result = await createProduct(fd);

      if (!result.success) {
        setError(result.error || "Gagal menambah produk");
        return;
      }

      const product = result.data;
      setSuccess(result.message || "Produk berhasil ditambahkan.");

      // Reset form UI
      setName("");
      setUpc("");
      setDescription("");
      setFile(null);
      setPreview(null);

      // Redirect
      const id = product?.id;
      if (id) router.push(`/product/${id}`);

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
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="file-input"
          />

          {preview && (
            <Image
              width={160}
              height={160}
              src={preview}
              alt="preview"
              className="mt-2 h-32 w-full object-cover rounded"
            />
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Produk"}
        </Button>
      </form>
    </div>
  );
}
