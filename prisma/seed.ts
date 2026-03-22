import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateEmbedding } from "../src/lib/embeddings";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Categories ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Mie Instan",
  "Minuman Air & Isotonik",
  "Minuman Teh & Jus RTD",
  "Minuman Kopi RTD",
  "Minuman Susu RTD",
  "Minuman Bersoda",
  "Kopi & Teh Sachet",
  "Susu & Produk Susu",
  "Snack Keripik",
  "Snack Puff & Balls",
  "Wafer & Biskuit",
  "Cokelat & Permen",
  "Makanan Kaleng",
  "Bumbu & Saus",
  "Minyak Goreng",
  "Es Krim",
  "Roti & Bakeri",
  "Perawatan Diri",
];

// ─── Products ──────────────────────────────────────────────────────────────────
// upc: EAN-13 where known with confidence, null otherwise

const PRODUCTS: {
  name: string;
  upc: string | null;
  categories: string[];
}[] = [
  // ── Mie Instan ──────────────────────────────────────────────────────────────
  { name: "Indomie Goreng Original", upc: "089686010947", categories: ["Mie Instan"] },
  { name: "Indomie Goreng Rendang", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Goreng Pedas", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Goreng Cabe Ijo", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Goreng Aceh", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Goreng Rasa Ayam Geprek", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Rasa Ayam Bawang", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Rasa Soto Ayam", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Rasa Kaldu Ayam", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Rasa Kari Ayam", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Rasa Sate", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Rasa Baso Sapi", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Rasa Empal Gentong", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Kuah Rasa Gulai Ayam", upc: null, categories: ["Mie Instan"] },
  { name: "Indomie Rasa Tom Yam", upc: null, categories: ["Mie Instan"] },
  { name: "Mie Sedaap Goreng Original", upc: null, categories: ["Mie Instan"] },
  { name: "Mie Sedaap Goreng Korean Spicy Chicken", upc: null, categories: ["Mie Instan"] },
  { name: "Mie Sedaap Goreng Sambal Matah", upc: null, categories: ["Mie Instan"] },
  { name: "Mie Sedaap Rasa Ayam Bawang", upc: null, categories: ["Mie Instan"] },
  { name: "Mie Sedaap Rasa Soto", upc: null, categories: ["Mie Instan"] },
  { name: "Mie Sedaap Rasa Kari Ayam Spesial", upc: null, categories: ["Mie Instan"] },
  { name: "Mie Sedaap White Curry", upc: null, categories: ["Mie Instan"] },
  { name: "Mie Sedaap Goreng Rasa Ayam Pedas", upc: null, categories: ["Mie Instan"] },
  { name: "Sarimi Isi 2 Goreng Rasa Ayam", upc: null, categories: ["Mie Instan"] },
  { name: "Sarimi Isi 2 Rasa Soto Ayam", upc: null, categories: ["Mie Instan"] },
  { name: "Sarimi Rasa Ayam Bawang", upc: null, categories: ["Mie Instan"] },
  { name: "Sarimi Rasa Soto Banjar Limau Kuit", upc: null, categories: ["Mie Instan"] },
  { name: "Supermi Goreng Original", upc: null, categories: ["Mie Instan"] },
  { name: "Supermi Rasa Ayam Bawang", upc: null, categories: ["Mie Instan"] },
  { name: "Supermi Rasa Soto Seger", upc: null, categories: ["Mie Instan"] },
  { name: "Pop Mie Goreng Rasa Ayam Pedas", upc: null, categories: ["Mie Instan"] },
  { name: "Pop Mie Kuah Rasa Ayam", upc: null, categories: ["Mie Instan"] },
  { name: "Pop Mie Rasa Baso Sapi", upc: null, categories: ["Mie Instan"] },
  { name: "Mi ABC Goreng Rasa Ayam", upc: null, categories: ["Mie Instan"] },
  { name: "Mi ABC Rasa Soto Ayam", upc: null, categories: ["Mie Instan"] },

  // ── Air & Isotonik ───────────────────────────────────────────────────────────
  { name: "AQUA Air Mineral 600ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "AQUA Air Mineral 1500ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "AQUA Air Mineral 330ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Le Minerale 600ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Le Minerale 1500ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Club Air Mineral 600ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "VIT Air Mineral 600ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Cleo Air Murni 500ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Pocari Sweat 500ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Pocari Sweat 330ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Pocari Sweat Ion Water 400ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Mizone Passion Fruit 500ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Mizone Orange Lime 500ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Mizone Apple Guava 500ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Powerade Ion4 Mountain Blast", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Gatorade Fruit Punch", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Hydro Coco 330ml", upc: null, categories: ["Minuman Air & Isotonik"] },
  { name: "Hydro Coco 250ml", upc: null, categories: ["Minuman Air & Isotonik"] },

  // ── Minuman Teh & Jus RTD ────────────────────────────────────────────────────
  { name: "Teh Botol Sosro 450ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Teh Botol Sosro 350ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Teh Botol Sosro Less Sugar 450ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Fruit Tea Apple 350ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Fruit Tea Strawberry 350ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Fruit Tea Jambu 350ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Teh Pucuk Harum 350ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Teh Pucuk Harum 600ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Teh Pucuk Jasmine 500ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Frestea Original 500ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Frestea Green Honey 500ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Ichi Ocha 500ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Nu Green Tea Original 330ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Minute Maid Pulpy Orange 350ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Minute Maid Pulpy Tropical 350ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Floridina Orange 350ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Floridina Guava 350ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Buavita Mango 250ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Buavita Guava 250ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Buavita Orange 250ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "ABC Sari Kacang Hijau 250ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "ABC Sari Kedelai 250ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Ale-Ale Lychee 330ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Ale-Ale Strawberry 330ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Okky Jelly Drink Leci 200ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },
  { name: "Okky Jelly Drink Apel 200ml", upc: null, categories: ["Minuman Teh & Jus RTD"] },

  // ── Minuman Kopi RTD ─────────────────────────────────────────────────────────
  { name: "Good Day Mocachino 250ml", upc: null, categories: ["Minuman Kopi RTD"] },
  { name: "Good Day Cappuccino 250ml", upc: null, categories: ["Minuman Kopi RTD"] },
  { name: "Good Day Freeze 250ml", upc: null, categories: ["Minuman Kopi RTD"] },
  { name: "Nescafe Ready To Drink Original 240ml", upc: null, categories: ["Minuman Kopi RTD"] },
  { name: "Nescafe Latte 220ml", upc: null, categories: ["Minuman Kopi RTD"] },
  { name: "Kopi Luwak White Koffie Original RTD", upc: null, categories: ["Minuman Kopi RTD"] },
  { name: "Kopi ABC Susu RTD 200ml", upc: null, categories: ["Minuman Kopi RTD"] },
  { name: "Caffe Latte ABC 250ml", upc: null, categories: ["Minuman Kopi RTD"] },
  { name: "Golda Coffee Milk 200ml", upc: null, categories: ["Minuman Kopi RTD"] },
  { name: "Indocafe Coffeemix RTD 200ml", upc: null, categories: ["Minuman Kopi RTD"] },
  { name: "Kopiko 78°C Coffee Drink 240ml", upc: null, categories: ["Minuman Kopi RTD"] },

  // ── Minuman Susu RTD ─────────────────────────────────────────────────────────
  { name: "Ultra Milk Full Cream 250ml", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Ultra Milk Cokelat 250ml", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Ultra Milk Low Fat Strawberry 250ml", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Ultra Milk UHT 1L Full Cream", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Indomilk UHT Full Cream 250ml", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Indomilk UHT Cokelat 250ml", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Bear Brand Susu Steril 140ml", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Milo 250ml RTD", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Yakult Original 65ml", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Cimory Yogurt Drink Strawberry 250ml", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Cimory Yogurt Drink Blueberry 250ml", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Cimory Squeeze Yogurt Mango", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Frisian Flag Full Cream UHT 250ml", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Frisian Flag Cokelat UHT 225ml", upc: null, categories: ["Minuman Susu RTD"] },
  { name: "Greenfields UHT Full Cream 250ml", upc: null, categories: ["Minuman Susu RTD"] },

  // ── Minuman Bersoda ──────────────────────────────────────────────────────────
  { name: "Coca-Cola 390ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "Coca-Cola 1500ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "Sprite 390ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "Sprite 1500ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "Fanta Orange 390ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "Fanta Strawberry 390ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "Pepsi Cola 390ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "7UP 390ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "Big Cola 1500ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "Green Sands Guava 330ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "Green Sands Orange 330ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "Mountea Anggur 200ml", upc: null, categories: ["Minuman Bersoda"] },
  { name: "Mountea Jeruk 200ml", upc: null, categories: ["Minuman Bersoda"] },

  // ── Kopi & Teh Sachet ────────────────────────────────────────────────────────
  { name: "Nescafe Classic 2g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Nescafe 3in1 Original 20g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Nescafe Kopi Susu 20g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Good Day Mocachino Sachet 20g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Good Day Cappuccino Sachet 20g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Kapal Api Special Hitam 6.5g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Kapal Api 3in1 20g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Torabika Kopi Susu 25g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Torabika Cappuccino 25g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Indocafe Coffeemix 20g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Luwak White Koffie Original 20g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Luwak White Koffie Cappuccino 20g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "ABC Kopi Susu 20g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "ABC Kopi Hitam 20g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Teh Celup Sariwangi 25-pack", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Teh Celup Sosro 25-pack", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Teh Celup Tong Tji 25-pack", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Teh Poci 40-pack", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Jahe Wangi Sachet 25g", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Marimas Rasa Jeruk Sachet", upc: null, categories: ["Kopi & Teh Sachet"] },
  { name: "Pop Ice Cokelat Sachet", upc: null, categories: ["Kopi & Teh Sachet"] },

  // ── Susu & Produk Susu ───────────────────────────────────────────────────────
  { name: "Dancow Full Cream 400g", upc: null, categories: ["Susu & Produk Susu"] },
  { name: "Dancow Instant Cokelat 400g", upc: null, categories: ["Susu & Produk Susu"] },
  { name: "Milo Powder 500g", upc: null, categories: ["Susu & Produk Susu"] },
  { name: "Milo Powder 200g", upc: null, categories: ["Susu & Produk Susu"] },
  { name: "Ovomaltine Powder 400g", upc: null, categories: ["Susu & Produk Susu"] },
  { name: "Indomilk Susu Kental Manis Putih 370g", upc: null, categories: ["Susu & Produk Susu"] },
  { name: "Indomilk Susu Kental Manis Cokelat 370g", upc: null, categories: ["Susu & Produk Susu"] },
  { name: "Cap Bendera Susu Kental Manis 385g", upc: null, categories: ["Susu & Produk Susu"] },
  { name: "Frisian Flag Susu Kental Manis 385g", upc: null, categories: ["Susu & Produk Susu"] },

  // ── Snack Keripik ────────────────────────────────────────────────────────────
  { name: "Chitato Original 68g", upc: null, categories: ["Snack Keripik"] },
  { name: "Chitato Beef Barbeque 68g", upc: null, categories: ["Snack Keripik"] },
  { name: "Chitato Grilled Meat 68g", upc: null, categories: ["Snack Keripik"] },
  { name: "Chitato Sapi Panggang 40g", upc: null, categories: ["Snack Keripik"] },
  { name: "Lays Original 48g", upc: null, categories: ["Snack Keripik"] },
  { name: "Lays Sour Cream & Onion 48g", upc: null, categories: ["Snack Keripik"] },
  { name: "Lays Nori Seaweed 48g", upc: null, categories: ["Snack Keripik"] },
  { name: "Piattos Original 68g", upc: null, categories: ["Snack Keripik"] },
  { name: "Piattos Sour Cream 68g", upc: null, categories: ["Snack Keripik"] },
  { name: "Taro Net BBQ 65g", upc: null, categories: ["Snack Keripik"] },
  { name: "Taro Net Original 65g", upc: null, categories: ["Snack Keripik"] },
  { name: "Qtela Singkong Original 68g", upc: null, categories: ["Snack Keripik"] },
  { name: "Qtela Singkong Cokelat 68g", upc: null, categories: ["Snack Keripik"] },
  { name: "Qtela Tempe Manis 68g", upc: null, categories: ["Snack Keripik"] },
  { name: "Cheetos Crunchy Original 45g", upc: null, categories: ["Snack Keripik"] },
  { name: "Cheetos Twisted Flamin Hot 45g", upc: null, categories: ["Snack Keripik"] },
  { name: "Doritos Nacho Cheese 55g", upc: null, categories: ["Snack Keripik"] },
  { name: "Kripik Kentang Pringles Original 107g", upc: null, categories: ["Snack Keripik"] },
  { name: "Kripik Kentang Pringles Sour Cream 107g", upc: null, categories: ["Snack Keripik"] },

  // ── Snack Puff & Balls ───────────────────────────────────────────────────────
  { name: "Cheetos Balls 55g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Chiki Balls Keju 55g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Chiki Balls Original 55g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Richeese Ahh! 50g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Richeese Nabati Keju 26g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Momogi Stick Cokelat", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Momogi Stick Keju", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Soba Mi Goreng Snack 35g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Ring Singkong Pedas Rasa Barbeque 50g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Kacang Garuda Salted 100g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Kacang Garuda Pedas 100g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Kacang Disco 100g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Snickers Bar 50g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Beng-Beng Share It! 58g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Beng-Beng Maxx 38g", upc: null, categories: ["Snack Puff & Balls"] },
  { name: "Happy Tos Tortilla Original 40g", upc: null, categories: ["Snack Puff & Balls"] },

  // ── Wafer & Biskuit ──────────────────────────────────────────────────────────
  { name: "Oreo Original 119.6g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Oreo Strawberry 119.6g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Oreo Thins Cokelat 95g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Mini Oreo Cokelat 20g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Wafer Tango Chocolate 41.5g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Wafer Tango Strawberry 41.5g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Wafer Tango Vanilla 41.5g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Superstar Wafer Cokelat 22g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Khong Guan Red Tin 1600g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Roma Sari Gandum 115g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Roma Kelapa 112g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Monde Butter Cookies 90g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Biskuat Energi 120g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Nissin Crackers Original 135g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Malkist Crackers Original 135g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Malkist Coklat 130g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Better Crackers 100g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Ritz Crackers Original 148g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Briko 3-in-1 Wafer 60g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Pillow Isi Cokelat 40g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Pillow Isi Stroberi 40g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Komo Sandwich Cream Vanilla 66g", upc: null, categories: ["Wafer & Biskuit"] },
  { name: "Garudafood Gery Chocolatos 24g", upc: null, categories: ["Wafer & Biskuit"] },

  // ── Cokelat & Permen ─────────────────────────────────────────────────────────
  { name: "Silver Queen Milk Chocolate 62g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Silver Queen Hazelnut 62g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Silver Queen Cashew 62g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Cadbury Dairy Milk 90g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Cadbury Dairy Milk Oreo 90g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Kit Kat 4-Finger Milk Chocolate 41.5g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Kit Kat Matcha 41.5g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Toblerone Milk Chocolate 100g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Kinder Joy 20g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "M&M's Milk Chocolate 80g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "M&M's Peanut 80g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Mars Bar 51g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Twix Twin 50g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Kopiko Coffee Candy 150g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Kopiko Brown Coffee Candy 150g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Mentos Mint Roll 38g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Mentos Fruit Roll 38g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Relaxa Mint 115g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Relaxa Tropical 115g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Kis-Kis Mint Candy 100g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Polo Peppermint 34g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Sugus Asam 100g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Alpenliebe Strawberry 115g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Golia Mint 100g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Hexos Citrus 20g", upc: null, categories: ["Cokelat & Permen"] },
  { name: "Fisherman's Friend Original 25g", upc: null, categories: ["Cokelat & Permen"] },

  // ── Makanan Kaleng ───────────────────────────────────────────────────────────
  { name: "ABC Sardines Saus Tomat 155g", upc: null, categories: ["Makanan Kaleng"] },
  { name: "ABC Sardines Saus Cabai 155g", upc: null, categories: ["Makanan Kaleng"] },
  { name: "Maya Sardines Saus Tomat 425g", upc: null, categories: ["Makanan Kaleng"] },
  { name: "Ayam Brand Sardines 155g", upc: null, categories: ["Makanan Kaleng"] },
  { name: "Botan Canned Corned Beef 198g", upc: null, categories: ["Makanan Kaleng"] },
  { name: "Kornet Daging Sapi Pronas 198g", upc: null, categories: ["Makanan Kaleng"] },
  { name: "Hereford Corned Beef 340g", upc: null, categories: ["Makanan Kaleng"] },
  { name: "Kobe Corned Beef 198g", upc: null, categories: ["Makanan Kaleng"] },
  { name: "Sarden So Good 425g", upc: null, categories: ["Makanan Kaleng"] },

  // ── Bumbu & Saus ─────────────────────────────────────────────────────────────
  { name: "Kecap Manis ABC Sedang 275ml", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Kecap Manis Bango 275ml", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Kecap Manis Indofood 135ml", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Saus Tomat ABC 135ml", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Saus Sambal ABC 135ml", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Saus Sambal Indofood 135ml", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Saus Tiram Saori 130ml", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Royco Kaldu Ayam 10g", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Royco Kaldu Sapi 10g", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Masako Ayam 10g", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Masako Sapi 10g", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Penyedap Rasa Ajinomoto 100g", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Sasa Penyedap Rasa 250g", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Cabe Bubuk ABC 32g", upc: null, categories: ["Bumbu & Saus"] },
  { name: "Abon Sapi Finna 50g", upc: null, categories: ["Bumbu & Saus"] },

  // ── Minyak Goreng ────────────────────────────────────────────────────────────
  { name: "Bimoli Minyak Goreng 1L", upc: null, categories: ["Minyak Goreng"] },
  { name: "Bimoli Minyak Goreng 2L", upc: null, categories: ["Minyak Goreng"] },
  { name: "Sania Minyak Goreng 1L", upc: null, categories: ["Minyak Goreng"] },
  { name: "Filma Minyak Goreng 1L", upc: null, categories: ["Minyak Goreng"] },
  { name: "Kunci Mas Minyak Goreng 1L", upc: null, categories: ["Minyak Goreng"] },
  { name: "Tropical Minyak Goreng 1L", upc: null, categories: ["Minyak Goreng"] },
  { name: "SunCo Minyak Goreng 1L", upc: null, categories: ["Minyak Goreng"] },

  // ── Es Krim ──────────────────────────────────────────────────────────────────
  { name: "Walls Magnum Classic 80ml", upc: null, categories: ["Es Krim"] },
  { name: "Walls Magnum Almond 80ml", upc: null, categories: ["Es Krim"] },
  { name: "Walls Paddle Pop Rainbow 65ml", upc: null, categories: ["Es Krim"] },
  { name: "Walls Paddle Pop Cokelat 65ml", upc: null, categories: ["Es Krim"] },
  { name: "Walls Cornetto Vanilla 120ml", upc: null, categories: ["Es Krim"] },
  { name: "Campina Viennetta Vanilla 750ml", upc: null, categories: ["Es Krim"] },
  { name: "Campina Ice Cream Cone Cokelat 155ml", upc: null, categories: ["Es Krim"] },
  { name: "AICE Melon Bar 65ml", upc: null, categories: ["Es Krim"] },
  { name: "AICE Milk Bar Vanilla 65ml", upc: null, categories: ["Es Krim"] },
  { name: "AICE Big Mochi Taro 100ml", upc: null, categories: ["Es Krim"] },

  // ── Roti & Bakeri ────────────────────────────────────────────────────────────
  { name: "Roti Tawar Sari Roti Jumbo 400g", upc: null, categories: ["Roti & Bakeri"] },
  { name: "Roti Tawar Sari Roti Original 350g", upc: null, categories: ["Roti & Bakeri"] },
  { name: "Roti Gandum Sari Roti 350g", upc: null, categories: ["Roti & Bakeri"] },
  { name: "Roti Kasur Isi Cokelat Sari Roti", upc: null, categories: ["Roti & Bakeri"] },
  { name: "Roti Tawar Breadtalk 350g", upc: null, categories: ["Roti & Bakeri"] },
  { name: "Selai Cokelat Meises Ceres 170g", upc: null, categories: ["Roti & Bakeri"] },
  { name: "Selai Kacang Skippy Creamy 340g", upc: null, categories: ["Roti & Bakeri"] },
  { name: "Nutella 200g", upc: null, categories: ["Roti & Bakeri"] },
  { name: "Margarin Blue Band 200g", upc: null, categories: ["Roti & Bakeri"] },

  // ── Perawatan Diri ───────────────────────────────────────────────────────────
  { name: "Pepsodent Pasta Gigi Herbal 190g", upc: null, categories: ["Perawatan Diri"] },
  { name: "Pepsodent Pasta Gigi Action 123 190g", upc: null, categories: ["Perawatan Diri"] },
  { name: "Ciptadent Pasta Gigi 190g", upc: null, categories: ["Perawatan Diri"] },
  { name: "Oral-B Pasta Gigi 150g", upc: null, categories: ["Perawatan Diri"] },
  { name: "Sensodyne Pasta Gigi 100g", upc: null, categories: ["Perawatan Diri"] },
  { name: "Lifebuoy Sabun Mandi Total 10 100ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Dove Body Wash Original 250ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Biore Body Foam White 200ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Sunsilk Shampoo Hitam Berkilau 170ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Pantene Shampoo Smooth & Sleek 170ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Clear Shampoo Men 170ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Rejoice 3in1 Shampoo 170ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Rexona Deodorant Roll-On Women 50ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Rexona Deodorant Roll-On Men 50ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Axe Body Spray Dark Temptation 150ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Gatsby Deodorant Spray 150ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Paseo Tisu Facial 180 lembar", upc: null, categories: ["Perawatan Diri"] },
  { name: "Tessa Tisu Facial 200 lembar", upc: null, categories: ["Perawatan Diri"] },
  { name: "Softex Pembalut 24cm 10-pack", upc: null, categories: ["Perawatan Diri"] },
  { name: "Charm Body Fit Pembalut 10-pack", upc: null, categories: ["Perawatan Diri"] },
  { name: "Laurier Active Day Pembalut 10-pack", upc: null, categories: ["Perawatan Diri"] },
  { name: "Carefree Pantyliner Cotton 20-pack", upc: null, categories: ["Perawatan Diri"] },
  { name: "Veet Krim Rambut Sensitive 100ml", upc: null, categories: ["Perawatan Diri"] },
  { name: "Hydrocortisone Cream 10g", upc: null, categories: ["Perawatan Diri"] },
  { name: "Betadine Antiseptic Solution 30ml", upc: null, categories: ["Perawatan Diri"] },
];

// ─── Seed ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding categories...");

  const categoryMap = new Map<string, bigint>();

  for (const name of CATEGORIES) {
    let cat = await prisma.category.findFirst({ where: { name } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name } });
    }
    categoryMap.set(name, cat.id);
  }

  console.log(`   ✓ ${CATEGORIES.length} categories ready`);
  console.log("🌱 Seeding products...");

  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    let slug = slugify(p.name);

    // Ensure slug uniqueness by checking and appending suffix if needed
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      // Already exists — skip to avoid duplicates on re-run
      skipped++;
      continue;
    }

    const embedding = await generateEmbedding(p.name, "");

    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        upc: p.upc ?? undefined,
        status: "ACTIVE",
        embedding,
        productCategory: {
          create: p.categories
            .map((c) => categoryMap.get(c))
            .filter((id): id is bigint => id !== undefined)
            .map((categoryId) => ({ categoryId })),
        },
      },
    });

    created++;
    if (created % 10 === 0) console.log(`   ... ${created} created`);
  }

  console.log(`   ✓ ${created} products created, ${skipped} skipped (already exist)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
