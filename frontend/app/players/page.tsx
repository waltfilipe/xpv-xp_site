import { Suspense } from "react";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { PlayersTable } from "@/components/PlayersTable";
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

export default async function PlayersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let data = { total: 0, players: [] as Awaited<ReturnType<typeof getPlayers>>["players"] };
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
    error = e instanceof Error ? e.message : "Falha ao carregar jogadores";
  }

  return (
    <div className="container">
      <PageHero
        title="Players"
        subtitle="Jogadores das 5 grandes ligas europeias com ratings de passe e pilares por pool de posição."
        icon="fa-table-list"
      />

      <Suspense fallback={<div className="muted">Carregando filtros...</div>}>
        <PlayersFilters
          leagues={filters.leagues}
          positionGroups={filters.position_groups}
          positionFamilies={positionFamilies}
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

      <Link href="/reports" className="reports-promo-card report-screen-only">
        <span className="reports-promo-icon">
          <i className="fa-solid fa-file-lines" />
        </span>
        <span className="reports-promo-text">
          <strong>Reports</strong>
          <span className="muted">
            Relatórios PDF-ready — U23 Breakout, Blue Collar 24–30 e Experience 30+
          </span>
        </span>
        <span className="reports-promo-cta">
          Ver relatórios <i className="fa-solid fa-arrow-right" />
        </span>
      </Link>

      <PlayersTable players={data.players} positionFamily={family} />
    </div>
  );
}
