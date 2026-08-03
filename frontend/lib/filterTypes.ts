export type FilterOptionsMeta = {
  leagues: { key: string; label: string }[];
  foot: { key: string; label: string }[];
  age_bands: { key: string; label: string; min: number | null; max: number | null }[];
  nationality_regions: string[];
  age_range: { min: number; max: number };
  value_range_m: { min: number; max: number };
  contract_year_range: { min: number; max: number };
  minutes_range: { min: number; max: number };
  height_range_m: { min: number; max: number };
  letter_grades: { key: string; label: string }[];
  pass_score_filters: { key: string; label: string }[];
  position_families: { key: string; label: string }[];
  position_blocks: { key: string; label: string }[];
  defaults: {
    league: string;
    position_family: string;
    position_block: string;
    age_band: string;
    age_slider: [number, number];
    foot: string;
    value_slider_m: [number, number];
    contract_year: [number, number];
    minutes_slider: [number, number];
    height_slider_m: [number, number];
    nationality_regions: string[];
    nationality_countries: string[];
  };
};
