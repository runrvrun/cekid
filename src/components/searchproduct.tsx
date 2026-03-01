"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result } from "@zxing/library";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";

type SearchPayload = { query: string };

export default function SearchProduct({
  onSearch,
  initial = "",
}: {
  onSearch?: (payload: SearchPayload) => void;
  initial?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);
    const [error, setError] = useState<string | null>(null);

    // barcode scanning state
    const [scanning, setScanning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const displayCroppedCanvasRef = useRef<HTMLCanvasElement>(null);
    const cropOverlayRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<number | null>(null);
    const codeReader = useRef<BrowserMultiFormatReader | null>(null);

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
              setValue(result.getText());
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;

    const params = new URLSearchParams();
    if (search) {
      params.set("q", search);
    } else {
      params.delete("q");
    }

    router.replace(`${pathname}?${params.toString()}`);

    const q = value.trim();
    if (!q) {
      return;
    }
    onSearch?.({ query: q });
  };

  return (
    <form className="mx-auto w-full lg:w-1/2" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 mt-8 rounded-xl overflow-hidden bg-white border-2 border-black/10 focus-within:border-blue-500/50">
        <div className="flex items-center justify-center pl-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
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
        </div>
        <input
          type="text"
          name="search"
          aria-label="Lagi lihat apa? Cari di sini"
          placeholder="Lagi lihat apa? Cari di sini"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-3 py-3 border-none focus:outline-none focus-ring-0 text-gray-700 placeholder:text-zinc-400"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:shadow-inner m-1 rounded-lg"
        >
          Cari
        </button>
      </div>
      <div className="flex justify-center mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={startScanning}
          disabled={scanning}
        >
          🔍 Scan Barcode
        </Button>
      </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
