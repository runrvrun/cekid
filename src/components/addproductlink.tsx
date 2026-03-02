import Link from "next/link";
import { Button } from "./ui/button";

export default function AddProductLink({ query }: { query?: string }) {
  return (
    <div className="text-center mt-4 text-sm text-gray-500">
      <Button asChild variant="outline" size="sm">
        <Link href={`/product/create`}>
        ➕ Buat produk baru ➕
        </Link>
      </Button>
    </div>
  );
}