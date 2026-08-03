export type ProfileFilterState = {
  league?: string;
  search?: string;
  player?: string;
  age_band?: string;
  age_min?: string;
  age_max?: string;
  foot?: string;
  value_min?: string;
  value_max?: string;
  contract_min?: string;
  contract_max?: string;
  minutes_min?: string;
  minutes_max?: string;
  height_min?: string;
  height_max?: string;
  regions?: string;
  countries?: string;
};

export function filtersFromRecord(params: Record<string, string | string[] | undefined>): ProfileFilterState {
  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    league: get("league"),
    search: get("search"),
    player: get("player"),
    age_band: get("age_band"),
    age_min: get("age_min"),
    age_max: get("age_max"),
    foot: get("foot"),
    value_min: get("value_min"),
    value_max: get("value_max"),
    contract_min: get("contract_min"),
    contract_max: get("contract_max"),
    minutes_min: get("minutes_min"),
    minutes_max: get("minutes_max"),
    height_min: get("height_min"),
    height_max: get("height_max"),
    regions: get("regions"),
    countries: get("countries"),
  };
}

export function buildProfileQuery(filters: ProfileFilterState): string {
  const params = new URLSearchParams();
  const set = (key: keyof ProfileFilterState, value?: string) => {
    if (value && value !== "all" && value !== "") params.set(key, value);
  };
  set("league", filters.league);
  set("search", filters.search);
  set("player", filters.player);
  set("age_band", filters.age_band);
  set("age_min", filters.age_min);
  set("age_max", filters.age_max);
  set("foot", filters.foot);
  set("value_min", filters.value_min);
  set("value_max", filters.value_max);
  set("contract_min", filters.contract_min);
  set("contract_max", filters.contract_max);
  set("minutes_min", filters.minutes_min);
  set("minutes_max", filters.minutes_max);
  set("height_min", filters.height_min);
  set("height_max", filters.height_max);
  set("regions", filters.regions);
  set("countries", filters.countries);
  return params.toString();
}

export function buildProfileUrl(filters: ProfileFilterState): string {
  const q = buildProfileQuery(filters);
  return q ? `/profile?${q}` : "/profile";
}

export function filtersToApiParams(filters: ProfileFilterState): Record<string, string> {
  const out: Record<string, string> = {
    league: filters.league || "all",
    foot: filters.foot || "all",
    age_band: filters.age_band || "all",
    value_min_m: filters.value_min ?? "0",
    value_max_m: filters.value_max ?? "150",
    contract_year_min: filters.contract_min ?? "2026",
    contract_year_max: filters.contract_max ?? "2033",
    minutes_min: filters.minutes_min ?? "0",
    minutes_max: filters.minutes_max ?? "3600",
    height_min_m: filters.height_min ?? "1.60",
    height_max_m: filters.height_max ?? "2.05",
  };
  if (filters.search) out.search = filters.search;
  if (filters.age_min) out.age_slider_min = filters.age_min;
  if (filters.age_max) out.age_slider_max = filters.age_max;
  if (filters.regions) out.nationality_regions = filters.regions;
  if (filters.countries) out.nationality_countries = filters.countries;
  return out;
}
