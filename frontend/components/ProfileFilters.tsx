"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import {
  buildProfileUrl,
  filtersFromRecord,
  type ProfileFilterState,
} from "@/lib/profileParams";

export type FilterOptionsMeta = {
  leagues: { key: string; label: string }[];
  foot: { key: string; label: string }[];
  age_bands: { key: string; label: string; min: number | null; max: number | null }[];
  nationality_regions: string[];
  age_range: { min: number; max: number };
  value_range_m: { min: number; max: number };
  contract_year_range: { min: number; max: number };
  defaults: {
    league: string;
    age_band: string;
    age_slider: [number, number];
    foot: string;
    value_slider_m: [number, number];
    contract_year: [number, number];
    nationality_regions: string[];
    nationality_countries: string[];
  };
};

type Props = {
  options: FilterOptionsMeta;
  nationalities: string[];
  current: ProfileFilterState;
};

export function ProfileFilters({ options, nationalities, current }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const defaults = options.defaults;

  const [state, setState] = useState(() => ({
    search: current.search ?? "",
    league: current.league ?? defaults.league,
    age_band: current.age_band ?? defaults.age_band,
    age_min: Number(current.age_min ?? defaults.age_slider[0]),
    age_max: Number(current.age_max ?? defaults.age_slider[1]),
    foot: current.foot ?? defaults.foot,
    value_min: Number(current.value_min ?? defaults.value_slider_m[0]),
    value_max: Number(current.value_max ?? defaults.value_slider_m[1]),
    contract_min: Number(current.contract_min ?? defaults.contract_year[0]),
    contract_max: Number(current.contract_max ?? defaults.contract_year[1]),
    regions: (current.regions?.split(",") ?? defaults.nationality_regions).filter(Boolean),
    countries: (current.countries?.split(",") ?? defaults.nationality_countries).filter(Boolean),
  }));

  const selectedCountries = useMemo(() => new Set(state.countries), [state.countries]);

  function toFilters(keepPlayer = false): ProfileFilterState {
    return {
      player: keepPlayer ? current.player : undefined,
      search: state.search.trim() || undefined,
      league: state.league !== "all" ? state.league : undefined,
      age_band: state.age_band !== "all" ? state.age_band : undefined,
      age_min: state.age_min !== defaults.age_slider[0] ? String(state.age_min) : undefined,
      age_max: state.age_max !== defaults.age_slider[1] ? String(state.age_max) : undefined,
      foot: state.foot !== "all" ? state.foot : undefined,
      value_min: state.value_min > 0 ? String(state.value_min) : undefined,
      value_max: state.value_max < defaults.value_slider_m[1] ? String(state.value_max) : undefined,
      contract_min: state.contract_min > defaults.contract_year[0] ? String(state.contract_min) : undefined,
      contract_max: state.contract_max < defaults.contract_year[1] ? String(state.contract_max) : undefined,
      regions:
        state.regions.length && !(state.regions.length === 1 && state.regions[0] === "World")
          ? state.regions.join(",")
          : undefined,
      countries: state.countries.length ? state.countries.join(",") : undefined,
    };
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(() => router.push(buildProfileUrl(toFilters())));
  }

  function clearFilters() {
    setState({
      search: "",
      league: defaults.league,
      age_band: defaults.age_band,
      age_min: defaults.age_slider[0],
      age_max: defaults.age_slider[1],
      foot: defaults.foot,
      value_min: defaults.value_slider_m[0],
      value_max: defaults.value_slider_m[1],
      contract_min: defaults.contract_year[0],
      contract_max: defaults.contract_year[1],
      regions: [...defaults.nationality_regions],
      countries: [...defaults.nationality_countries],
    });
    startTransition(() => router.push("/profile"));
  }

  function toggleRegion(region: string) {
    setState((s) => {
      if (region === "World") return { ...s, regions: ["World"], countries: [] };
      const next = s.regions.filter((r) => r !== "World");
      if (next.includes(region)) {
        const filtered = next.filter((r) => r !== region);
        return { ...s, regions: filtered.length ? filtered : ["World"] };
      }
      return { ...s, regions: [...next, region] };
    });
  }

  function toggleCountry(country: string) {
    setState((s) => {
      const has = s.countries.includes(country);
      const next = has ? s.countries.filter((c) => c !== country) : [...s.countries, country];
      return { ...s, countries: next };
    });
  }

  return (
    <div className="filter-card profile-filters">
      <div className="filter-head filter-head-row">
        <div>
          <span className="filter-title">
            <i className="fa-solid fa-sliders" /> Filtros do grupo
          </span>
          <span className="filter-sub">
            Combine faixa etária, valor, contrato e nacionalidade para refinar o grupo.
          </span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
          Limpar filtros
        </button>
      </div>

      <form className="profile-filters-form" onSubmit={onSubmit}>
        <div className="filter-grid filter-grid-3">
          <label className="filter-field">
            <span className="filter-label">Liga</span>
            <select value={state.league} onChange={(e) => setState((s) => ({ ...s, league: e.target.value }))}>
              {options.leagues.map((l) => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span className="filter-label">Faixa etária</span>
            <select value={state.age_band} onChange={(e) => setState((s) => ({ ...s, age_band: e.target.value }))}>
              {options.age_bands.map((b) => (
                <option key={b.key} value={b.key}>{b.label}</option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span className="filter-label">Pé dominante</span>
            <select value={state.foot} onChange={(e) => setState((s) => ({ ...s, foot: e.target.value }))}>
              {options.foot.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-grid filter-grid-2">
          <label className="filter-field filter-range">
            <span className="filter-label">
              Idade (ajuste fino) <strong className="tabular">{state.age_min}–{state.age_max}</strong>
            </span>
            <div className="dual-range">
              <input
                type="range"
                min={options.age_range.min}
                max={options.age_range.max}
                value={state.age_min}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setState((s) => ({ ...s, age_min: Math.min(v, s.age_max) }));
                }}
              />
              <input
                type="range"
                min={options.age_range.min}
                max={options.age_range.max}
                value={state.age_max}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setState((s) => ({ ...s, age_max: Math.max(v, s.age_min) }));
                }}
              />
            </div>
          </label>

          <label className="filter-field filter-range">
            <span className="filter-label">
              Valor de mercado (€M) <strong className="tabular">{state.value_min}–{state.value_max}</strong>
            </span>
            <div className="dual-range">
              <input
                type="range"
                min={options.value_range_m.min}
                max={options.value_range_m.max}
                value={state.value_min}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setState((s) => ({ ...s, value_min: Math.min(v, s.value_max) }));
                }}
              />
              <input
                type="range"
                min={options.value_range_m.min}
                max={options.value_range_m.max}
                value={state.value_max}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setState((s) => ({ ...s, value_max: Math.max(v, s.value_min) }));
                }}
              />
            </div>
          </label>
        </div>

        <div className="filter-grid filter-grid-3">
          <label className="filter-field filter-range">
            <span className="filter-label">
              Fim de contrato <strong className="tabular">{state.contract_min}–{state.contract_max}</strong>
            </span>
            <div className="dual-range">
              <input
                type="range"
                min={options.contract_year_range.min}
                max={options.contract_year_range.max}
                value={state.contract_min}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setState((s) => ({ ...s, contract_min: Math.min(v, s.contract_max) }));
                }}
              />
              <input
                type="range"
                min={options.contract_year_range.min}
                max={options.contract_year_range.max}
                value={state.contract_max}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setState((s) => ({ ...s, contract_max: Math.max(v, s.contract_min) }));
                }}
              />
            </div>
          </label>

          <div className="filter-field">
            <span className="filter-label">Regiões</span>
            <div className="chip-group">
              {options.nationality_regions.map((region) => (
                <button
                  key={region}
                  type="button"
                  className={`chip${state.regions.includes(region) ? " chip-active" : ""}`}
                  onClick={() => toggleRegion(region)}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <label className="filter-field">
            <span className="filter-label">Buscar jogador</span>
            <input
              type="search"
              placeholder="Nome do jogador…"
              value={state.search}
              onChange={(e) => setState((s) => ({ ...s, search: e.target.value }))}
            />
          </label>
        </div>

        <details className="filter-countries">
          <summary>Países ({selectedCountries.size} selecionados)</summary>
          <div className="chip-group chip-group-scroll">
            {nationalities.map((country) => (
              <button
                key={country}
                type="button"
                className={`chip chip-sm${selectedCountries.has(country) ? " chip-active" : ""}`}
                onClick={() => toggleCountry(country)}
              >
                {country}
              </button>
            ))}
          </div>
        </details>

        <div className="filter-actions">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Aplicando…" : "Aplicar filtros"}
          </button>
        </div>
      </form>
    </div>
  );
}

export { filtersFromRecord };
