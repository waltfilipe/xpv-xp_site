"use client";

import { useRouter } from "next/navigation";
import { buildProfileUrl, type ProfileFilterState } from "@/lib/profileParams";

type Option = { player_id: string; label: string };

export function PlayerSelector({
  options,
  currentId,
  filters,
}: {
  options: Option[];
  currentId?: string;
  filters: ProfileFilterState;
}) {
  const router = useRouter();
  if (!options.length) return null;

  return (
    <div className="player-select-row">
      <label className="filter-label" htmlFor="player-select">Jogador</label>
      <select
        id="player-select"
        className="player-select"
        value={currentId ?? options[0].player_id}
        onChange={(e) => {
          router.push(buildProfileUrl({ ...filters, player: e.target.value }));
        }}
      >
        {options.map((o) => (
          <option key={o.player_id} value={o.player_id}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
