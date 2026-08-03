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

export function barWidth(score: number | null | undefined, scale = 10): number {
  if (score == null) return 0;
  const s = scale <= 1 ? score * 10 : score;
  return Math.max(4, Math.min(100, ((s - 3) / 6) * 100));
}
