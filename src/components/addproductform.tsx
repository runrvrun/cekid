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

type Product = {
  id: bigint;
  name: string;
  slug: string;
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

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [upc, setUpc] = useState(initialData?.upc ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    initialData?.image ?? null
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

  /* ---------------- BARCODE SCANNING ---------------- */
  const DESIRED_CROP_ASPECT_RATIO = 3 / 2;
  // enlarge the scan window – previously 0.4 (40% of video)
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
      // give user a friendly reason if we can
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

      const slug = result.data?.slug ?? initialData?.slug;
      if (slug) router.push(`/${slug}`);
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
            {preview ? (
              <Image
                src={preview}
                alt="Preview"
                width={300}
                height={200}
                className="mx-auto max-h-48 object-cover rounded"
              />
            ) : (
              <div className="space-y-3 text-sm text-base-content/60">
                <p className="font-medium">Drag & drop foto di sini</p>

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
              🔍 Scan
            </Button>
          </div>
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

        {scanning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative bg-white p-2 rounded max-w-full">
              <video
                ref={videoRef}
                // make the preview larger / responsive
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