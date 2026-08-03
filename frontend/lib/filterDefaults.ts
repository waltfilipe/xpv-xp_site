import type { FilterOptionsMeta } from "@/components/ProfileFilters";

export const DEFAULT_FILTER_OPTIONS: FilterOptionsMeta = {
  leagues: [
    { key: "all", label: "All leagues" },
    { key: "premier_league", label: "Premier League" },
    { key: "italia_seriea", label: "Serie A" },
    { key: "laliga", label: "La Liga" },
    { key: "bundesliga", label: "Bundesliga" },
    { key: "ligue1", label: "Ligue 1" },
  ],
  foot: [
    { key: "all", label: "Todos" },
    { key: "left", label: "Esquerdo" },
    { key: "right", label: "Direito" },
    { key: "both", label: "Ambidestro" },
  ],
  age_bands: [
    { key: "all", label: "Todas as idades", min: null, max: null },
    { key: "u21", label: "U21", min: null, max: 21 },
    { key: "u23", label: "U23", min: 22, max: 23 },
    { key: "24_30", label: "24-30", min: 24, max: 30 },
    { key: "over30", label: ">30", min: 31, max: null },
  ],
  nationality_regions: [
    "World",
    "Western Europe",
    "Eastern Europe",
    "Latin America",
    "Africa",
  ],
  age_range: { min: 16, max: 42 },
  value_range_m: { min: 0, max: 150 },
  contract_year_range: { min: 2026, max: 2033 },
  defaults: {
    league: "all",
    age_band: "all",
    age_slider: [16, 42],
    foot: "all",
    value_slider_m: [0, 150],
    contract_year: [2026, 2033],
    nationality_regions: ["World"],
    nationality_countries: [],
  },
};

export function mergeFilterOptions(
  meta?: {
    league_options?: { key: string; label: string }[];
    filter_options?: Partial<FilterOptionsMeta>;
    nationalities?: string[];
  },
): FilterOptionsMeta {
  const fo = meta?.filter_options;
  const base = DEFAULT_FILTER_OPTIONS;
  return {
    leagues: fo?.leagues?.length ? fo.leagues : (meta?.league_options?.length ? meta.league_options : base.leagues),
    foot: fo?.foot?.length ? fo.foot : base.foot,
    age_bands: fo?.age_bands?.length ? fo.age_bands : base.age_bands,
    nationality_regions: fo?.nationality_regions?.length ? fo.nationality_regions : base.nationality_regions,
    age_range: fo?.age_range ?? base.age_range,
    value_range_m: fo?.value_range_m ?? base.value_range_m,
    contract_year_range: fo?.contract_year_range ?? base.contract_year_range,
    defaults: { ...base.defaults, ...(fo?.defaults ?? {}) },
  };
}
