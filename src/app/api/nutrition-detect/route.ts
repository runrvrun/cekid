export const runtime = "nodejs";
import { detectNutritionFromImage } from "@/lib/nutritiondetect";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const detected = await detectNutritionFromImage(base64, file.type);

    return Response.json(detected);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Detection failed" }, { status: 500 });
  }
}
