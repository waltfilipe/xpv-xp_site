"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PlayerSummary } from "@/lib/api";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { formatLeagueName } from "@/lib/formatters";

const LETTER_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D"] as const;

type SortKey =
  | "player_name"
  | "league"
  | "age"
  | "pass_rating"
  | "pass_volume_letter"
  | "pass_efficiency_letter"
  | "pass_buildup_letter"
  | "pass_chance_creation_letter"
  | "defense_letter";

type SortDir = "asc" | "desc";
type SortEntry = { key: SortKey; dir: SortDir };

type Props = {
  players: PlayerSummary[];
  positionFamily: string;
};

function passRatingDisplay(player: PlayerSummary): number | null {
  const raw = player.xp_pass_rating ?? player.pass_rating;
  if (raw == null || Number.isNaN(raw)) return null;
  return raw * 10;
}

function letterRank(letter: string | null | undefined): number {
  if (!letter?.trim()) return 999;
  const normalized = letter.trim().replace("−", "-");
  const idx = LETTER_ORDER.indexOf(normalized as (typeof LETTER_ORDER)[number]);
  return idx === -1 ? 998 : idx;
}

function valueForKey(
  player: PlayerSummary,
  passRating: number | null,
  key: SortKey,
): unknown {
  if (key === "pass_rating") return passRating;
  if (key === "league") return formatLeagueName(player.league, player.league_source);
  return player[key as keyof PlayerSummary];
}

function compareValues(a: unknown, b: unknown, key: SortKey): number {
  if (key === "pass_rating") {
    const na = typeof a === "number" ? a : -Infinity;
    const nb = typeof b === "number" ? b : -Infinity;
    return na - nb;
  }
  if (
    key === "pass_volume_letter"
    || key === "pass_efficiency_letter"
    || key === "pass_buildup_letter"
    || key === "pass_chance_creation_letter"
    || key === "defense_letter"
  ) {
    return letterRank(String(a ?? "")) - letterRank(String(b ?? ""));
  }
  if (key === "age") {
    const na = typeof a === "number" ? a : -Infinity;
    const nb = typeof b === "number" ? b : -Infinity;
    return na - nb;
  }
  return String(a ?? "").localeCompare(String(b ?? ""), "pt-BR", { sensitivity: "base" });
}

function defaultDirForKey(key: SortKey): SortDir {
  return key === "player_name" || key === "league" ? "asc" : "desc";
}

export function PlayersTable({ players, positionFamily }: Props) {
  const [sortStack, setSortStack] = useState<SortEntry[]>([
    { key: "pass_rating", dir: "desc" },
  ]);

  const sorted = useMemo(() => {
    const rows = players.map((player) => ({
      player,
      pass_rating: passRatingDisplay(player),
    }));
    rows.sort((left, right) => {
      for (const entry of sortStack) {
        const av = valueForKey(left.player, left.pass_rating, entry.key);
        const bv = valueForKey(right.player, right.pass_rating, entry.key);
        const cmp = compareValues(av, bv, entry.key);
        if (cmp !== 0) return entry.dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
    return rows;
  }, [players, sortStack]);

  function toggleSort(key: SortKey) {
    setSortStack((prev) => {
      if (prev[0]?.key === key) {
        const flipped = prev[0].dir === "asc" ? "desc" : "asc";
        return [{ key, dir: flipped }, ...prev.slice(1)];
      }
      const without = prev.filter((entry) => entry.key !== key);
      return [{ key, dir: defaultDirForKey(key) }, ...without].slice(0, 4);
    });
  }

  function sortIndicator(key: SortKey) {
    const index = sortStack.findIndex((entry) => entry.key === key);
    if (index === -1) return null;
    const entry = sortStack[index];
    return (
      <span className="players-sort-indicator">
        <i className={`fa-solid fa-caret-${entry.dir === "asc" ? "up" : "down"} players-sort-icon`} aria-hidden="true" />
        {sortStack.length > 1 && index > 0 && (
          <span className="players-sort-priority tabular">{index + 1}</span>
        )}
      </span>
    );
  }

  return (
    <div className="table-wrap">
      <table className="players-table">
        <thead>
          <tr>
            <th>
              <button type="button" className="players-sort-btn" onClick={() => toggleSort("player_name")}>
                Jogador {sortIndicator("player_name")}
              </button>
            </th>
            <th>
              <button type="button" className="players-sort-btn" onClick={() => toggleSort("league")}>
                Liga {sortIndicator("league")}
              </button>
            </th>
            <th>
              <button type="button" className="players-sort-btn" onClick={() => toggleSort("age")}>
                Idade {sortIndicator("age")}
              </button>
            </th>
            <th>
              <button type="button" className="players-sort-btn" onClick={() => toggleSort("pass_rating")}>
                Pass Rating {sortIndicator("pass_rating")}
              </button>
            </th>
            <th>
              <button type="button" className="players-sort-btn" onClick={() => toggleSort("pass_volume_letter")}>
                Volume {sortIndicator("pass_volume_letter")}
              </button>
            </th>
            <th>
              <button type="button" className="players-sort-btn" onClick={() => toggleSort("pass_efficiency_letter")}>
                Efficiency {sortIndicator("pass_efficiency_letter")}
              </button>
            </th>
            <th>
              <button type="button" className="players-sort-btn" onClick={() => toggleSort("pass_buildup_letter")}>
                Build-up {sortIndicator("pass_buildup_letter")}
              </button>
            </th>
            <th>
              <button type="button" className="players-sort-btn" onClick={() => toggleSort("pass_chance_creation_letter")}>
                Chance creation {sortIndicator("pass_chance_creation_letter")}
              </button>
            </th>
            <th>
              <button type="button" className="players-sort-btn" onClick={() => toggleSort("defense_letter")}>
                Defense {sortIndicator("defense_letter")}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ player, pass_rating }) => (
            <tr key={player.player_id}>
              <td>
                <Link href={`/profile?player=${player.player_id}&position_family=${positionFamily}`}>
                  {player.player_name}
                </Link>
              </td>
              <td>{formatLeagueName(player.league, player.league_source)}</td>
              <td className="tabular">{player.age ?? "—"}</td>
              <td>
                <span className="rating tabular">
                  {pass_rating != null ? pass_rating.toFixed(1) : "—"}
                </span>
              </td>
              <td><GradeBadge letter={player.pass_volume_letter} size="sm" /></td>
              <td><GradeBadge letter={player.pass_efficiency_letter} size="sm" /></td>
              <td><GradeBadge letter={player.pass_buildup_letter} size="sm" /></td>
              <td><GradeBadge letter={player.pass_chance_creation_letter} size="sm" /></td>
              <td><GradeBadge letter={player.defense_letter} displayScore={player.defense_display} size="sm" /></td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={9} className="muted" style={{ textAlign: "center", padding: "2rem" }}>
                Nenhum jogador encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
