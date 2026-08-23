import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import OpenAI from "openai";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const BATCH_SIZE = 20;

type CategoryInfo = { id: bigint; name: string; path: string };

async function loadCategories(): Promise<CategoryInfo[]> {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      parent: { select: { name: true, parent: { select: { name: true } } } },
    },
  });
  return categories.map((c) => {
    const path = [c.parent?.parent?.name, c.parent?.name, c.name]
      .filter((n): n is string => Boolean(n))
      .join(" > ");
    return { id: c.id, name: c.name, path };
  });
}

async function classifyBatch(
  products: { id: bigint; name: string; description: string | null }[],
  categories: CategoryInfo[]
): Promise<Map<bigint, string>> {
  const categoryList = categories.map((c) => c.path).join("\n");
  const productList = products
    .map((p, i) => `${i + 1}. ${p.name}${p.description ? ` — ${p.description}` : ""}`)
    .join("\n");

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `You are classifying Indonesian minimarket/convenience-store products into a category taxonomy.

Category list (format: "TopLevel > Mid > Leaf", fewer segments if the category has fewer levels):
${categoryList}

Products to classify:
${productList}

For each product, pick the ONE most specific and accurate category from the list above — always prefer the deepest/most specific level that fits; only use a broader level if nothing specific enough exists. Return the category name EXACTLY as it appears as the LAST segment in the list (not the full path).

Return ONLY valid JSON: an array of exactly ${products.length} objects in the same order as the products list, each shaped { "category": "exact category name or null" }.`,
          },
        ],
      },
    ],
  });

  const text = response.output_text?.trim() ?? "";
  const clean = text.replace(/```json|```/g, "").trim();
  let parsed: { category: string | null }[] = [];
  try {
    parsed = JSON.parse(clean);
  } catch {
    console.error("Failed to parse batch response:", text);
    return new Map();
  }

  const validNames = new Set(categories.map((c) => c.name.toLowerCase()));
  const result = new Map<bigint, string>();
  products.forEach((p, i) => {
    const suggested = parsed[i]?.category;
    if (suggested && validNames.has(suggested.toLowerCase())) {
      result.set(p.id, suggested);
    }
  });
  return result;
}

async function main() {
  const categories = await loadCategories();
  console.log(`Loaded ${categories.length} categories`);

  const products = await prisma.product.findMany({
    where: { deletedAt: null, productCategory: { none: {} } },
    select: { id: true, name: true, description: true },
  });
  console.log(`Found ${products.length} uncategorized products`);

  const nameToId = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  let tagged = 0;
  let skipped = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(products.length / BATCH_SIZE)} (${batch.length} products)...`);
    const assignments = await classifyBatch(batch, categories);

    for (const p of batch) {
      const suggested = assignments.get(p.id);
      const categoryId = suggested ? nameToId.get(suggested.toLowerCase()) : undefined;
      if (!categoryId) {
        console.log(`  skip: ${p.name} (no confident match)`);
        skipped++;
        continue;
      }
      await prisma.productCategory.create({ data: { productId: p.id, categoryId } });
      tagged++;
    }
  }

  console.log(`Done. Tagged: ${tagged}, skipped: ${skipped}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
