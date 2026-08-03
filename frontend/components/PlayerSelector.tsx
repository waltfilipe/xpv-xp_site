"use client";

import { useRouter } from "next/navigation";

type Option = { player_id: string; label: string };

export function PlayerSelector({ options, currentId, league, search }: {
  options: Option[];
  currentId?: string;
  league?: string;
  search?: string;
}) {
  const router = useRouter();
  if (!options.length) return null;

  return (
    <div className="filters">
      <select
        value={currentId ?? options[0].player_id}
        onChange={(e) => {
          const params = new URLSearchParams();
          params.set("player", e.target.value);
          if (league) params.set("league", league);
          if (search) params.set("search", search);
          router.push(`/profile?${params.toString()}`);
        }}
      >
        {options.map((o) => (
          <option key={o.player_id} value={o.player_id}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
