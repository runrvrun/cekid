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
  kind?: "PHOTO" | "NUTRITION_LABEL";
};

type NewImage = {
  file: File;
  previewUrl: string;
};

type Category = {
  id: string;
  name: string;
};

type ExtraNutritionItem = {
  label: string;
  value: string;
  unit: string;
};

type NutritionData = {
  servingSizeValue?: number | null;
  servingSizeUnit?: string | null;
  sugarPerServing?: number | null;
  sodiumPerServing?: number | null;
  saturatedFatPerServing?: number | null;
  sugarPer100?: number | null;
  sodiumPer100?: number | null;
  saturatedFatPer100?: number | null;
  extra?: unknown;
} | null;

type Product = {
  id: bigint;
  name: string;
  slug: string;
  upc?: string | null;
  description?: string | null;
  images?: ExistingImage[];
  categoryIds?: string[];
  nutrition?: NutritionData;
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

  // Multi-image state (general product photos only; nutrition label photo is tracked separately below)
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    (initialData?.images ?? []).filter((img) => img.kind !== "NUTRITION_LABEL")
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

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
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

  const addCategory = (id: string) => {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setCategorySearch("");
    setCategoryDropdownOpen(false);
  };

  const removeCategory = (id: string) => {
    setSelectedCategoryIds((prev) => prev.filter((c) => c !== id));
  };

  const filteredCategories = categories.filter(
    (c) =>
      !selectedCategoryIds.includes(c.id) &&
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  /* ---------------- NUTRITION STATE ---------------- */
  const existingNutritionImage =
    (initialData?.images ?? []).find((img) => img.kind === "NUTRITION_LABEL") ?? null;

  const nutritionCameraInputRef = useRef<HTMLInputElement>(null);
  const nutritionGalleryInputRef = useRef<HTMLInputElement>(null);
  const [nutritionImage, setNutritionImage] = useState<NewImage | null>(null);
  const [removedNutritionImageId, setRemovedNutritionImageId] = useState<bigint | null>(null);
  const [detectingNutrition, setDetectingNutrition] = useState(false);

  const [servingSizeValue, setServingSizeValue] = useState(
    initialData?.nutrition?.servingSizeValue != null
      ? String(initialData.nutrition.servingSizeValue)
      : ""
  );
  const [servingSizeUnit, setServingSizeUnit] = useState(
    initialData?.nutrition?.servingSizeUnit ?? "g"
  );
  const [sugarPerServing, setSugarPerServing] = useState(
    initialData?.nutrition?.sugarPerServing != null
      ? String(initialData.nutrition.sugarPerServing)
      : ""
  );
  const [sodiumPerServing, setSodiumPerServing] = useState(
    initialData?.nutrition?.sodiumPerServing != null
      ? String(initialData.nutrition.sodiumPerServing)
      : ""
  );
  const [saturatedFatPerServing, setSaturatedFatPerServing] = useState(
    initialData?.nutrition?.saturatedFatPerServing != null
      ? String(initialData.nutrition.saturatedFatPerServing)
      : ""
  );
  // Populated only via AI detection (when the label prints a per-100 reference column);
  // not directly editable, but carried through to submission for more accurate grading.
  const [per100, setPer100] = useState<{
    sugar: number | null;
    sodium: number | null;
    saturatedFat: number | null;
  }>({
    sugar: initialData?.nutrition?.sugarPer100 ?? null,
    sodium: initialData?.nutrition?.sodiumPer100 ?? null,
    saturatedFat: initialData?.nutrition?.saturatedFatPer100 ?? null,
  });
  const [extraItems, setExtraItems] = useState<ExtraNutritionItem[]>(() => {
    const raw = initialData?.nutrition?.extra;
    if (Array.isArray(raw)) {
      return raw.map((item) => ({
        label: String((item as Record<string, unknown>)?.label ?? ""),
        value: String((item as Record<string, unknown>)?.value ?? ""),
        unit: String((item as Record<string, unknown>)?.unit ?? ""),
      }));
    }
    return [];
  });

  const onNutritionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    setNutritionImage({ file: f, previewUrl: URL.createObjectURL(f) });
    detectNutrition(f);
  };

  const removeNutritionImage = () => {
    if (nutritionImage) {
      setNutritionImage(null);
    } else if (existingNutritionImage) {
      setRemovedNutritionImageId(existingNutritionImage.id);
    }
  };

  const detectNutrition = async (imageFile: File) => {
    try {
      setDetectingNutrition(true);
      const compressed = await imageCompression(imageFile, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      const fd = new FormData();
      fd.append("image", compressed);
      const res = await fetch("/api/nutrition-detect", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data?.servingSizeValue != null) setServingSizeValue(String(data.servingSizeValue));
      if (data?.servingSizeUnit) setServingSizeUnit(data.servingSizeUnit);
      if (data?.sugarPerServing != null) setSugarPerServing(String(data.sugarPerServing));
      if (data?.sodiumPerServing != null) setSodiumPerServing(String(data.sodiumPerServing));
      if (data?.saturatedFatPerServing != null)
        setSaturatedFatPerServing(String(data.saturatedFatPerServing));
      setPer100({
        sugar: data?.sugarPer100 ?? null,
        sodium: data?.sodiumPer100 ?? null,
        saturatedFat: data?.saturatedFatPer100 ?? null,
      });
      if (Array.isArray(data?.other) && data.other.length > 0) {
        setExtraItems((prev) => [
          ...prev,
          ...data.other.map((o: { label?: string; value?: string | number; unit?: string }) => ({
            label: String(o.label ?? ""),
            value: String(o.value ?? ""),
            unit: String(o.unit ?? ""),
          })),
        ]);
      }
    } catch (err) {
      console.error("Nutrition AI detection failed:", err);
    } finally {
      setDetectingNutrition(false);
    }
  };

  const addExtraItem = () => {
    setExtraItems((prev) => [...prev, { label: "", value: "", unit: "" }]);
  };

  const updateExtraItem = (index: number, patch: Partial<ExtraNutritionItem>) => {
    setExtraItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeExtraItem = (index: number) => {
    setExtraItems((prev) => prev.filter((_, i) => i !== index));
  };

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
    const shouldDetect =
      mode === "create"
        ? !name
        : !description || selectedCategoryIds.length === 0;
    if (shouldDetect) detectProductName(f);
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
        maxSizeMB: 0.25,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      const fd = new FormData();
      fd.append("image", compressed);
      if (categories.length > 0) {
        fd.append("categoryNames", categories.map((c) => c.name).join(","));
      }
      const res = await fetch("/api/product-detect", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data?.name && !name) setName(data.name);
      if (data?.description && !description) setDescription(data.description);
      if (data?.categories?.length) {
        const matched = (data.categories as string[])
          .map((suggested: string) =>
            categories.find(
              (c) => c.name.toLowerCase() === suggested.toLowerCase()
            )
          )
          .filter((c): c is Category => c !== undefined)
          .map((c) => c.id);
        if (matched.length > 0) {
          setSelectedCategoryIds((prev) => [
            ...prev,
            ...matched.filter((id) => !prev.includes(id)),
          ]);
        }
      }
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
          maxSizeMB: 0.25,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });
        compressedNewImages.push(compressed);
      }

      // Compress nutrition label photo, if any
      let compressedNutritionImage: File | null = null;
      if (nutritionImage) {
        compressedNutritionImage = await imageCompression(nutritionImage.file, {
          maxSizeMB: 0.25,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });
      }

      // Pre-flight: catch oversized payloads before hitting the server limit
      const totalBytes =
        compressedNewImages.reduce((sum, f) => sum + f.size, 0) +
        (compressedNutritionImage?.size ?? 0);
      if (totalBytes > 7 * 1024 * 1024) {
        setError(
          `Ukuran gambar terlalu besar (${(totalBytes / 1024 / 1024).toFixed(1)} MB). Kurangi jumlah atau resolusi gambar.`
        );
        setLoading(false);
        return;
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
        if (removedNutritionImageId) {
          fd.append("deleteImageId", removedNutritionImageId.toString());
        }
      }

      // Nutrition info (all optional)
      if (compressedNutritionImage) {
        fd.append("nutritionImage", compressedNutritionImage);
      }
      if (servingSizeValue.trim()) fd.append("nutritionServingSizeValue", servingSizeValue.trim());
      if (servingSizeUnit) fd.append("nutritionServingSizeUnit", servingSizeUnit);
      if (sugarPerServing.trim()) fd.append("nutritionSugarPerServing", sugarPerServing.trim());
      if (sodiumPerServing.trim()) fd.append("nutritionSodiumPerServing", sodiumPerServing.trim());
      if (saturatedFatPerServing.trim())
        fd.append("nutritionSaturatedFatPerServing", saturatedFatPerServing.trim());
      if (per100.sugar != null) fd.append("nutritionSugarPer100", String(per100.sugar));
      if (per100.sodium != null) fd.append("nutritionSodiumPer100", String(per100.sodium));
      if (per100.saturatedFat != null)
        fd.append("nutritionSaturatedFatPer100", String(per100.saturatedFat));
      const cleanExtraItems = extraItems.filter((item) => item.label.trim() && item.value.trim());
      if (cleanExtraItems.length > 0) {
        fd.append("nutritionExtra", JSON.stringify(cleanExtraItems));
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

    const decodeCanvas = () => {
      try {
        const result: Result = codeReader.current!.decodeFromCanvas(
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
            Foto
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Detail produk akan otomatis terisi dengan AI setelah foto diunggah.
          </p>

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
          <label className="block text-sm font-medium mb-1">Barcode</label>
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

        {/* NUTRITION SECTION */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-1">
            Informasi Gizi <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Unggah foto label gizi kemasan untuk deteksi otomatis, atau isi manual. Foto ini juga
            akan tampil di galeri foto produk.
          </p>

          {/* Nutrition label photo */}
          <div className="mb-3">
            {nutritionImage ? (
              <div className="relative w-24 h-24">
                <Image
                  src={nutritionImage.previewUrl}
                  alt="Foto label gizi"
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeNutritionImage}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center z-10 leading-none"
                >
                  ×
                </button>
              </div>
            ) : existingNutritionImage && !removedNutritionImageId ? (
              <div className="relative w-24 h-24">
                <Image
                  src={existingNutritionImage.url}
                  alt="Foto label gizi"
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeNutritionImage}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center z-10 leading-none"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => nutritionCameraInputRef.current?.click()}
                >
                  📷 Ambil Foto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => nutritionGalleryInputRef.current?.click()}
                >
                  🖼️ Galeri
                </Button>
              </div>
            )}
            <input
              ref={nutritionCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onNutritionImageChange}
              className="hidden"
            />
            <input
              ref={nutritionGalleryInputRef}
              type="file"
              accept="image/*"
              onChange={onNutritionImageChange}
              className="hidden"
            />
            {detectingNutrition && (
              <p className="text-xs text-base-content/60 mt-2">
                🔎 Mendeteksi informasi gizi...
              </p>
            )}
          </div>

          {/* Manual fields */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium mb-1">Ukuran Saji</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="any"
                  value={servingSizeValue}
                  onChange={(e) => setServingSizeValue(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="30"
                />
                <select
                  value={servingSizeUnit}
                  onChange={(e) => setServingSizeUnit(e.target.value)}
                  className="input input-bordered"
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Gula per saji (g)</label>
              <input
                type="number"
                step="any"
                value={sugarPerServing}
                onChange={(e) => setSugarPerServing(e.target.value)}
                className="input input-bordered w-full"
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Natrium per saji (mg)</label>
              <input
                type="number"
                step="any"
                value={sodiumPerServing}
                onChange={(e) => setSodiumPerServing(e.target.value)}
                className="input input-bordered w-full"
                placeholder="120"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Lemak Jenuh per saji (g)</label>
              <input
                type="number"
                step="any"
                value={saturatedFatPerServing}
                onChange={(e) => setSaturatedFatPerServing(e.target.value)}
                className="input input-bordered w-full"
                placeholder="1.5"
              />
            </div>
          </div>

          {/* Extra nutrition items */}
          {extraItems.length > 0 && (
            <div className="space-y-2 mb-2">
              {extraItems.map((item, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <input
                    value={item.label}
                    onChange={(e) => updateExtraItem(i, { label: e.target.value })}
                    placeholder="Label (mis. Energi)"
                    className="input input-bordered flex-1 text-sm"
                  />
                  <input
                    value={item.value}
                    onChange={(e) => updateExtraItem(i, { value: e.target.value })}
                    placeholder="Nilai"
                    className="input input-bordered w-20 text-sm"
                  />
                  <input
                    value={item.unit}
                    onChange={(e) => updateExtraItem(i, { unit: e.target.value })}
                    placeholder="Unit"
                    className="input input-bordered w-16 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeExtraItem(i)}
                    className="text-red-500 hover:text-red-700 text-sm leading-none px-1"
                    aria-label="Hapus"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addExtraItem}>
            + Tambah info lain
          </Button>
        </div>

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
