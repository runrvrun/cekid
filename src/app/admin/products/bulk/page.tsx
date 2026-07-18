import Link from "next/link";
import BulkUploadForm from "./bulkuploadform";

export default function BulkUploadPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/products"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Produk
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bulk Upload Produk</h1>
      <BulkUploadForm />
    </div>
  );
}
