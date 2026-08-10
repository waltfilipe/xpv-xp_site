"use client";

import { useEffect, useMemo, useState } from "react";
import { getPlayerOptionsLegacy, type PlayerOption } from "@/lib/api";

const POSITION_FAMILY = "midfielders";

type Props = {
  label: string;
  value: string;
  exclude?: string;
  onChange: (playerId: string) => void;
};

export function ComparePlayerPicker({ label, value, exclude, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<PlayerOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      getPlayerOptionsLegacy({
        position_family: POSITION_FAMILY,
        search: search.trim() || undefined,
        exclude,
      })
        .then((res) => setOptions(res.options))
        .catch(() => setOptions([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [search, exclude]);

  const selected = useMemo(
    () => options.find((o) => o.player_id === value),
    [options, value],
  );

  const displayValue = open ? search : (selected?.label ?? search);

  return (
    <div className={`compare-player-picker${open ? " is-open" : ""}`}>
      <label className="filter-label compare-player-picker-label">{label}</label>
      <div className="compare-player-picker-wrap">
        <input
          type="text"
          className="compare-player-picker-input"
          value={displayValue}
          placeholder="Digite o nome do jogador…"
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setSearch(selected?.label ?? "");
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
        />
        {open && options.length > 0 && (
          <ul className="compare-player-picker-list" role="listbox">
            {options.map((option) => (
              <li key={option.player_id}>
                <button
                  type="button"
                  className={`compare-player-picker-option${option.player_id === value ? " active" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(option.player_id);
                    setSearch(option.label);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
