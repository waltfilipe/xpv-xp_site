export function formatContractUntil(value: unknown): string {
  if (value == null || value === "") return "—";
  const s = String(value).trim();
  const ymd = s.match(/^(\d{4})[-/](\d{1,2})/);
  if (ymd) return `${ymd[1]}/${ymd[2].padStart(2, "0")}`;
  const year = s.match(/^(\d{4})/);
  if (year) return year[1];
  return s;
}

export function formatMetric(value: unknown, key?: string): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    if (key?.includes("pct") || key?.includes("coe")) {
      return `${value >= 0 ? "+" : ""}${value.toFixed(1)} pp`;
    }
    if (Number.isInteger(value) && !key?.includes("p90") && !key?.includes("score")) {
      return value.toLocaleString();
    }
    return value.toFixed(1);
  }
  return String(value);
}
