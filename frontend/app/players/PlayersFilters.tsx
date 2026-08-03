"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useTransition } from "react";

type Props = {
  leagues: string[];
  positionGroups: string[];
  positionFamilies: readonly { key: string; label: string }[];
  currentLeague?: string;
  currentPositionGroup?: string;
  currentPositionFamily?: string;
  currentSearch?: string;
};

export function PlayersFilters({
  leagues,
  positionGroups,
  positionFamilies,
  currentLeague,
  currentPositionGroup,
  currentPositionFamily,
  currentSearch,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const league = String(form.get("league") || "");
    const positionGroup = String(form.get("position_group") || "");
    const positionFamily = String(form.get("position_family") || "midfielders");
    const search = String(form.get("search") || "").trim();
    if (league) params.set("league", league);
    if (positionGroup) params.set("position_group", positionGroup);
    if (positionFamily && positionFamily !== "midfielders") params.set("position_family", positionFamily);
    if (search) params.set("search", search);
    startTransition(() => {
      router.push(`/players?${params.toString()}`);
    });
  }

  function clearFilters() {
    startTransition(() => {
      router.push("/players");
    });
  }

  return (
    <form className="filters" onSubmit={onSubmit}>
      <input
        name="search"
        type="search"
        placeholder="Buscar jogador..."
        defaultValue={currentSearch ?? searchParams.get("search") ?? ""}
      />
      <select name="league" defaultValue={currentLeague ?? searchParams.get("league") ?? ""}>
        <option value="">Todas as ligas</option>
        {leagues.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <select
        name="position_family"
        defaultValue={currentPositionFamily ?? searchParams.get("position_family") ?? "midfielders"}
      >
        {positionFamilies.map((family) => (
          <option key={family.key} value={family.key}>{family.label}</option>
        ))}
      </select>
      <select
        name="position_group"
        defaultValue={currentPositionGroup ?? searchParams.get("position_group") ?? ""}
      >
        <option value="">Todas as posições</option>
        {positionGroups.map((pg) => (
          <option key={pg} value={pg}>
            {pg}
          </option>
        ))}
      </select>
      <button type="submit" className="btn" disabled={isPending}>
        {isPending ? "Filtrando..." : "Filtrar"}
      </button>
      <button type="button" className="btn" style={{ background: "var(--surface-2)", color: "var(--text)" }} onClick={clearFilters}>
        Limpar
      </button>
    </form>
  );
}
