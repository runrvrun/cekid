import { notFound } from "next/navigation";
import ProductDetail from "@/components/productdetail";
import { getProductBySlug } from "@/lib/prisma/products";
import { Metadata } from "next";

const RESERVED = new Set([
  "product",
  "signin",
  "signup",
  "about",
  "feedback",
]);

function safeSlug(slug: string) {
  try {
    return decodeURIComponent(slug).toLowerCase();
  } catch {
    return slug.toLowerCase();
  }
}

/* ---------- Metadata ---------- */
export const generateMetadata = async ({ params }:  { params: { slug: string } }): Promise<Metadata> => {
  const slug = safeSlug((await params).slug);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return {
    title: `Review ${product.name}`,
  };
};

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  const slug = safeSlug((await params).slug);
 
if (RESERVED.has(slug)) {
    notFound();
  }

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}