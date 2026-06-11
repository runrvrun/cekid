import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const BASE_URL = "https://enakga.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, ulasanList] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      select: { slug: true, createdAt: true },
    }),
    prisma.ulasan.findMany({
      where: { status: "PUBLISHED" },
      select: { permalink: true, updatedAt: true },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" },
    { url: `${BASE_URL}/about`, priority: 0.4, changeFrequency: "monthly" },
    { url: `${BASE_URL}/feedback`, priority: 0.3, changeFrequency: "monthly" },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/${p.slug}`,
    lastModified: p.createdAt ?? undefined,
    priority: 0.8,
    changeFrequency: "weekly",
  }));

  const ulasanPages: MetadataRoute.Sitemap = ulasanList.map((u) => ({
    url: `${BASE_URL}/r/${u.permalink}`,
    lastModified: u.updatedAt,
    priority: 0.9,
    changeFrequency: "monthly",
  }));

  return [...staticPages, ...ulasanPages, ...productPages];
}
