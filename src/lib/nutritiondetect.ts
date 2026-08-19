import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export type DetectedNutritionExtra = {
  label: string;
  value: number | string;
  unit?: string;
};

export type DetectedNutrition = {
  servingSizeValue: number | null;
  servingSizeUnit: string | null;
  sugarPerServing: number | null;
  sodiumPerServing: number | null;
  saturatedFatPerServing: number | null;
  sugarPer100: number | null;
  sodiumPer100: number | null;
  saturatedFatPer100: number | null;
  other: DetectedNutritionExtra[];
};

export async function detectNutritionFromImage(
  base64: string,
  mimeType: string
): Promise<DetectedNutrition> {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Look at this nutrition facts label (informasi nilai gizi) from an Indonesian packaged food or drink.

Return JSON with:
- servingSize: { "value": number, "unit": string } from "Takaran saji" / "Sajian per kemasan", or null if not visible
- sugarPerServing: grams of sugar ("Gula") per serving, or null
- sodiumPerServing: milligrams of sodium ("Natrium") per serving, or null
- saturatedFatPerServing: grams of saturated fat ("Lemak Jenuh") per serving, or null
- sugarPer100 / sodiumPer100 / saturatedFatPer100: the same three nutrients but read from the "per 100 g" or "per 100 ml" reference column, if the label prints one (many Indonesian BPOM labels show both a per-serving and a per-100 column) — null if there is no such column
- other: an array of { "label": string, "value": number | string, "unit": string } for any other nutrition facts visible (e.g. energy/energi, protein, total fat/lemak total, carbohydrate/karbohidrat, fiber/serat), using the label text as printed in Indonesian

Rules:
- Only report values actually printed/visible in the image — never estimate or invent numbers
- Sodium/natrium must be in milligrams (mg); convert from grams if that's how it's printed
- Sugar and saturated fat must be in grams
- Return null for any field that isn't present on the label

Example:
{
"servingSize": { "value": 30, "unit": "g" },
"sugarPerServing": 5,
"sodiumPerServing": 120,
"saturatedFatPerServing": 1.5,
"sugarPer100": 16.7,
"sodiumPer100": 400,
"saturatedFatPer100": 5,
"other": [{ "label": "Energi", "value": 150, "unit": "kkal" }]
}

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

  let parsed: {
    servingSize?: { value?: number; unit?: string } | null;
    sugarPerServing?: number | null;
    sodiumPerServing?: number | null;
    saturatedFatPerServing?: number | null;
    sugarPer100?: number | null;
    sodiumPer100?: number | null;
    saturatedFatPer100?: number | null;
    other?: DetectedNutritionExtra[];
  } = {};

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(clean);
  } catch (e) {
    console.error("JSON parse failed:", text);
  }

  return {
    servingSizeValue: parsed.servingSize?.value ?? null,
    servingSizeUnit: parsed.servingSize?.unit ?? null,
    sugarPerServing: parsed.sugarPerServing ?? null,
    sodiumPerServing: parsed.sodiumPerServing ?? null,
    saturatedFatPerServing: parsed.saturatedFatPerServing ?? null,
    sugarPer100: parsed.sugarPer100 ?? null,
    sodiumPer100: parsed.sodiumPer100 ?? null,
    saturatedFatPer100: parsed.saturatedFatPer100 ?? null,
    other: Array.isArray(parsed.other) ? parsed.other : [],
  };
}
