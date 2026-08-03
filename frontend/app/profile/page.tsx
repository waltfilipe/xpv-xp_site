import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { ProfileFilters, type FilterOptionsMeta } from "@/components/ProfileFilters";
import { PlayerSelector } from "@/components/PlayerSelector";
import { ProfileView } from "@/components/ProfileView";
import { getMeta, getPlayerOptions } from "@/lib/api";
import { filtersFromRecord } from "@/lib/profileParams";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_FILTER_OPTIONS: FilterOptionsMeta = {
  leagues: [{ key: "all", label: "All leagues" }],
  foot: [{ key: "all", label: "Todos" }],
  age_bands: [{ key: "all", label: "Todas as idades", min: null, max: null }],
  nationality_regions: ["World"],
  age_range: { min: 16, max: 42 },
  value_range_m: { min: 0, max: 150 },
  contract_year_range: { min: 2026, max: 2033 },
  defaults: {
    league: "all",
    age_band: "all",
    age_slider: [16, 42],
    foot: "all",
    value_slider_m: [0, 150],
    contract_year: [2026, 2033],
    nationality_regions: ["World"],
    nationality_countries: [],
  },
};

export default async function ProfilePage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = filtersFromRecord(params);

  let filterOptions = DEFAULT_FILTER_OPTIONS;
  let nationalities: string[] = [];
  let options: { player_id: string; label: string }[] = [];

  try {
    const meta = await getMeta();
    filterOptions = (meta.filter_options as FilterOptionsMeta) ?? DEFAULT_FILTER_OPTIONS;
    nationalities = meta.nationalities ?? [];
    const res = await getPlayerOptions(filters);
    options = res.options;
  } catch {
    /* backend offline */
  }

  const playerId = filters.player ?? options[0]?.player_id;

  return (
    <div className="container">
      <PageHero
        title="Player Profile"
        subtitle="Perfil completo com xP, pass scores e heatmap de origem dos passes."
        icon="fa-user"
      />

      <Suspense fallback={null}>
        <ProfileFilters
          options={filterOptions}
          nationalities={nationalities}
          current={filters}
        />
      </Suspense>

      {options.length > 0 && (
        <PlayerSelector options={options} currentId={playerId} filters={filters} />
      )}

      {playerId ? <ProfileView playerId={playerId} /> : <p className="muted">Nenhum jogador disponível com estes filtros.</p>}
    </div>
  );
}
