"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { buildProfileUrl, type ProfileFilterState } from "@/lib/profileParams";

type Option = { player_id: string; label: string };

export function PlayerSearchRow({
  options,
  currentId,
  filters,
}: {
  options: Option[];
  currentId?: string;
  filters: ProfileFilterState;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(filters.search ?? "");

  if (!options.length) return null;

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(
      buildProfileUrl({
        ...filters,
        search: search.trim() || undefined,
        player: undefined,
      }),
    );
  }

  return (
    <div className="player-search-row">
      <form className="player-search-form" onSubmit={onSearchSubmit}>
        <label className="filter-label" htmlFor="player-search">Buscar jogador</label>
        <div className="player-search-input-wrap">
          <input
            id="player-search"
            type="search"
            className="player-search-input"
            placeholder="Nome do jogador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-ghost btn-sm" aria-label="Buscar">
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </div>
      </form>

      <div className="player-select-field">
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
    </div>
  );
}
