"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SliderImage = {
  id: bigint;
  url: string;
};

export default function ImageSlider({
  images,
  alt,
}: {
  images: SliderImage[];
  alt: string;
}) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <Image
        src="/product-placeholder.png"
        alt={alt}
        className="w-full h-96 object-cover rounded"
        width={800}
        height={800}
      />
    );
  }

  if (images.length === 1) {
    return (
      <Image
        src={images[0].url}
        alt={alt}
        className="w-full h-96 object-cover rounded"
        width={800}
        height={800}
      />
    );
  }

  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length);
  const next = () => setCurrent((i) => (i + 1) % images.length);

  return (
    <div className="relative w-full">
      {/* Main image */}
      <div className="relative w-full h-96">
        <Image
          src={images[current].url}
          alt={`${alt} ${current + 1}`}
          fill
          className="object-cover rounded"
        />

        {/* Prev/next buttons */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Counter */}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
          {current + 1} / {images.length}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition ${
              i === current ? "bg-primary" : "bg-base-300"
            }`}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
