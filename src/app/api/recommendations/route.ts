import prisma from "@/lib/prisma";
import { cosineSimilarity } from "@/lib/similarity";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = Number(searchParams.get("productId"));

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        { error: "Invalid productId" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (
      !product ||
      !Array.isArray(product.embedding) ||
      product.embedding.length === 0
    ) {
      return NextResponse.json([]);
    }

    // ❌ DO NOT use `isEmpty` on Float[]
    const candidates = await prisma.product.findMany({
      where: {
        id: { not: productId },
      },
      take: 100,
    });

    const scored = candidates
      .filter(
        (p) =>
          Array.isArray(p.embedding) &&
          p.embedding.length === product.embedding.length
      )
      .map((p) => {
        const score = cosineSimilarity(product.embedding!, p.embedding);

        return {
          id: Number(p.id), // ✅ BigInt → number
          name: p.name,
          image: p.image,
          rating: p.rating ? Number(p.rating) : null, // ✅ Decimal → number
          score,
        };
      })
      .filter((p) => !Number.isNaN(p.score));

    const top = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return NextResponse.json(top);
  } catch (error) {
    console.error("Recommendation API failed:", error);
    return NextResponse.json([], { status: 500 });
  }
}
