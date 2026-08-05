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
  | "pass_chance_creation_letter";

type SortDir = "asc" | "desc";

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

export function PlayersTable({ players, positionFamily }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("pass_rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const rows = players.map((player) => ({
      player,
      pass_rating: passRatingDisplay(player),
    }));
    rows.sort((left, right) => {
      let av: unknown;
      let bv: unknown;
      if (sortKey === "pass_rating") {
        av = left.pass_rating;
        bv = right.pass_rating;
      } else if (sortKey === "league") {
        av = formatLeagueName(left.player.league, left.player.league_source);
        bv = formatLeagueName(right.player.league, right.player.league_source);
      } else {
        av = left.player[sortKey as keyof PlayerSummary];
        bv = right.player[sortKey as keyof PlayerSummary];
      }
      const cmp = compareValues(av, bv, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [players, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "player_name" || key === "league" ? "asc" : "desc");
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return null;
    return (
      <i className={`fa-solid fa-caret-${sortDir === "asc" ? "up" : "down"} players-sort-icon`} aria-hidden="true" />
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
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={8} className="muted" style={{ textAlign: "center", padding: "2rem" }}>
                Nenhum jogador encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
