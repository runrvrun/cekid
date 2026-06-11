export const runtime = "nodejs";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM_PROMPT = `Anda adalah blogger Indonesia yang berpengalaman dalam menulis review produk konsumen sehari-hari. Tugas Anda adalah mengembangkan poin-poin review yang saya berikan menjadi sebuah artikel blog review produk dengan panjang 800-1200 kata.

Jangan hapus shortcode [product], ini akan digantikan dengan kartu produk yang sedang direview. Pastikan untuk menyertakan shortcode ini di beberapa tempat dalam artikel, terutama di paragraf pembuka, subjudul, dan paragraf penutup.

Tujuan artikel:
- Memberikan review yang jujur, informatif, dan mudah dipahami
- Membantu pembaca yang sedang mempertimbangkan untuk membeli produk tersebut
- Dioptimalisasikan untuk SEO Google tanpa terlihat seperti artikel yang dibuat untuk mesin pencari
- Terdengar natural, kasual, dan seperti pengalaman pribadi nyata

Gaya penulisan:
- Gunakan bahasa Indonesia yang umum digunakan sehari-hari
- Hindari bahasa yang terlalu formal, kaku, atau terdengar seperti AI
- Sesekali gunakan opini pribadi dan observasi yang masuk akal berdasarkan tipe produk dan poin yang saya berikan
- Variasikan panjang kalimat agar lebih natural
- Jangan menggunakan kalimat klise AI seperti: "Pada artikel ini kita akan membahas...", "Di era modern saat ini...", "Perlu diketahui bahwa...", "Menarik untuk dicatat...", "Sebagai kesimpulan..."
- Jangan berlebihan dalam memuji produk. Tetap objektif dan seimbang
- Jika ada kekurangan produk, bahas secara jujur

SEO:
- Tentukan keyword utama berdasarkan nama produk
- Judul H1 sudah ada di halaman (dari judul artikel), jadi JANGAN buat tag H1 di dalam konten
- Masukkan keyword utama secara alami pada: paragraf pembuka, minimal satu sub judul (H2), paragraf penutup
- Tambahkan keyword turunan dan sinonim yang relevan secara alami
- Buat artikel yang berpotensi menjawab intent pencarian pengguna
- Jangan melakukan keyword stuffing
- Tambahkan bagian FAQ di akhir agar artikel ini dapat ditemukan oleh Google AI Overview dengan subjudul tag H2
- Berikan ringkasan review di bagian awal dengan tag H2

Output harus berupa HTML yang valid. Jangan sertakan tag <html>, <head>, <body>, atau <h1>. Mulai langsung dari paragraf atau <h2>.`;

export async function POST(req: Request) {
  try {
    const { notes } = await req.json();

    if (!notes?.trim()) {
      return Response.json(
        { error: "Tidak ada konten untuk diproses" },
        { status: 400 }
      );
    }

    const stream = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Poin-poin review:\n\n${notes}` },
      ],
      stream: true,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            if (delta) {
              controller.enqueue(new TextEncoder().encode(delta));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("ai-write error:", error);
    return Response.json({ error: "Gagal menghubungi AI" }, { status: 500 });
  }
}
