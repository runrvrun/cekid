import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export type DetectedProduct = {
  name: string;
  description: string;
  categories: string[];
};

export async function detectProductFromImage(
  base64: string,
  mimeType: string,
  categoryNames: string[] = []
): Promise<DetectedProduct> {
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
            image_url: `data:${mimeType};base64,${base64}`,
            detail: "low",
          },
        ],
      },
    ],
  });

  const text = response.output_text?.trim() || "";

  let parsed: { name?: string; description?: string; categories?: string[] } = {};
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(clean);
  } catch (e) {
    console.error("JSON parse failed:", text);
  }

  return {
    name: parsed.name ?? "",
    description: parsed.description ?? "",
    categories: Array.isArray(parsed.categories) ? parsed.categories : [],
  };
}
