export const runtime = "nodejs";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Look at this product packaging image.

Return JSON with:
- name: Brand + Product Name + Variant
- description: a short 1–3 sentence product description in Indonesian.
${categoryNames.length > 0 ? `- categories: an array of 1–3 category names that best match this product, chosen ONLY from this list: [${categoryNames.map((n) => `"${n}"`).join(", ")}]. Return an empty array if none fit.` : ""}

Rules:
- Use the brand visible on the package
- Keep description under 350 characters
- Do not invent ingredients not visible on packaging
${categoryNames.length > 0 ? "- Only use category names exactly as written in the list above" : ""}

Example:
{
"name": "Indomie Mi Goreng Rendang",
"description": "Indomie Goreng Rendang adalah varian mi instan goreng premium yang menghadirkan cita rasa autentik bumbu rendang khas Padang dengan aroma rempah kuat dan gurih.",${categoryNames.length > 0 ? `\n"categories": ["Mie Instan"]` : ""}
}

Common Indonesian brands include:
Indomie, Mie Sedaap, ABC, Ultra Milk, Teh Botol Sosro, Pocari Sweat, Aqua, Le Minerale, Good Day, Kapal Api, Roma, SilverQueen, Tango, Chitato, Qtela, Terea, Lays, Pringles, Cheetos, Doritos, KitKat, Oreo, Lotte, Glico, Marimas, Energen, Bear Brand, Frisian Flag, Indomilk, Greenfields, Cimory.

If a brand from this list appears on the packaging, use it. If not, use the most visible brand on the packaging.

Return ONLY valid JSON. Do not include explanations or extra text.`,
            },
            {
              type: "input_image",
              image_url: `data:${file.type};base64,${base64}`,
              detail: "low",
            },
          ],
        },
      ],
    });

    const text = response.output_text?.trim() || "";

    let parsed: { name: string; description: string; categories?: string[] } = {
      name: "",
      description: "",
      categories: [],
    };

    try {
      const clean = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error("JSON parse failed:", text);
    }

    return Response.json({
      name: parsed.name,
      description: parsed.description,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Detection failed" }, { status: 500 });
  }
}