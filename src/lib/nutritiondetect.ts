import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export type DetectedNutritionExtra = {
  label: string;
  value: number | string;
  unit?: string;
};

const EXCLUDED_OTHER_LABEL_PATTERNS = [
  /energi/i,
  /kalori/i,
  /\bgula\b/i,
  /natrium/i,
  /lemak\s*jenuh/i,
];

/**
 * Deterministic backstop for the "other" array: strips anything that
 * duplicates a dedicated field (energy, sugar, sodium, saturated fat) and
 * dedupes repeated labels, regardless of whether the model followed the
 * prompt's instructions.
 */
function sanitizeOtherItems(items: DetectedNutritionExtra[]): DetectedNutritionExtra[] {
  const seen = new Set<string>();
  const result: DetectedNutritionExtra[] = [];

  for (const item of items) {
    const label = String(item?.label ?? "").trim();
    if (!label) continue;
    if (EXCLUDED_OTHER_LABEL_PATTERNS.some((pattern) => pattern.test(label))) continue;

    const key = label.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({ ...item, label });
  }

  return result;
}

export type DetectedNutrition = {
  servingSizeValue: number | null;
  servingSizeUnit: string | null;
  caloriesPerServing: number | null;
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
- caloriesPerServing: energy/calories ("Energi" / "Energi Total") per serving in kcal, or null
- sugarPerServing: grams of sugar ("Gula") per serving, or null
- sodiumPerServing: milligrams of sodium ("Natrium") per serving, or null
- saturatedFatPerServing: grams of saturated fat ("Lemak Jenuh") per serving, or null
- sugarPer100 / sodiumPer100 / saturatedFatPer100: the same three nutrients but read from the "per 100 g" or "per 100 ml" reference column, if the label prints one (many Indonesian BPOM labels show both a per-serving and a per-100 column) — null if there is no such column
- other: an array of { "label": string, "value": number | string, "unit": string } for any OTHER nutrient printed on the label that is not one of the five above (e.g. Protein, Lemak Total, Karbohidrat Total, Serat Pangan, Kolesterol, Vitamin A, Vitamin C, Kalsium, Zat Besi, Kalium)

Rules for "other" — read carefully, these mistakes have happened before:
1. NEVER include anything related to energy/calories ("Energi", "Energi Total", "Kalori", kkal) — that value belongs ONLY in caloriesPerServing, never repeated in "other".
2. NEVER include Gula, Natrium, or Lemak Jenuh in "other" — those three already have their own dedicated fields above. Repeating them in "other" is a duplicate and wrong.
3. Each distinct nutrient must appear EXACTLY ONCE in "other". If a nutrient is printed in both a "per saji" and a "per 100 g" column, report it only once (use the per-serving value) — do not create two separate entries for it.
4. Copy each label EXACTLY as printed on the packaging, character-for-character — do not paraphrase, abbreviate, or guess at spelling. If you cannot read a label clearly enough to copy it exactly, omit that item entirely rather than guessing.
5. Before finalizing, re-check your own "other" array for duplicate or near-duplicate labels (e.g. two entries that are really the same nutrient with slightly different wording) and merge/remove them.

Other rules:
- Only report values actually printed/visible in the image — never estimate or invent numbers
- Sodium/natrium must be in milligrams (mg); convert from grams if that's how it's printed
- Sugar, saturated fat, and calories must be in grams / kcal respectively
- Return null for any field that isn't present on the label

Example:
{
"servingSize": { "value": 30, "unit": "g" },
"caloriesPerServing": 150,
"sugarPerServing": 5,
"sodiumPerServing": 120,
"saturatedFatPerServing": 1.5,
"sugarPer100": 16.7,
"sodiumPer100": 400,
"saturatedFatPer100": 5,
"other": [{ "label": "Protein", "value": 2, "unit": "g" }, { "label": "Karbohidrat Total", "value": 20, "unit": "g" }]
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
    caloriesPerServing?: number | null;
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
    caloriesPerServing: parsed.caloriesPerServing ?? null,
    sugarPerServing: parsed.sugarPerServing ?? null,
    sodiumPerServing: parsed.sodiumPerServing ?? null,
    saturatedFatPerServing: parsed.saturatedFatPerServing ?? null,
    sugarPer100: parsed.sugarPer100 ?? null,
    sodiumPer100: parsed.sodiumPer100 ?? null,
    saturatedFatPer100: parsed.saturatedFatPer100 ?? null,
    other: Array.isArray(parsed.other) ? sanitizeOtherItems(parsed.other) : [],
  };
}
