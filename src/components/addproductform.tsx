"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result } from "@zxing/library";
import { createProduct } from "@/app/actions/createproduct";
import { updateProduct } from "@/app/actions/updateproduct";
import { useRouter } from "next/navigation";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Button } from "./ui/button";

type ExistingImage = {
  id: bigint;
  url: string;
  isMain: boolean;
};

type NewImage = {
  file: File;
  previewUrl: string;
};

type Category = {
  id: bigint;
  name: string;
};

type Product = {
  id: bigint;
  name: string;
  slug: string;
  upc?: string | null;
  description?: string | null;
  images?: ExistingImage[];
  categoryIds?: bigint[];
};

type Props = {
  mode: "create" | "edit";
  initialData?: Product;
  canEditMain?: boolean; // true for ADMIN/MODERATOR in edit mode
  categories?: Category[];
};

export default function ProductForm({ mode, initialData, canEditMain = true, categories = [] }: Props) {
  const router = useRouter();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [upc, setUpc] = useState(initialData?.upc ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");

  // Multi-image state
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    initialData?.images ?? []
  );
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<bigint[]>([]);
  // "existing:{id}" | "new:{index}" | null
  const [mainImageKey, setMainImageKey] = useState<string | null>(() => {
    if (initialData?.images?.length) {
      const main =
        initialData.images.find((img) => img.isMain) ?? initialData.images[0];
      return `existing:${main.id}`;
    }
    return null;
  });

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<bigint[]>(
    initialData?.categoryIds ?? []
  );
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addCategory = (id: bigint) => {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setCategorySearch("");
    setCategoryDropdownOpen(false);
  };

  const removeCategory = (id: bigint) => {
    setSelectedCategoryIds((prev) => prev.filter((c) => c !== id));
  };

  const filteredCategories = categories.filter(
    (c) =>
      !selectedCategoryIds.includes(c.id) &&
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // barcode scanning state
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCroppedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  // detect product with AI state
  const [detectingName, setDetectingName] = useState(false);

  /* ---------------- IMAGE HANDLING ---------------- */

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    const previewUrl = URL.createObjectURL(f);
    const newIndex = newImages.length;
    setNewImages((prev) => [...prev, { file: f, previewUrl }]);
    // Auto-set as main if no main image yet
    if (!mainImageKey && existingImages.length === 0) {
      setMainImageKey(`new:${newIndex}`);
    }
    if (!name) detectProductName(f);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };

  const onMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach((f) => handleFile(f));
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    Array.from(e.dataTransfer.files)
      .filter((f) => f.type.startsWith("image/"))
      .forEach((f) => handleFile(f));
  };

  const removeExistingImage = (id: bigint) => {
    const remaining = existingImages.filter((img) => img.id !== id);
    setExistingImages(remaining);
    setDeletedImageIds((prev) => [...prev, id]);
    if (mainImageKey === `existing:${id}`) {
      // Pick new main
      if (remaining.length > 0) {
        setMainImageKey(`existing:${remaining[0].id}`);
      } else if (newImages.length > 0) {
        setMainImageKey("new:0");
      } else {
        setMainImageKey(null);
      }
    }
  };

  const removeNewImage = (index: number) => {
    const isMain = mainImageKey === `new:${index}`;
    const currentMainIdx =
      mainImageKey?.startsWith("new:")
        ? parseInt(mainImageKey.slice("new:".length))
        : -1;
    const updatedNewImages = newImages.filter((_, i) => i !== index);
    setNewImages(updatedNewImages);

    if (isMain) {
      if (existingImages.length > 0) {
        setMainImageKey(`existing:${existingImages[0].id}`);
      } else if (updatedNewImages.length > 0) {
        setMainImageKey("new:0");
      } else {
        setMainImageKey(null);
      }
    } else if (currentMainIdx > index) {
      setMainImageKey(`new:${currentMainIdx - 1}`);
    }
  };

  const detectProductName = async (imageFile: File) => {
    try {
      setDetectingName(true);
      const compressed = await imageCompression(imageFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      const formData = new FormData();
      formData.append("image", compressed);
      const res = await fetch("/api/product-detect", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data?.name && !name) setName(data.name);
      if (data?.description && !description) setDescription(data.description);
    } catch (err) {
      console.error("AI detection failed:", err);
    } finally {
      setDetectingName(false);
    }
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
      fd.append("slug", name.trim().toLowerCase().replace(/\s+/g, "-"));
      if (upc.trim()) fd.append("upc", upc.trim());
      if (description.trim()) fd.append("description", description.trim());
      for (const id of selectedCategoryIds) {
        fd.append("categoryId", id.toString());
      }

      // Compress and append all new images
      const compressedNewImages: File[] = [];
      for (const img of newImages) {
        const compressed = await imageCompression(img.file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });
        compressedNewImages.push(compressed);
      }

      if (mode === "create") {
        for (const compressed of compressedNewImages) {
          fd.append("images", compressed);
        }
        if (mainImageKey?.startsWith("new:")) {
          fd.append("mainImageIndex", mainImageKey.slice("new:".length));
        }
      } else {
        for (const compressed of compressedNewImages) {
          fd.append("newImages", compressed);
        }
        if (mainImageKey) fd.append("mainImageKey", mainImageKey);
        for (const id of deletedImageIds) {
          fd.append("deleteImageId", id.toString());
        }
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
      const slug = result.data?.slug ?? initialData?.slug;
      if (slug) router.push(`/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- BARCODE SCANNING ---------------- */
  const DESIRED_CROP_ASPECT_RATIO = 3 / 2;
  const CROP_SIZE_FACTOR = 0.6;

  const startScanning = async () => {
    setError(null);
    setScanning(true);
    codeReader.current = new BrowserMultiFormatReader();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia_not_supported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          intervalRef.current = window.setInterval(captureFrameAndCrop, 100);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
          case "PermissionDeniedError":
            setError(
              "Izin kamera ditolak. Pastikan situs ini diijinkan mengakses kamera dan muat ulang halaman."
            );
            break;
          case "NotFoundError":
            setError("Kamera tidak ditemukan pada perangkat.");
            break;
          case "NotReadableError":
            setError("Kamera sedang digunakan oleh aplikasi lain.");
            break;
          default:
            setError(`Gagal mengakses kamera: ${err.message}`);
        }
      } else {
        setError("Tidak dapat mengakses kamera untuk pemindaian barcode.");
      }
      setScanning(false);
    }
  };

  const captureFrameAndCrop = () => {
    if (
      !videoRef.current ||
      !displayCroppedCanvasRef.current ||
      !cropOverlayRef.current
    )
      return;

    const video = videoRef.current;
    const displayCanvas = displayCroppedCanvasRef.current;
    const displayContext = displayCanvas.getContext("2d");
    const overlayDiv = cropOverlayRef.current;

    if (!displayContext) return;

    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");
    if (!tempContext) return;

    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    let cropWidth: number, cropHeight: number;
    const videoRatio = video.videoWidth / video.videoHeight;

    if (videoRatio / DESIRED_CROP_ASPECT_RATIO > 1) {
      cropHeight = video.videoHeight * CROP_SIZE_FACTOR;
      cropWidth = cropHeight * DESIRED_CROP_ASPECT_RATIO;
    } else {
      cropWidth = video.videoWidth * CROP_SIZE_FACTOR;
      cropHeight = cropWidth / DESIRED_CROP_ASPECT_RATIO;
    }

    cropWidth = Math.min(cropWidth, video.videoWidth);
    cropHeight = Math.min(cropHeight, video.videoHeight);

    const MIN_CROP_WIDTH = 240;
    const MAX_CROP_WIDTH = 600;
    const MIN_CROP_HEIGHT = 80;
    const MAX_CROP_HEIGHT = 400;

    cropWidth = Math.max(MIN_CROP_WIDTH, Math.min(MAX_CROP_WIDTH, cropWidth));
    cropHeight = Math.max(MIN_CROP_HEIGHT, Math.min(MAX_CROP_HEIGHT, cropHeight));

    const cropX = (video.videoWidth - cropWidth) / 2;
    const cropY = (video.videoHeight - cropHeight) / 2;

    displayCanvas.width = cropWidth;
    displayCanvas.height = cropHeight;

    displayContext.drawImage(
      tempCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    overlayDiv.style.position = "absolute";
    overlayDiv.style.left = `${(cropX / video.videoWidth) * 100}%`;
    overlayDiv.style.top = `${(cropY / video.videoHeight) * 100}%`;
    overlayDiv.style.width = `${(cropWidth / video.videoWidth) * 100}%`;
    overlayDiv.style.height = `${(cropHeight / video.videoHeight) * 100}%`;
    overlayDiv.style.border = "2px solid white";
    overlayDiv.style.borderRadius = "0.5rem";
    overlayDiv.style.pointerEvents = "none";
    overlayDiv.style.boxSizing = "border-box";

    const decodeCanvas = async () => {
      try {
        const result: Result = await codeReader.current!.decodeFromCanvas(
          displayCanvas
        );
        if (result && result.getText()) {
          setUpc(result.getText());
          stopScanning();
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "NotFoundException") {
          console.error("Decoding error:", err);
        }
      }
    };

    decodeCanvas();
  };

  const stopScanning = () => {
    setScanning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (codeReader.current) {
      codeReader.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  /* ---------------- UI ---------------- */

  const hasImages = existingImages.length > 0 || newImages.length > 0;

  return (
    <div className="max-w-md mx-auto p-4 bg-base-100 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">
        {mode === "create" ? "Tambah Produk" : "Edit Produk"}
      </h2>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {success && <div className="text-sm text-green-600 mb-3">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* IMAGE SECTION */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Foto Produk (opsional)
          </label>

          {/* Thumbnails */}
          {hasImages && (
            <div className="flex flex-wrap gap-2 mb-3">
              {existingImages.map((img) => {
                const isMain = mainImageKey === `existing:${img.id}`;
                return (
                  <div key={String(img.id)} className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={img.url}
                      alt="Foto produk"
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center z-10 leading-none"
                    >
                      ×
                    </button>
                    {isMain ? (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-xs text-center py-0.5 rounded-b-lg">
                        Utama
                      </div>
                    ) : canEditMain ? (
                      <button
                        type="button"
                        onClick={() => setMainImageKey(`existing:${img.id}`)}
                        className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 rounded-b-lg hover:bg-black/70"
                      >
                        Set Utama
                      </button>
                    ) : null}
                  </div>
                );
              })}

              {newImages.map((img, i) => {
                const isMain = mainImageKey === `new:${i}`;
                return (
                  <div key={`new-${i}`} className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={img.previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center z-10 leading-none"
                    >
                      ×
                    </button>
                    {isMain ? (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-xs text-center py-0.5 rounded-b-lg">
                        Utama
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMainImageKey(`new:${i}`)}
                        className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 rounded-b-lg hover:bg-black/70"
                      >
                        Set Utama
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-lg p-4 text-center transition
              ${dragActive ? "border-primary bg-primary/10" : "border-base-300"}
            `}
          >
            <div className="space-y-3 text-sm text-base-content/60">
              <p className="font-medium">
                {hasImages ? "Tambah foto lagi" : "Drag & drop foto di sini"}
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  📷 Ambil Foto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  🖼️ Galeri
                </Button>
              </div>
            </div>
            {detectingName && (
              <p className="text-xs text-base-content/60 mt-2">
                🔎 Mendeteksi nama produk...
              </p>
            )}
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onMultipleFileChange}
            className="hidden"
          />
        </div>

        {/* FORM FIELDS */}
        <div>
          <label className="block text-sm font-medium mb-1">Barcode Produk</label>
          <div className="flex gap-2">
            <input
              value={upc}
              onChange={(e) => setUpc(e.target.value)}
              className="input input-bordered w-full"
            />
            <Button
              type="button"
              variant="outline"
              onClick={startScanning}
              disabled={scanning}
            >
              Scan 𝄃𝄂𝄀𝄁𝄃𝄂𝄂𝄃
            </Button>
          </div>
        </div>

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
          <label className="block text-sm font-medium mb-1">Deskripsi</label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea textarea-bordered w-full"
            rows={4}
          />
        </div>

        {categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Kategori <span className="text-gray-400 font-normal">(opsional)</span>
            </label>

            {/* Selected chips */}
            {selectedCategoryIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedCategoryIds.map((id) => {
                  const cat = categories.find((c) => c.id === id);
                  if (!cat) return null;
                  return (
                    <span
                      key={String(id)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200"
                    >
                      {cat.name}
                      <button
                        type="button"
                        onClick={() => removeCategory(id)}
                        className="hover:text-green-900 leading-none"
                        aria-label={`Hapus ${cat.name}`}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search input + dropdown */}
            <div ref={categoryRef} className="relative">
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setCategoryDropdownOpen(true);
                }}
                onFocus={() => setCategoryDropdownOpen(true)}
                onClick={() => setCategoryDropdownOpen(true)}
                placeholder="Cari kategori..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {categoryDropdownOpen && filteredCategories.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {filteredCategories.map((cat) => (
                    <li key={String(cat.id)}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevent input blur before click fires
                          addCategory(cat.id);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {scanning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative bg-white p-2 rounded max-w-full">
              <video
                ref={videoRef}
                className="w-[90vw] max-w-md h-auto bg-black"
                muted
                playsInline
              />
              <div ref={cropOverlayRef}></div>
              <canvas ref={displayCroppedCanvasRef} className="hidden" />
              <button
                className="absolute top-1 right-1 text-red-500"
                onClick={stopScanning}
              >
                ✖
              </button>
            </div>
          </div>
        )}

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
