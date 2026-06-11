import UlasanForm from "../ulasan-form";

export default function NewUlasanPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buat Ulasan Baru</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <UlasanForm />
      </div>
    </div>
  );
}
