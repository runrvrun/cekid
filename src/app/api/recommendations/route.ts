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
      select: {
        id: true,
        name: true,
        rating: true,
        embedding: true,
        productImages: {
          where: { isMain: true },
          select: { url: true },
          take: 1,
        },
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
          id: Number(p.id),
          name: p.name,
          image: p.productImages[0]?.url ?? null,
          rating: p.rating ? Number(p.rating) : null,
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
