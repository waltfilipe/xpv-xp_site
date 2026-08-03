export function gradeColor(score: number, scale = 10): string {
  const s = scale <= 1 ? score * 10 : score;
  if (s >= 8.2) return "#4ade80";
  if (s >= 7) return "#86efac";
  if (s >= 6) return "#fbbf24";
  if (s >= 5) return "#fb923c";
  return "#f87171";
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
  return Math.max(2, Math.min(98, ((score - 3) / 6) * 100));
}

export function letterGradeColor(letter: string | null | undefined): string {
  if (!letter || letter === "—") return "#94a3b8";
  const l = letter.toUpperCase();
  if (l.startsWith("A")) return "#4ade80";
  if (l.startsWith("B")) return "#38bdf8";
  if (l.startsWith("C")) return "#fbbf24";
  return "#f87171";
}

export function letterGradeBg(letter: string | null | undefined): string {
  const c = letterGradeColor(letter);
  return `${c}18`;
}

export function gradientBarTier(score: number): "cool" | "warm" | "hot" {
  if (score >= 7.5) return "hot";
  if (score >= 5.5) return "warm";
  return "cool";
}

export function formatStat(value: unknown, key?: string): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    if (key?.includes("pct") || key?.includes("coe")) return `${value >= 0 ? "+" : ""}${value.toFixed(1)} pp`;
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toFixed(2);
  }
  return String(value);
}
