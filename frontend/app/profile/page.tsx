import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { getMeta, getPlayerOptions } from "@/lib/api";
import { PoolFilters } from "@/components/PoolFilters";
import { PlayerSelector } from "@/components/PlayerSelector";
import { ProfileView } from "@/components/ProfileView";

type Props = { searchParams: Promise<{ player?: string; league?: string; search?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  const params = await searchParams;
  let meta = { league_options: [{ key: "all", label: "All leagues" }] };
  let options: { player_id: string; label: string }[] = [];
  try {
    meta = await getMeta();
    const res = await getPlayerOptions({ league: params.league, search: params.search });
    options = res.options;
  } catch { /* backend offline */ }

  const playerId = params.player ?? options[0]?.player_id;

  return (
    <div className="container">
      <PageHero
        title="Player Profile"
        subtitle="Perfil completo com xP, pass scores e heatmap de origem dos passes."
        icon="fa-user"
      />

      <Suspense fallback={null}>
        <PoolFilters
          leagues={meta.league_options}
          currentLeague={params.league}
          currentSearch={params.search}
          actionPath="/profile"
        />
      </Suspense>

      {options.length > 0 && (
        <PlayerSelector options={options} currentId={playerId} league={params.league} search={params.search} />
      )}

      {playerId ? <ProfileView playerId={playerId} /> : <p className="muted">Nenhum jogador disponível.</p>}
    </div>
  );
}
