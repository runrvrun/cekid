export const metadata = {
    title: 'About',
};

export default function About() {
    return (
        <main className="flex flex-col items-center justify-between p-12">
            <h1 className="text-5xl font-bold mb-12">Tentang enakga</h1>
            <div className="max-w-4xl text-lg text-center text-gray-700">
                <p>
                    <b>enakga</b> adalah platform untuk membantu kamu mengambil keputusan cepat saat memilih produk—terutama produk <b>offline</b> yang sering kali minim review.
                </p><p>
Kalau review produk online gampang dicari, beda ceritanya dengan barang di supermarket, minimarket, atau toko fisik. enakga hadir supaya kamu bisa cek pendapat orang lain dan berbagi pengalaman sendiri, secara jujur dan terbuka.
</p><p>
Tujuannya sederhana:
membantu orang menjawab satu pertanyaan penting — “enak ga ya?” sebelum membeli sesuatu, terutama produk yang baru kamu lihat di minimarket atau supermarket.
                </p>
                </div>
            <div className="max-w-4xl text-lg text-center text-gray-700">
                <p className="mt-4">
                    enakga <b>tidak terafiliasi dengan brand atau merek apa pun</b>. Semua penilaian dan ulasan berasal dari pengguna, tanpa sponsor, tanpa pesanan. Jadi kamu bisa mendapatkan gambaran yang lebih apa adanya sebelum memutuskan beli atau nggak.
                </p>
            </div>
        </main>
    );
}