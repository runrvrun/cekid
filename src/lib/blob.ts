import { put } from "@vercel/blob";

export async function uploadImageToBlob(file: File, productName: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "_");
  const safeName = productName.replace(/\s+/g, "_");
  const fileName = `products/${timestamp}_${safeName}.jpg`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await put(fileName, buffer, {
    contentType: file.type || "image/jpeg",
    access: "public",
  });
  return uploaded.url;
}
