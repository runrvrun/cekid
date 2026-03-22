import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateEmbedding } from "../src/lib/embeddings";
import OpenAI from "openai";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateDescription(
  name: string,
  categories: string[]
): Promise<string> {
  const categoryHint =
    categories.length > 0 ? ` Kategori produk: ${categories.join(", ")}.` : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "user",
        content: `Tulis deskripsi singkat 1–3 kalimat dalam bahasa Indonesia untuk produk minimarket berikut: "${name}".${categoryHint}

Aturan:
- Maksimal 350 karakter
- Jelaskan produk secara informatif dan menarik
- Jangan mengarang informasi yang tidak diketahui
- Gunakan gaya bahasa yang natural

Balas HANYA dengan teks deskripsi, tanpa penjelasan atau format tambahan.`,
      },
    ],
    max_tokens: 200,
    temperature: 0.5,
  });

  return response.choices[0].message.content?.trim() ?? "";
}

async function main() {
  const products = await prisma.product.findMany({
    where: { description: null },
    select: {
      id: true,
      name: true,
      productCategory: {
        select: { category: { select: { name: true } } },
      },
    },
  });

  console.log(`🔎 ${products.length} products without descriptions`);
  if (products.length === 0) return;

  let done = 0;
  for (const p of products) {
    const categoryNames = p.productCategory.map((pc) => pc.category.name);
    const description = await generateDescription(p.name, categoryNames);

    if (!description) {
      console.warn(`  ⚠ Skipping ${p.name} — empty description returned`);
      continue;
    }

    const embedding = await generateEmbedding(p.name, description);

    await prisma.product.update({
      where: { id: p.id },
      data: { description, embedding },
    });

    done++;
    if (done % 10 === 0 || done === products.length) {
      console.log(`   ${done}/${products.length} done`);
    }
  }

  console.log("✓ Backfill complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
