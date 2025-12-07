import Link from "next/link";

export default function AddProductLink({ query }: { query?: string }) {
  if (!query) return null;

  return (
    <div className="text-center mt-4">
      <Link href="/product/create" className="text-blue-600 hover:underline">
        Barang yang kamu cari belum ada? Tambahkan barang
      </Link>
    </div>
  );
}