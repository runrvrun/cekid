export type NutritionExtraItem = {
  label: string;
  value: number | string;
  unit?: string;
};

export type NutritionFormInput = {
  servingSizeValue: number | null;
  servingSizeUnit: string | null;
  sugarPerServing: number | null;
  sodiumPerServing: number | null;
  saturatedFatPerServing: number | null;
  sugarPer100: number | null;
  sodiumPer100: number | null;
  saturatedFatPer100: number | null;
  extra: NutritionExtraItem[];
};

function parseFloatOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(v as string);
  return Number.isFinite(n) ? n : null;
}

export function parseNutritionFormData(formData: FormData): NutritionFormInput {
  let extra: NutritionExtraItem[] = [];
  const extraRaw = formData.get("nutritionExtra") as string | null;
  if (extraRaw) {
    try {
      const parsed = JSON.parse(extraRaw);
      if (Array.isArray(parsed)) extra = parsed;
    } catch {
      // ignore malformed extra payload
    }
  }

  return {
    servingSizeValue: parseFloatOrNull(formData.get("nutritionServingSizeValue")),
    servingSizeUnit: (formData.get("nutritionServingSizeUnit") as string) || null,
    sugarPerServing: parseFloatOrNull(formData.get("nutritionSugarPerServing")),
    sodiumPerServing: parseFloatOrNull(formData.get("nutritionSodiumPerServing")),
    saturatedFatPerServing: parseFloatOrNull(formData.get("nutritionSaturatedFatPerServing")),
    sugarPer100: parseFloatOrNull(formData.get("nutritionSugarPer100")),
    sodiumPer100: parseFloatOrNull(formData.get("nutritionSodiumPer100")),
    saturatedFatPer100: parseFloatOrNull(formData.get("nutritionSaturatedFatPer100")),
    extra,
  };
}

export function hasNutritionData(input: NutritionFormInput): boolean {
  return (
    input.servingSizeValue != null ||
    input.sugarPerServing != null ||
    input.sodiumPerServing != null ||
    input.saturatedFatPerServing != null ||
    input.sugarPer100 != null ||
    input.sodiumPer100 != null ||
    input.saturatedFatPer100 != null ||
    input.extra.length > 0
  );
}
