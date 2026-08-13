import type { PlayerSummary } from "@/lib/api";
import { getMeta, getPlayers } from "@/lib/api";
import { POSITION_FAMILIES } from "@/lib/positionFamilies";
import { PlayersPageShell } from "./PlayersPageShell";

type PageProps = {
  searchParams: Promise<{
    league?: string;
    position_group?: string;
    position_family?: string;
    search?: string;
  }>;
};

export default async function PlayersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let data = { total: 0, players: [] as PlayerSummary[] };
  let filters = { leagues: [] as string[], position_groups: [] as string[] };
  let error: string | null = null;

  let positionFamilies: { key: string; label: string }[] = [...POSITION_FAMILIES];

  const family = params.position_family ?? "midfielders";

  try {
    const [meta, playersRes] = await Promise.all([
      getMeta(family),
      getPlayers({
        league: params.league,
        position_group: params.position_group,
        position_family: family,
        search: params.search,
        limit: 500,
      }),
    ]);
    data = playersRes;
    filters = { leagues: meta.leagues, position_groups: meta.position_groups ?? [] };
    if (meta.position_families?.length) {
      positionFamilies = meta.position_families;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load players";
  }

  return (
    <PlayersPageShell
      players={data.players}
      total={data.total}
      positionFamily={family}
      leagues={filters.leagues}
      positionGroups={filters.position_groups}
      positionFamilies={positionFamilies}
      currentLeague={params.league}
      currentPositionGroup={params.position_group}
      currentSearch={params.search}
      error={error}
    />
  );
}
