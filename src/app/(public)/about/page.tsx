export const metadata = {
    title: 'About',
};

export default function About() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <h1 className="text-5xl font-bold mb-1">Tentang Cek.id</h1>
            <div className="max-w-2xl text-lg text-center text-gray-700">
                <p>
                    Cek.id adalah sebuah platform yang bertujuan untuk menghadirkan transparansi dalam penilaian produk. 
                    Jika penilaian dan ulasan produk online mudah ditemukan, sebaliknya untuk produk offline seringkali sulit didapatkan. 
                    Melalui Cek.id, kamu dapat melihat dan memberikan review produk secara terbuka, sehingga semua orang bisa mendapatkan informasi yang jujur dan bermanfaat.
                </p>
                </div>
            <div className="max-w-2xl text-lg text-center text-gray-700">
                <p className="mt-4">
                    Cek.id tidak terafiliasi dengan brand atau merek manapun. Semua ulasan dan penilaian berasal dari pengguna secara independen.
                </p>
            </div>
        </main>
    );
}