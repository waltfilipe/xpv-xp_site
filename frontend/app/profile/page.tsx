import { Suspense } from "react";
import { ProfileFilters } from "@/components/ProfileFilters";
import { PlayerSearchRow } from "@/components/PlayerSearchRow";
import { ProfileView } from "@/components/ProfileView";
import { getMeta, getPlayerOptions } from "@/lib/api";
import { mergeFilterOptions } from "@/lib/filterDefaults";
import { filtersFromRecord } from "@/lib/profileParams";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = filtersFromRecord(params);

  let filterOptions = mergeFilterOptions();
  let nationalities: string[] = [];
  let options: { player_id: string; label: string }[] = [];

  const family = filters.position_family ?? "midfielders";

  try {
    const meta = await getMeta(family);
    filterOptions = mergeFilterOptions(meta);
    nationalities = meta.nationalities ?? [];
    const res = await getPlayerOptions(filters);
    options = res.options;
  } catch {
    /* backend offline — defaults above */
  }

  const playerId = filters.player ?? options[0]?.player_id;

  return (
    <div className="profile-page">
      <header className="profile-page-hero">
        <div className="container profile-page-hero-inner">
          <div className="profile-page-hero-copy">
            <span className="profile-page-eyebrow">Pass Scout</span>
            <h1>Player Profile</h1>
            <p>Análise completa por posição — xP, pass scores, índices e mapas de origem. Rankings dentro do pool selecionado.</p>
          </div>
        </div>
      </header>

      <div className="container profile-page-body">
        <Suspense fallback={null}>
          <ProfileFilters
            options={filterOptions}
            nationalities={nationalities}
            current={filters}
          />
        </Suspense>

        {options.length > 0 ? (
          <PlayerSearchRow options={options} currentId={playerId} filters={filters} />
        ) : (
          <p className="muted profile-empty-note">
            Nenhum jogador encontrado com estes filtros.
          </p>
        )}

        {playerId ? <ProfileView playerId={playerId} positionFamily={family} /> : null}
      </div>
    </div>
  );
}
