/** Position family options — shared without pulling in full filter defaults. */

export const POSITION_FAMILIES = [
  { key: "midfielders", label: "Midfielders" },
] as const;

export function positionBlocksForFamily(family: string): { key: string; label: string }[] {
  const match = POSITION_FAMILIES.find((f) => f.key === family);
  const label = match?.label.toLowerCase() ?? "jogadores";
  const blocks = [{ key: "all", label: `Todos os ${label}` }];
  if (family === "midfielders") {
    blocks.push(
      { key: "cm", label: "Meio-campistas centrais" },
      { key: "am", label: "Meio-campistas ofensivos" },
    );
  }
  return blocks;
}
