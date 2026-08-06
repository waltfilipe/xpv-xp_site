import type { ProfileFilterState } from "@/lib/profileParams";
import { filtersToApiParams } from "@/lib/profileParams";
import { positionBlocksForFamily } from "@/lib/positionFamilies";
import {
  LETTER_GRADE_SCORES,
  PASS_SCORE_LETTER_FIELDS,
  PLAYER_LIST_FIELDS,
} from "@/lib/static/constants";
import type { PoolPlayer } from "@/lib/static/pool";
import { loadNationalityRegions } from "@/lib/static/pool";

const VALUE_SLIDER_MAX_EUR = 150_000_000;
const MIN_AGE = 16;
const MAX_AGE = 42;

type AgeBand = { key: string; min: number | null; max: number | null };

const AGE_BANDS: AgeBand[] = [
  { key: "all", min: null, max: null },
  { key: "u21", min: null, max: 21 },
  { key: "u23", min: 22, max: 23 },
  { key: "24_30", min: 24, max: 30 },
  { key: "over30", min: 31, max: null },
];

function parseAgeBand(ageBand?: string): { min: number | null; max: number | null } {
  const key = (ageBand || "all").trim().toLowerCase();
  const band = AGE_BANDS.find((b) => b.key === key) ?? AGE_BANDS[0];
  return { min: band.min, max: band.max };
}

function normalizeFoot(value: unknown): string | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (text === "left" || text === "esquerdo") return "left";
  if (text === "right" || text === "direito") return "right";
  if (text === "both" || text === "ambidestro") return "both";
  return null;
}

function letterGradeScore(letter: unknown): number | null {
  const normalized = String(letter ?? "")
    .trim()
    .toUpperCase()
    .replace("−", "-");
  if (!normalized || normalized === "—") return null;
  return LETTER_GRADE_SCORES[normalized] ?? null;
}

function letterGradeMeetsMinimum(playerLetter: unknown, minimumLetter: string): boolean {
  const minScore = letterGradeScore(minimumLetter);
  if (minScore === null) return true;
  const playerScore = letterGradeScore(playerLetter);
  if (playerScore === null) return false;
  return playerScore >= minScore;
}

function parseHeightMeters(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 3 ? value / 100 : value;
  }
  const text = String(value).trim().replace(",", ".");
  const m = text.match(/^(\d+(?:\.\d+)?)\s*m?$/i);
  if (m) {
    const n = parseFloat(m[1]);
    return n > 3 ? n / 100 : n;
  }
  const cm = text.match(/^(\d+)\s*cm$/i);
  if (cm) return parseInt(cm[1], 10) / 100;
  return null;
}

function positionFilterFromBlock(
  positionBlock: string,
  positionFamily: string,
): { codes: Set<string>; groups: Set<string> } {
  const blockId = (positionBlock || "all").trim().toLowerCase();
  const codes = new Set<string>();
  const groups = new Set<string>();
  if (positionFamily !== "midfielders" || blockId === "" || blockId === "all") {
    return { codes, groups };
  }
  if (blockId === "cm") groups.add("central_midfielders");
  if (blockId === "am") groups.add("attacking_midfielders");
  return { codes, groups };
}

function playerMatchesPositionFilter(
  player: PoolPlayer,
  codes: Set<string>,
  groups: Set<string>,
): boolean {
  if (codes.size === 0 && groups.size === 0) return true;
  const pos = String(player.position ?? "").trim().toUpperCase();
  const group = String(player.position_group ?? "");
  if (groups.size > 0 && groups.has(group)) return true;
  if (codes.size > 0 && codes.has(pos)) return true;
  return false;
}

async function resolveNationalities(filters: ProfileFilterState): Promise<Set<string> | null> {
  const regionsRaw = filters.regions?.split(",").map((r) => r.trim()).filter(Boolean) ?? ["World"];
  if (regionsRaw.length === 0 || regionsRaw.includes("World")) return null;

  const data = await loadNationalityRegions();
  const countriesByRegion = (data.countries_by_region ?? {}) as Record<string, string[]>;
  const aliases = (data.aliases ?? {}) as Record<string, string>;
  const allowed = new Set<string>();

  for (const region of regionsRaw) {
    for (const country of countriesByRegion[region] ?? []) {
      allowed.add(country);
      const alias = aliases[country.toLowerCase()];
      if (alias) allowed.add(alias);
    }
  }

  const countries = filters.countries?.split(",").map((c) => c.trim()).filter(Boolean) ?? [];
  if (countries.length > 0) {
    const narrowed = new Set<string>();
    for (const c of countries) narrowed.add(c);
    return narrowed;
  }

  return allowed.size > 0 ? allowed : null;
}

function nationalityMatches(nationality: unknown, allowed: Set<string>): boolean {
  const norm = String(nationality ?? "").trim();
  if (!norm) return false;
  if (allowed.has(norm)) return true;
  return [...allowed].some((c) => c.toLowerCase() === norm.toLowerCase());
}

export function pickFields(player: PoolPlayer, fields: readonly string[]): PoolPlayer {
  const out: PoolPlayer = {};
  for (const key of fields) {
    if (key in player) out[key] = player[key];
  }
  return out;
}

export async function filterPoolPlayers(
  players: PoolPlayer[],
  filters: ProfileFilterState = {},
): Promise<PoolPlayer[]> {
  const api = filtersToApiParams(filters);
  const { min: ageBandMin, max: ageBandMax } = parseAgeBand(api.age_band);
  const ageSliderMin = filters.age_min ? parseInt(filters.age_min, 10) : MIN_AGE;
  const ageSliderMax = filters.age_max ? parseInt(filters.age_max, 10) : MAX_AGE;
  const effectiveAgeMin = Math.max(ageBandMin ?? MIN_AGE, ageSliderMin);
  const effectiveAgeMax = Math.min(ageBandMax ?? MAX_AGE, ageSliderMax);

  const valueMinEur = parseInt(api.value_min_m ?? "0", 10) * 1_000_000;
  const valueMaxEur = parseInt(api.value_max_m ?? "150", 10) * 1_000_000;
  const contractMin = parseInt(api.contract_year_min ?? "2026", 10);
  const contractMax = parseInt(api.contract_year_max ?? "2033", 10);
  const minutesMin = parseInt(api.minutes_min ?? "0", 10);
  const minutesMax = parseInt(api.minutes_max ?? "3600", 10);
  const heightMin = parseFloat(api.height_min_m ?? "1.60");
  const heightMax = parseFloat(api.height_max_m ?? "2.05");

  const filterByValue = valueMinEur > 0 || valueMaxEur < VALUE_SLIDER_MAX_EUR;
  const filterByContract = contractMin > 2026 || contractMax < 2033;
  const filterByMinutes = minutesMin > 0 || minutesMax < 3600;
  const filterByHeight = heightMin > 1.6 || heightMax < 2.05;
  const allowedNationalities = await resolveNationalities(filters);

  const league = api.league || "all";
  const foot = api.foot || "all";
  const search = filters.search?.toLowerCase();

  let rows = players.filter((player) => {
    if (league !== "all" && String(player.league_source ?? "") !== league) return false;
    if (search && !String(player.player_name ?? "").toLowerCase().includes(search)) return false;

    const age = player.age;
    if (age !== null && age !== undefined && age !== "") {
      const ageVal = parseInt(String(age), 10);
      if (ageVal < effectiveAgeMin || ageVal > effectiveAgeMax) return false;
    } else if (ageBandMin !== null || ageBandMax !== null) {
      return false;
    }

    if (foot !== "all") {
      const playerFoot = normalizeFoot(player.dominant_foot);
      if (!playerFoot || playerFoot !== foot) return false;
    }

    if (filterByValue) {
      const mv = player.market_value_eur;
      if (mv === null || mv === undefined) return false;
      const val = parseInt(String(mv), 10);
      if (val < valueMinEur || val > valueMaxEur) return false;
    }

    if (filterByContract) {
      const contract = player.contract_until;
      if (!contract) return false;
      const year = parseInt(String(contract).slice(0, 4), 10);
      if (Number.isNaN(year) || year < contractMin || year > contractMax) return false;
    }

    if (filterByMinutes) {
      const minutes = player.minutes;
      if (minutes === null || minutes === undefined) return false;
      const val = parseInt(String(minutes), 10);
      if (val < minutesMin || val > minutesMax) return false;
    }

    if (filterByHeight) {
      const heightM = parseHeightMeters(player.height);
      if (heightM === null || heightM < heightMin || heightM > heightMax) return false;
    }

    if (allowedNationalities) {
      if (!nationalityMatches(player.nationality, allowedNationalities)) return false;
    }

    return true;
  });

  const gradeFilters: Record<string, string> = {
    volume_grade: api.volume_grade || "all",
    efficiency_grade: api.efficiency_grade || "all",
    buildup_grade: api.buildup_grade || "all",
    chance_grade: api.chance_grade || "all",
  };

  const hasGradeFilter = Object.values(gradeFilters).some((g) => g && g !== "all");
  if (hasGradeFilter) {
    rows = rows.filter((player) => {
      for (const [paramKey, selected] of Object.entries(gradeFilters)) {
        if (!selected || selected === "all") continue;
        const letterKey = PASS_SCORE_LETTER_FIELDS[paramKey];
        if (!letterGradeMeetsMinimum(player[letterKey], selected)) return false;
      }
      return true;
    });
  }

  return rows;
}

export function buildPlayerOptions(
  players: PoolPlayer[],
  filters: ProfileFilterState = {},
  excludePlayerId?: string,
): { player_id: string; player_name: string; team: string; label: string }[] {
  const family = filters.position_family ?? "midfielders";
  const { codes, groups } = positionFilterFromBlock(filters.position_block ?? "all", family);

  const ranked: { pid: string; name: string; team: string; sortKey: number }[] = [];
  for (const player of players) {
    const pid = String(player.player_id ?? "");
    if (!pid || (excludePlayerId && pid === excludePlayerId)) continue;
    if (!playerMatchesPositionFilter(player, codes, groups)) continue;
    const ratingVal = player.xp_pass_rating;
    const sortKey =
      ratingVal !== null && ratingVal !== undefined ? parseFloat(String(ratingVal)) : Number.NEGATIVE_INFINITY;
    ranked.push({
      pid,
      name: String(player.player_name ?? "—"),
      team: String(player.team ?? "—"),
      sortKey,
    });
  }

  ranked.sort((a, b) => b.sortKey - a.sortKey || a.name.localeCompare(b.name));
  return ranked.map((row, idx) => ({
    player_id: row.pid,
    player_name: row.name,
    team: row.team,
    label: `#${idx + 1} ${row.name} (${row.team}) · Pass ${row.sortKey > -Infinity ? row.sortKey.toFixed(1) : "—"}`,
  }));
}

export function listPlayerSummaries(
  players: PoolPlayer[],
  filters: ProfileFilterState,
  limit = 200,
  offset = 0,
): { total: number; players: PoolPlayer[] } {
  return {
    total: players.length,
    players: players.slice(offset, offset + limit).map((p) => pickFields(p, PLAYER_LIST_FIELDS)),
  };
}

export function availablePositionBlocks(family: string) {
  return positionBlocksForFamily(family);
}
