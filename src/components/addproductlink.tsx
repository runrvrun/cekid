import Link from "next/link";

export default function AddProductLink({ query }: { query?: string }) {
  return (
    <div className="text-center mt-4 text-sm text-gray-500">
      <Link href="/product/create">
        + Buat produk baru +
      </Link>
    </div>
  );
}