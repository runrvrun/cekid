import Link from "next/link";

export default function AddProductLink() {
  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <p className="text-xs text-white/60 text-center">
        Barang yang kamu cari belum ada? Yuk bantu pembeli lain dengan nambahin reviewnya.
      </p>
      <Link
        href="/product/create"
        className="inline-flex items-center justify-center rounded-full bg-white text-indigo-600 text-sm font-semibold px-5 py-2.5 hover:bg-white/90 transition-colors"
      >
        Buat Barang dan Review
      </Link>
    </div>
  );
}
