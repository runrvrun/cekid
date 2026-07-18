export const runtime = "nodejs";
import { detectProductFromImage } from "@/lib/productdetect";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const categoryNames = (formData.get("categoryNames") as string | null)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

    if (!file) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const detected = await detectProductFromImage(base64, file.type, categoryNames);

    return Response.json(detected);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Detection failed" }, { status: 500 });
  }
}