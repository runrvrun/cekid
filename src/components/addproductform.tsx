"use client";

import React, { useRef, useState } from "react";
import { createProduct } from "@/app/actions/createproduct";
import { updateProduct } from "@/app/actions/updateproduct";
import { useRouter } from "next/navigation";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Button } from "./ui/button";

type Product = {
  id: bigint;
  name: string;
  upc?: string | null;
  description?: string | null;
  image?: string | null;
};

type Props = {
  mode: "create" | "edit";
  initialData?: Product;
};

export default function ProductForm({ mode, initialData }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [upc, setUpc] = useState(initialData?.upc ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    initialData?.image ?? null
  );

  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ---------------- IMAGE HANDLING ---------------- */

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  /* ---------------- SUBMIT ---------------- */

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
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });
        fd.append("image", compressedFile);
      }

      const result =
        mode === "create"
          ? await createProduct(fd)
          : await updateProduct(initialData!.id, fd);

      if (!result.success) {
        setError(result.error || "Gagal menyimpan produk");
        return;
      }

      setSuccess(result.message || "Produk berhasil disimpan.");

      const productId = result.data?.id ?? initialData?.id;
      if (productId) router.push(`/product/${productId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-md mx-auto p-4 bg-base-100 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">
        {mode === "create" ? "Tambah Produk" : "Edit Produk"}
      </h2>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {success && <div className="text-sm text-green-600 mb-3">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* IMAGE DROP ZONE */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Foto Produk (opsional)
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`cursor-pointer border-2 border-dashed rounded-lg p-4 text-center transition
              ${dragActive ? "border-primary bg-primary/10" : "border-base-300"}
            `}
          >
            {preview ? (
              <Image
                src={preview}
                alt="Preview"
                width={300}
                height={200}
                className="mx-auto max-h-48 object-cover rounded"
              />
            ) : (
              <div className="text-sm text-base-content/60">
                <p className="font-medium">
                  Drag & drop foto di sini
                </p>
                <p>atau klik untuk upload / ambil foto</p>
              </div>
            )}
          </div>

          {/* Hidden input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        {/* FORM FIELDS */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Nama Barang *
          </label>
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? "Menyimpan..."
            : mode === "create"
            ? "Simpan Produk"
            : "Update Produk"}
        </Button>
      </form>
    </div>
  );
}