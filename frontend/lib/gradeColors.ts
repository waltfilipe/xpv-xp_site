/** Streamlit-aligned grade colors and helpers. */

export const LETTER_GRADE_PILL_COLORS: Record<string, string> = {
  "A+": "#15803d",
  A: "#16a34a",
  "A-": "#22c55e",
  "B+": "#4d7c0f",
  B: "#65a30d",
  "B-": "#84cc16",
  "C+": "#ca8a04",
  C: "#eab308",
  "C-": "#facc15",
  D: "#dc2626",
};

const LETTER_GRADE_COLOR_SCORES: Record<string, number> = {
  "A+": 8.8,
  A: 8.4,
  "A-": 8.0,
  "B+": 7.6,
  B: 7.2,
  "B-": 6.8,
  "C+": 6.45,
  C: 6.1,
  "C-": 5.9,
  D: 4.2,
};

const PASS_GRADE_STOPS: [number, [number, number, number]][] = [
  [0, [0x7f, 0x1d, 0x1d]],
  [24, [0xb4, 0x53, 0x09]],
  [42, [0xca, 0x8a, 0x04]],
  [68, [0x65, 0xa3, 0x0d]],
  [100, [0x16, 0xa3, 0x4a]],
];

export function passGradePct(displayScore: number): number {
  return Math.max(0, Math.min(100, ((displayScore - 4.5) / 4.5) * 100));
}

export function passGradeGradientColor(pct: number): string {
  const position = Math.max(0, Math.min(100, pct));
  for (let i = 0; i < PASS_GRADE_STOPS.length - 1; i++) {
    const [startPct, startRgb] = PASS_GRADE_STOPS[i];
    const [endPct, endRgb] = PASS_GRADE_STOPS[i + 1];
    if (position <= endPct) {
      const span = endPct - startPct;
      const t = span <= 0 ? 0 : (position - startPct) / span;
      const rgb = startRgb.map((ch, idx) =>
        Math.round(ch + (endRgb[idx] - ch) * t),
      ) as [number, number, number];
      return `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    }
  }
  return "#16a34a";
}

export function gradeColor(score: number, scale = 10): string {
  const s = scale <= 1 ? score * 10 : score;
  return passGradeGradientColor(passGradePct(s));
}

export function gradeTier(score: number, scale = 10): string {
  const s = scale <= 1 ? score * 10 : score;
  if (s >= 8.2) return "Elite";
  if (s >= 7) return "Very good";
  if (s >= 6) return "Good";
  if (s >= 5) return "Average";
  return "Below average";
}

export function barPosition(score: number | null | undefined): number {
  if (score == null) return 0;
  return Math.max(2, Math.min(98, passGradePct(score)));
}

export function letterGradePillColor(
  letter: string | null | undefined,
  displayScore?: number | null,
): string {
  if (!letter || letter === "—") {
    if (displayScore != null) return passGradeGradientColor(passGradePct(displayScore));
    return "#334155";
  }
  const key = letter.toUpperCase();
  if (LETTER_GRADE_PILL_COLORS[key]) return LETTER_GRADE_PILL_COLORS[key];
  const score = LETTER_GRADE_COLOR_SCORES[key];
  if (score != null) return passGradeGradientColor(passGradePct(score));
  if (displayScore != null) return passGradeGradientColor(passGradePct(displayScore));
  return "#334155";
}

export function badgeTextColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 168 ? "#1e293b" : "#f8fafc";
}

export function letterGradeColor(letter: string | null | undefined): string {
  return badgeTextColor(letterGradePillColor(letter));
}

export function letterGradeBg(letter: string | null | undefined, displayScore?: number | null): string {
  return letterGradePillColor(letter, displayScore);
}

export function gradientBarTier(score: number): "cool" | "warm" | "hot" {
  if (score >= 7.5) return "hot";
  if (score >= 5.5) return "warm";
  return "cool";
}

/** Map pool rank (1 = best) to a 0–10 bar score for gradient bars. */
export function rankToBarScore(rank?: number | null, rankPool?: number | null): number | null {
  if (rank == null || rankPool == null || rankPool <= 1) return null;
  const pct = 1 - (rank - 1) / (rankPool - 1);
  return 4.5 + pct * 4.5;
}

export const IMPACT_ELITE_TOP_N = 10;
export const IMPACT_ELITE_COLOR = "#38bdf8";

/** True when the player ranks in the elite top-N within their peer pool. */
export function isImpactEliteRank(rank?: number | null): boolean {
  return rank != null && rank > 0 && rank <= IMPACT_ELITE_TOP_N;
}

/** Bar color for Impact index sub-metrics — elite blue for top 10, else red→green gradient. */
export function impactMetricBarColor(rank?: number | null, rankPool?: number | null): string {
  if (isImpactEliteRank(rank)) return IMPACT_ELITE_COLOR;
  const score = rankToBarScore(rank, rankPool);
  if (score == null) return "#64748b";
  return passGradeGradientColor(passGradePct(score));
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ] as const;
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const rgb = [
    lerpChannel(ar, br, t),
    lerpChannel(ag, bg, t),
    lerpChannel(ab, bb, t),
  ];
  return `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Gray → yellow (mid) → strong red for xP profile bars. */
export function heatBarColor(positionPct: number): string {
  const p = Math.max(0, Math.min(100, positionPct));
  if (p <= 50) return lerpHex("#64748b", "#facc15", p / 50);
  return lerpHex("#facc15", "#dc2626", (p - 50) / 50);
}

export const LETTER_GRADE_FILTER_OPTIONS = [
  { key: "all", label: "Todas" },
  { key: "A+", label: "A+" },
  { key: "A", label: "A" },
  { key: "A-", label: "A−" },
  { key: "B+", label: "B+" },
  { key: "B", label: "B" },
  { key: "B-", label: "B−" },
  { key: "C+", label: "C+" },
  { key: "C", label: "C" },
  { key: "C-", label: "C−" },
  { key: "D", label: "D" },
] as const;

export const XP_INDEX_TIER_LABELS: Record<string, string> = {
  elite: "Elite",
  above: "Above average",
  mid: "Average",
  below: "Below average",
};

export function xpIndexTierClass(tier: string | null | undefined): string {
  if (!tier) return "xp-index-mid";
  if (tier === "elite") return "xp-index-elite";
  if (tier === "above") return "xp-index-above";
  if (tier === "below") return "xp-index-below";
  return "xp-index-mid";
}

export function formatStat(value: unknown, key?: string): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    if (key?.includes("pct") || key?.includes("coe")) return `${value >= 0 ? "+" : ""}${value.toFixed(1)} pp`;
    if (Number.isInteger(value) && !key?.includes("p90") && !key?.includes("score")) {
      return value.toLocaleString();
    }
    return value.toFixed(1);
  }
  return String(value);
}
