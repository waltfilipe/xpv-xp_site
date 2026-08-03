"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { RangeDual } from "@/components/ui/RangeDual";
import { getMeta } from "@/lib/api";
import type { FilterOptionsMeta } from "@/lib/filterTypes";
import { mergeFilterOptions } from "@/lib/filterDefaults";
import type { ProfileFilterState } from "@/lib/profileParams";
import { buildProfileUrl } from "@/lib/profileParams";

type Props = {
  options: FilterOptionsMeta;
  nationalities: string[];
  current: ProfileFilterState;
};

function formatHeightFromCm(cm: number): string {
  return (cm / 100).toFixed(2);
}

function metersToCm(m: number): number {
  return Math.round(m * 100);
}

export function ProfileFilters({ options: initialOptions, nationalities: initialNats, current }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [options, setOptions] = useState(initialOptions);
  const [nationalities, setNationalities] = useState(initialNats);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

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
    minutes_min: Number(current.minutes_min ?? defaults.minutes_slider[0]),
    minutes_max: Number(current.minutes_max ?? defaults.minutes_slider[1]),
    height_min_cm: metersToCm(Number(current.height_min ?? defaults.height_slider_m[0])),
    height_max_cm: metersToCm(Number(current.height_max ?? defaults.height_slider_m[1])),
    volume_grade: current.volume_grade ?? "all",
    efficiency_grade: current.efficiency_grade ?? "all",
    buildup_grade: current.buildup_grade ?? "all",
    chance_grade: current.chance_grade ?? "all",
    regions: (current.regions?.split(",") ?? defaults.nationality_regions).filter(Boolean),
    countries: (current.countries?.split(",") ?? defaults.nationality_countries).filter(Boolean),
  }));

  const selectedCountries = useMemo(() => new Set(state.countries), [state.countries]);

  const countrySummary = state.countries.length
    ? `${state.countries.length} selecionada${state.countries.length > 1 ? "s" : ""}`
    : "Selecionar países";

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
      minutes_min: state.minutes_min > defaults.minutes_slider[0] ? String(state.minutes_min) : undefined,
      minutes_max: state.minutes_max < defaults.minutes_slider[1] ? String(state.minutes_max) : undefined,
      height_min: state.height_min_cm > metersToCm(defaults.height_slider_m[0])
        ? formatHeightFromCm(state.height_min_cm)
        : undefined,
      height_max: state.height_max_cm < metersToCm(defaults.height_slider_m[1])
        ? formatHeightFromCm(state.height_max_cm)
        : undefined,
      volume_grade: state.volume_grade !== "all" ? state.volume_grade : undefined,
      efficiency_grade: state.efficiency_grade !== "all" ? state.efficiency_grade : undefined,
      buildup_grade: state.buildup_grade !== "all" ? state.buildup_grade : undefined,
      chance_grade: state.chance_grade !== "all" ? state.chance_grade : undefined,
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
      minutes_min: defaults.minutes_slider[0],
      minutes_max: defaults.minutes_slider[1],
      height_min_cm: metersToCm(defaults.height_slider_m[0]),
      height_max_cm: metersToCm(defaults.height_slider_m[1]),
      volume_grade: "all",
      efficiency_grade: "all",
      buildup_grade: "all",
      chance_grade: "all",
      regions: [...defaults.nationality_regions],
      countries: [...defaults.nationality_countries],
    });
    setCountriesOpen(false);
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
    <div className={`filter-card profile-filters${filtersOpen ? " profile-filters-open" : " profile-filters-collapsed"}`}>
      <div className="filter-panel-header">
        <button
          type="button"
          className="filter-panel-toggle"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
        >
          <div className="filter-head">
            <span className="filter-title">
              <i className="fa-solid fa-sliders" /> Filtros do grupo
            </span>
            <span className="filter-sub">
              Refine liga, idade, valor, contrato, minutos, altura, pass scores e nacionalidade.
            </span>
          </div>
          <i className={`fa-solid fa-chevron-${filtersOpen ? "up" : "down"} filter-panel-chevron`} />
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
          Limpar filtros
        </button>
      </div>

      {filtersOpen && (
      <form className="profile-filters-form" onSubmit={onSubmit}>
        <div className="filter-section">
          <h4 className="filter-section-title">Perfil</h4>
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

          <div className="filter-field filter-range filter-range-compact">
            <span className="filter-label filter-label-strong">
              Idade <strong className="tabular">{state.age_min}–{state.age_max}</strong>
            </span>
            <RangeDual
              className="range-dual-xs"
              min={options.age_range.min}
              max={options.age_range.max}
              values={[state.age_min, state.age_max]}
              onChange={([age_min, age_max]) => setState((s) => ({ ...s, age_min, age_max }))}
            />
          </div>
        </div>
        </div>

        <div className="filter-section">
          <h4 className="filter-section-title">Mercado &amp; físico</h4>
        <div className="filter-grid filter-grid-2">
          <div className="filter-field filter-range filter-range-compact">
            <span className="filter-label filter-label-strong">
              Valor (€M) <strong className="tabular">{state.value_min}–{state.value_max}</strong>
            </span>
            <RangeDual
              className="range-dual-xs"
              min={options.value_range_m.min}
              max={options.value_range_m.max}
              values={[state.value_min, state.value_max]}
              onChange={([value_min, value_max]) => setState((s) => ({ ...s, value_min, value_max }))}
            />
          </div>

          <div className="filter-field filter-range filter-range-compact">
            <span className="filter-label filter-label-strong">
              Contrato <strong className="tabular">{state.contract_min}–{state.contract_max}</strong>
            </span>
            <RangeDual
              className="range-dual-xs"
              min={options.contract_year_range.min}
              max={options.contract_year_range.max}
              values={[state.contract_min, state.contract_max]}
              onChange={([contract_min, contract_max]) => setState((s) => ({ ...s, contract_min, contract_max }))}
            />
          </div>
        </div>

        <div className="filter-grid filter-grid-2">
          <div className="filter-field filter-range filter-range-compact">
            <span className="filter-label filter-label-strong">
              Minutos <strong className="tabular">{state.minutes_min}–{state.minutes_max}</strong>
            </span>
            <RangeDual
              className="range-dual-xs"
              min={options.minutes_range.min}
              max={options.minutes_range.max}
              step={90}
              values={[state.minutes_min, state.minutes_max]}
              onChange={([minutes_min, minutes_max]) => setState((s) => ({ ...s, minutes_min, minutes_max }))}
            />
          </div>

          <div className="filter-field filter-range filter-range-compact">
            <span className="filter-label filter-label-strong">
              Altura (m) <strong className="tabular">{formatHeightFromCm(state.height_min_cm)}–{formatHeightFromCm(state.height_max_cm)}</strong>
            </span>
            <RangeDual
              className="range-dual-xs"
              min={metersToCm(options.height_range_m.min)}
              max={metersToCm(options.height_range_m.max)}
              step={1}
              values={[state.height_min_cm, state.height_max_cm]}
              onChange={([height_min_cm, height_max_cm]) => setState((s) => ({ ...s, height_min_cm, height_max_cm }))}
            />
          </div>
        </div>
        </div>

        <div className="filter-section">
          <h4 className="filter-section-title">Pass scores (nota mínima)</h4>
        <div className="filter-grid filter-grid-pass-grades">
          {options.pass_score_filters.map((filter) => {
            const key = filter.key as "volume_grade" | "efficiency_grade" | "buildup_grade" | "chance_grade";
            return (
              <label key={filter.key} className="filter-field">
                <span className="filter-label filter-label-strong">{filter.label}</span>
                <select
                  value={state[key]}
                  onChange={(e) => setState((s) => ({ ...s, [key]: e.target.value }))}
                >
                  {options.letter_grades.map((grade) => (
                    <option key={grade.key} value={grade.key}>{grade.label}</option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
        </div>

        <div className="filter-section">
          <h4 className="filter-section-title">Nacionalidade</h4>
        <div className="filter-field filter-nationality">
          <span className="filter-label filter-label-strong">Região e países</span>
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

            <div className="nationality-countries-box">
              <button
                type="button"
                className="nationality-countries-toggle"
                onClick={() => setCountriesOpen((o) => !o)}
                aria-expanded={countriesOpen}
              >
                <span>{countrySummary}</span>
                <i className={`fa-solid fa-chevron-${countriesOpen ? "up" : "down"}`} />
              </button>

              {countriesOpen && (
                <div className="nationality-countries-panel">
                  {state.countries.length > 0 && (
                    <div className="nationality-selected-chips">
                      {state.countries.map((country) => (
                        <button
                          key={country}
                          type="button"
                          className="chip chip-sm chip-active"
                          onClick={() => toggleCountry(country)}
                        >
                          {country} <i className="fa-solid fa-xmark" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="chip-group chip-group-scroll nationality-countries-list">
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
              )}
            </div>
          </div>
        </div>
        </div>

        <div className="filter-actions">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Aplicando…" : "Aplicar filtros"}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
