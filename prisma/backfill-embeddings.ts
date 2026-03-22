import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateEmbedding } from "../src/lib/embeddings";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const all = await prisma.product.findMany({
    select: { id: true, name: true, description: true, embedding: true },
  });
  const products = all.filter((p) => !p.embedding || p.embedding.length === 0);

  console.log(`🔎 ${products.length} products without embeddings`);
  if (products.length === 0) return;

  let done = 0;
  for (const p of products) {
    const embedding = await generateEmbedding(p.name, p.description ?? "");
    await prisma.product.update({
      where: { id: p.id },
      data: { embedding },
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
