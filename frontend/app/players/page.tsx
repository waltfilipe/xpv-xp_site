import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { POSITION_FAMILIES } from "@/lib/positionFamilies";
import { getMeta, getPlayers } from "@/lib/api";
import { PlayersFilters } from "./PlayersFilters";

type PageProps = {
  searchParams: Promise<{
    league?: string;
    position_group?: string;
    position_family?: string;
    search?: string;
  }>;
};

function formatRating(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toFixed(1);
}

export default async function PlayersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let data = { total: 0, players: [] as Awaited<ReturnType<typeof getPlayers>>["players"] };
  let filters = { leagues: [] as string[], position_groups: [] as string[] };
  let error: string | null = null;

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
  } catch (e) {
    error = e instanceof Error ? e.message : "Falha ao carregar jogadores";
  }

  return (
    <div className="container">
      <PageHero
        title="Players"
        subtitle="Jogadores das 5 grandes ligas europeias com ratings de passe e progressão por pool de posição."
        icon="fa-table-list"
      />

      <Suspense fallback={<div className="muted">Carregando filtros...</div>}>
        <PlayersFilters
          leagues={filters.leagues}
          positionGroups={filters.position_groups}
          positionFamilies={POSITION_FAMILIES}
          currentLeague={params.league}
          currentPositionGroup={params.position_group}
          currentPositionFamily={family}
          currentSearch={params.search}
        />
      </Suspense>

      {error && <div className="error-box">{error}</div>}

      <p className="muted" style={{ marginBottom: "0.75rem" }}>
        {data.total} jogador{data.total !== 1 ? "es" : ""} encontrado{data.total !== 1 ? "s" : ""}
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Jogador</th>
              <th>Liga</th>
              <th>Posição</th>
              <th>Idade</th>
              <th>Pass Rating</th>
              <th>Progressão</th>
              <th>Passes</th>
              <th>xT/Pass</th>
            </tr>
          </thead>
          <tbody>
            {data.players.map((player) => (
              <tr key={player.player_id}>
                <td>
                  <div className="player-cell">
                    {player.photo_url ? (
                      <Image
                        src={player.photo_url}
                        alt=""
                        width={36}
                        height={36}
                        className="player-avatar"
                        unoptimized
                      />
                    ) : (
                      <div className="player-avatar" />
                    )}
                    <div>
                      <Link href={`/profile?player=${player.player_id}&position_family=${family}`}>{player.player_name}</Link>
                      <div className="muted" style={{ fontSize: "0.8rem" }}>
                        {player.nationality ?? "—"}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge">{player.league_source ?? player.league ?? "—"}</span>
                </td>
                <td>{player.position_group ?? player.position ?? "—"}</td>
                <td>{player.age ?? "—"}</td>
                <td>
                  <span className="rating">{formatRating(player.pass_rating)}</span>
                  {player.pass_rating_rank != null && (
                    <span className="muted" style={{ fontSize: "0.75rem", marginLeft: "0.35rem" }}>
                      #{player.pass_rating_rank}
                    </span>
                  )}
                </td>
                <td>
                  <span className="rating">{formatRating(player.progression_rating)}</span>
                </td>
                <td>{player.total_passes?.toLocaleString() ?? "—"}</td>
                <td>{player.xt_per_pass != null ? player.xt_per_pass.toFixed(4) : "—"}</td>
              </tr>
            ))}
            {data.players.length === 0 && !error && (
              <tr>
                <td colSpan={8} className="muted" style={{ textAlign: "center", padding: "2rem" }}>
                  Nenhum jogador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
