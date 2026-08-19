export type NutriLevel = "A" | "B" | "C" | "D";

const LEVEL_ORDER: NutriLevel[] = ["A", "B", "C", "D"];

function gradeSugar(gPer100: number): NutriLevel {
  if (gPer100 <= 1) return "A";
  if (gPer100 <= 5) return "B";
  if (gPer100 <= 10) return "C";
  return "D";
}

function gradeSaturatedFat(gPer100: number): NutriLevel {
  if (gPer100 <= 0.7) return "A";
  if (gPer100 <= 1.2) return "B";
  if (gPer100 <= 2.8) return "C";
  return "D";
}

function gradeSodium(mgPer100: number): NutriLevel {
  if (mgPer100 < 5) return "A";
  if (mgPer100 <= 120) return "B";
  if (mgPer100 <= 500) return "C";
  return "D";
}

function worstOf(levels: NutriLevel[]): NutriLevel {
  return levels.reduce((worst, level) =>
    LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(worst) ? level : worst
  );
}

export type NutritionInput = {
  servingSizeValue?: number | null;
  sugarPerServing?: number | null;
  sodiumPerServing?: number | null;
  saturatedFatPerServing?: number | null;
  sugarPer100?: number | null;
  sodiumPer100?: number | null;
  saturatedFatPer100?: number | null;
};

export type NormalizedPer100 = {
  sugarPer100: number | null;
  sodiumPer100: number | null;
  saturatedFatPer100: number | null;
};

/**
 * Prefers the label's own "per 100 g/100 mL" reference column when present
 * (mandatory on most Indonesian BPOM labels) over deriving it from serving
 * size — this also means grading can't be gamed by a brand declaring an
 * unusually small serving size.
 */
export function normalizeToPer100(input: NutritionInput): NormalizedPer100 {
  const factor =
    input.servingSizeValue && input.servingSizeValue > 0
      ? 100 / input.servingSizeValue
      : null;

  const derive = (perServing?: number | null) =>
    factor != null && perServing != null ? perServing * factor : null;

  return {
    sugarPer100: input.sugarPer100 ?? derive(input.sugarPerServing),
    sodiumPer100: input.sodiumPer100 ?? derive(input.sodiumPerServing),
    saturatedFatPer100: input.saturatedFatPer100 ?? derive(input.saturatedFatPerServing),
  };
}

/**
 * Overall grade = worst of the three individual grades. Returns null unless
 * all three nutrients can be resolved to a per-100 value — a partial grade
 * would be misleading.
 */
export function calculateNutriLevel(input: NutritionInput): NutriLevel | null {
  const { sugarPer100, sodiumPer100, saturatedFatPer100 } = normalizeToPer100(input);

  if (sugarPer100 == null || sodiumPer100 == null || saturatedFatPer100 == null) {
    return null;
  }

  return worstOf([
    gradeSugar(sugarPer100),
    gradeSaturatedFat(saturatedFatPer100),
    gradeSodium(sodiumPer100),
  ]);
}

export type PerNutrientGrades = {
  sugar: NutriLevel | null;
  sodium: NutriLevel | null;
  saturatedFat: NutriLevel | null;
};

/**
 * Individual A-D grade per nutrient, shown next to each value on the detail
 * page — independent of whether the combined overall grade can be computed.
 */
export function gradeEachNutrient(input: NutritionInput): PerNutrientGrades {
  const { sugarPer100, sodiumPer100, saturatedFatPer100 } = normalizeToPer100(input);

  return {
    sugar: sugarPer100 != null ? gradeSugar(sugarPer100) : null,
    sodium: sodiumPer100 != null ? gradeSodium(sodiumPer100) : null,
    saturatedFat: saturatedFatPer100 != null ? gradeSaturatedFat(saturatedFatPer100) : null,
  };
}
