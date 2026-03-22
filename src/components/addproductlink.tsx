import Link from "next/link";

export default function AddProductLink() {
  return (
    <p className="mt-3 text-xs text-white/60">
      Produk tidak ditemukan?{" "}
      <Link
        href="/product/create"
        className="text-white underline underline-offset-2 hover:text-white/80 transition-colors"
      >
        Tambah produk baru
      </Link>
    </p>
  );
}
