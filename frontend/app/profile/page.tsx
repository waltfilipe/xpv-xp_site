import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { ProfileFilters } from "@/components/ProfileFilters";
import { PlayerSelector } from "@/components/PlayerSelector";
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

  try {
    const meta = await getMeta();
    filterOptions = mergeFilterOptions(meta);
    nationalities = meta.nationalities ?? [];
    const res = await getPlayerOptions(filters);
    options = res.options;
  } catch {
    /* backend offline — defaults above */
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

      {options.length > 0 ? (
        <PlayerSelector options={options} currentId={playerId} filters={filters} />
      ) : (
        <p className="muted" style={{ marginBottom: "1rem" }}>
          Nenhum jogador encontrado com estes filtros.
        </p>
      )}

      {playerId ? <ProfileView playerId={playerId} /> : null}
    </div>
  );
}
