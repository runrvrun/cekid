import Link from "next/link";

export default function AddProductLink({ query }: { query?: string }) {
  if (!query) return (
    <div className="text-center mt-4 text-sm text-gray-500">
      <Link href="/product/create">
        + Atau buat produk baru +
      </Link>
    </div>
  );

  return (
    <div className="text-center mt-4">
      <Link href="/product/create">
        Barang "{ query }" belum ada... <span className="text-blue-500">Tambahkan barang</span>
      </Link>
    </div>
  );
}