"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result } from "@zxing/library";
import { useRouter } from "next/navigation";

export default function NavSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // barcode scanning state
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCroppedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  /* ---------------- BARCODE SCANNING (same logic as SearchProduct) ---------------- */
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
          const scanned = result.getText();
          setValue(scanned);
          stopScanning();
          router.push(`/?q=${encodeURIComponent(scanned)}`);
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white focus-within:border-blue-400 transition-colors px-2 py-1 w-full"
      >
        {/* Search icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        {/* Input */}
        <input
          type="text"
          aria-label="Cari produk"
          placeholder="Cari produk..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 min-w-0 text-sm text-gray-700 placeholder:text-gray-400 bg-transparent border-none outline-none focus:ring-0 py-0.5"
        />

        {/* Barcode scan icon button */}
        <button
          type="button"
          onClick={startScanning}
          disabled={scanning}
          title="Scan Barcode"
          aria-label="Scan Barcode"
          className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-40"
        >
          {/* Barcode SVG icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9V5a2 2 0 0 1 2-2h4" />
            <path d="M15 3h4a2 2 0 0 1 2 2v4" />
            <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
            <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
            <line x1="7" y1="7" x2="7" y2="17" />
            <line x1="10" y1="7" x2="10" y2="17" />
            <line x1="13" y1="7" x2="13" y2="17" />
            <line x1="16.5" y1="7" x2="16.5" y2="17" />
          </svg>
        </button>

        {/* Submit button (hidden, triggered by Enter) */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-xs mt-1 absolute top-full left-0 w-full px-2">
          {error}
        </p>
      )}

      {/* Barcode scanner modal */}
      {scanning && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200]">
          <div className="relative bg-white p-2 rounded-xl max-w-full shadow-xl">
            <p className="text-center text-sm text-gray-600 mb-2 font-medium">
              Arahkan kamera ke barcode
            </p>
            <video
              ref={videoRef}
              className="w-[90vw] max-w-md h-auto bg-black rounded"
              muted
              playsInline
            />
            <div ref={cropOverlayRef} />
            <canvas ref={displayCroppedCanvasRef} className="hidden" />
            <button
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 text-red-500 hover:bg-red-50 transition-colors shadow"
              onClick={stopScanning}
              aria-label="Tutup scanner"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
