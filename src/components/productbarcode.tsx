"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result } from "@zxing/library";
import JsBarcode from "jsbarcode";
import { addProductUpc } from "@/app/actions/addproductupc";

export default function ProductBarcode({
  productId,
  upc,
  isSignedIn,
}: {
  productId: string;
  upc?: string | null;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (upc && canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, upc, {
          format: "CODE128",
          displayValue: false,
          height: 40,
          margin: 0,
        });
      } catch (err) {
        console.error("Barcode render failed:", err);
      }
    }
  }, [upc]);

  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCroppedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

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
          stopScanning();
          await handleDetected(scanned);
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

  const handleDetected = async (code: string) => {
    setSaving(true);
    setError(null);
    const result = await addProductUpc(productId, code);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  if (upc) {
    return (
      <div className="flex flex-col items-center gap-1 mb-2">
        <canvas ref={canvasRef} />
        <span className="text-xs text-gray-500 font-mono">{upc}</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="mb-2 flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={startScanning}
        disabled={saving}
        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
      >
        {saving ? "Menyimpan barcode..." : "📷 Belum ada barcode — scan untuk menambahkan"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}

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
    </div>
  );
}
