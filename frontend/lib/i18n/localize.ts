import type { FilterOptionsMeta } from "@/lib/filterTypes";
import { DEFAULT_FILTER_OPTIONS, mergeFilterOptions } from "@/lib/filterDefaults";
import type { TranslationDict } from "./en";

type MetaInput = Parameters<typeof mergeFilterOptions>[0];

function footLabel(t: TranslationDict, key: string, fallback: string): string {
  const labels = t.filterOptions.foot as Record<string, string>;
  return labels[key] ?? fallback;
}

function ageBandLabel(t: TranslationDict, key: string, fallback: string): string {
  const labels = t.filterOptions.ageBands as Record<string, string>;
  return labels[key] ?? fallback;
}

function letterGradeLabel(t: TranslationDict, key: string, fallback: string): string {
  const labels = t.filterOptions.letterGrades as Record<string, string>;
  return labels[key] ?? fallback;
}

function passScoreFilterLabel(t: TranslationDict, key: string, fallback: string): string {
  const map: Record<string, keyof TranslationDict["passScore"]> = {
    volume_grade: "volume",
    efficiency_grade: "efficiency",
    buildup_grade: "buildup",
    chance_grade: "chanceCreation",
  };
  const tipKey = map[key];
  if (tipKey && tipKey !== "tooltips" && tipKey !== "components" && tipKey !== "componentTips") {
    return t.passScore[tipKey];
  }
  return fallback;
}

function leagueLabel(t: TranslationDict, key: string, fallback: string): string {
  if (key === "all") return t.filterOptions.allLeagues;
  return fallback;
}

export function applyFilterLocalization(t: TranslationDict, base: FilterOptionsMeta): FilterOptionsMeta {
  return {
    ...base,
    leagues: base.leagues.map((l) => ({ ...l, label: leagueLabel(t, l.key, l.label) })),
    foot: base.foot.map((f) => ({ ...f, label: footLabel(t, f.key, f.label) })),
    age_bands: base.age_bands.map((b) => ({ ...b, label: ageBandLabel(t, b.key, b.label) })),
    letter_grades: base.letter_grades.map((g) => ({ ...g, label: letterGradeLabel(t, g.key, g.label) })),
    pass_score_filters: base.pass_score_filters.map((f) => ({
      ...f,
      label: passScoreFilterLabel(t, f.key, f.label),
    })),
    position_families: base.position_families.map((f) => ({
      ...f,
      label: f.key === "midfielders" ? t.filterOptions.positionFamilies.midfielders : f.label,
    })),
    position_blocks: positionBlocksForFamily(t, base.defaults.position_family),
  };
}

export function localizeFilterOptions(t: TranslationDict, meta?: MetaInput): FilterOptionsMeta {
  return applyFilterLocalization(t, mergeFilterOptions(meta));
}

export function positionBlocksForFamily(
  t: TranslationDict,
  family: string,
): { key: string; label: string }[] {
  const blocks = [{ key: "all", label: t.filterOptions.positionBlocks.all }];
  if (family === "midfielders") {
    blocks.push(
      { key: "cm", label: t.filterOptions.positionBlocks.cm },
      { key: "am", label: t.filterOptions.positionBlocks.am },
    );
  }
  return blocks;
}

export function getCompareMapFilters(t: TranslationDict): { key: string; label: string }[] {
  return [
    { key: "progressive", label: t.mapFilters.progressive },
    { key: "test_impact_v2", label: t.mapFilters.impactPasses },
    { key: "line_break", label: t.mapFilters.breakline },
    { key: "key_passes", label: t.mapFilters.keyPasses },
  ];
}

export function getReportMapFilters(t: TranslationDict): { key: string; label: string }[] {
  return [
    { key: "progressive", label: t.mapFilters.progressive },
    { key: "test_impact_v2", label: t.mapFilters.impactPasses },
    { key: "long_passes", label: t.mapFilters.longPasses },
    { key: "line_break", label: t.mapFilters.lineBreak },
  ];
}

export function translateMapFilterKey(key: string, t: TranslationDict): string {
  const map: Record<string, string> = {
    progressive: t.mapFilters.progressive,
    test_impact_v2: t.mapFilters.impactPasses,
    long_passes: t.mapFilters.longPasses,
    line_break: t.mapFilters.lineBreak,
    key_passes: t.mapFilters.keyPasses,
  };
  return map[key] ?? key;
}

export function translateReportCategory(
  categoryId: string,
  field: "title" | "subtitle" | "description",
  t: TranslationDict,
  fallback: string,
): string {
  const cats = t.reportCategories as Record<string, Record<string, string>>;
  return cats[categoryId]?.[field] ?? fallback;
}

export function translateReportGroupLabel(label: string | undefined, t: TranslationDict): string | undefined {
  if (!label) return undefined;
  const groups = t.reportCategories.groups as Record<string, string>;
  return groups[label] ?? label;
}

/** Ensure filter defaults use English keys before localization. */
export function englishFilterDefaults(): FilterOptionsMeta {
  return {
    ...DEFAULT_FILTER_OPTIONS,
    foot: [
      { key: "all", label: "All" },
      { key: "left", label: "Left" },
      { key: "right", label: "Right" },
      { key: "both", label: "Both" },
    ],
    age_bands: [
      { key: "all", label: "All ages", min: null, max: null },
      { key: "u21", label: "U21", min: null, max: 21 },
      { key: "u23", label: "U23", min: 22, max: 23 },
      { key: "24_30", label: "24-30", min: 24, max: 30 },
      { key: "over30", label: ">30", min: 31, max: null },
    ],
    letter_grades: DEFAULT_FILTER_OPTIONS.letter_grades.map((g) =>
      g.key === "all" ? { ...g, label: "All" } : g,
    ),
  };
}
