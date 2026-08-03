"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { RangeDual } from "@/components/ui/RangeDual";
import { getMeta } from "@/lib/api";
import { mergeFilterOptions } from "@/lib/filterDefaults";
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

export function ProfileFilters({ options: initialOptions, nationalities: initialNats, current }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [options, setOptions] = useState(initialOptions);
  const [nationalities, setNationalities] = useState(initialNats);

  useEffect(() => {
    if (options.leagues.length > 1 && nationalities.length > 0) return;
    getMeta()
      .then((meta) => {
        setOptions(mergeFilterOptions(meta));
        if (meta.nationalities?.length) setNationalities(meta.nationalities);
      })
      .catch(() => { /* keep defaults */ });
  }, [options.leagues.length, nationalities.length]);

  const defaults = options.defaults;

  const [state, setState] = useState(() => ({
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

  function toFilters(): ProfileFilterState {
    return {
      player: current.player,
      search: current.search,
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
    startTransition(() => router.push(buildProfileUrl({ ...toFilters(), player: undefined })));
  }

  function clearFilters() {
    setState({
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
            Refine liga, idade, valor, contrato e nacionalidade do pool de meio-campistas.
          </span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
          Limpar filtros
        </button>
      </div>

      <form className="profile-filters-form" onSubmit={onSubmit}>
        <div className="filter-grid filter-grid-2">
          <label className="filter-field">
            <span className="filter-label">Liga</span>
            <select value={state.league} onChange={(e) => setState((s) => ({ ...s, league: e.target.value }))}>
              {options.leagues.map((l) => (
                <option key={l.key} value={l.key}>{l.label}</option>
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

        <div className="filter-grid filter-grid-age">
          <label className="filter-field">
            <span className="filter-label">Faixa etária</span>
            <select value={state.age_band} onChange={(e) => setState((s) => ({ ...s, age_band: e.target.value }))}>
              {options.age_bands.map((b) => (
                <option key={b.key} value={b.key}>{b.label}</option>
              ))}
            </select>
          </label>

          <div className="filter-field filter-range">
            <span className="filter-label">
              Ajuste fino de idade <strong className="tabular">{state.age_min}–{state.age_max}</strong>
            </span>
            <RangeDual
              min={options.age_range.min}
              max={options.age_range.max}
              values={[state.age_min, state.age_max]}
              onChange={([age_min, age_max]) => setState((s) => ({ ...s, age_min, age_max }))}
            />
          </div>
        </div>

        <div className="filter-grid filter-grid-2">
          <div className="filter-field filter-range">
            <span className="filter-label">
              Valor de mercado (€M) <strong className="tabular">{state.value_min}–{state.value_max}</strong>
            </span>
            <RangeDual
              min={options.value_range_m.min}
              max={options.value_range_m.max}
              values={[state.value_min, state.value_max]}
              onChange={([value_min, value_max]) => setState((s) => ({ ...s, value_min, value_max }))}
            />
          </div>

          <div className="filter-field filter-range">
            <span className="filter-label">
              Fim de contrato <strong className="tabular">{state.contract_min}–{state.contract_max}</strong>
            </span>
            <RangeDual
              min={options.contract_year_range.min}
              max={options.contract_year_range.max}
              values={[state.contract_min, state.contract_max]}
              onChange={([contract_min, contract_max]) => setState((s) => ({ ...s, contract_min, contract_max }))}
            />
          </div>
        </div>

        <div className="filter-field filter-nationality">
          <span className="filter-label">Nacionalidade</span>
          <div className="nationality-panel">
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
          </div>
        </div>

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
