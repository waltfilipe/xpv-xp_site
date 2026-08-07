"use client";

import Link from "next/link";
import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { PlayersTable } from "@/components/PlayersTable";
import type { PlayerSummary } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import { PlayersFilters } from "./PlayersFilters";

type Props = {
  players: PlayerSummary[];
  total: number;
  positionFamily: string;
  leagues: string[];
  positionGroups: string[];
  positionFamilies: readonly { key: string; label: string }[];
  currentLeague?: string;
  currentPositionGroup?: string;
  currentSearch?: string;
  error: string | null;
};

export function PlayersPageShell({
  players,
  total,
  positionFamily,
  leagues,
  positionGroups,
  positionFamilies,
  currentLeague,
  currentPositionGroup,
  currentSearch,
  error,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="container">
      <PageHero title={t.players.title} subtitle={t.players.subtitle} icon="fa-table-list" />

      <Suspense fallback={<div className="muted">{t.players.loadingFilters}</div>}>
        <PlayersFilters
          leagues={leagues}
          positionGroups={positionGroups}
          positionFamilies={positionFamilies}
          currentLeague={currentLeague}
          currentPositionGroup={currentPositionGroup}
          currentPositionFamily={positionFamily}
          currentSearch={currentSearch}
        />
      </Suspense>

      {error && <div className="error-box">{error}</div>}

      <p className="muted" style={{ marginBottom: "0.75rem" }}>
        {t.players.playersFound(total)}
      </p>

      <Link href="/reports" className="reports-promo-card report-screen-only">
        <span className="reports-promo-icon">
          <i className="fa-solid fa-file-lines" />
        </span>
        <span className="reports-promo-text">
          <strong>{t.nav.reports}</strong>
          <span className="muted">{t.players.reportsPromo}</span>
        </span>
        <span className="reports-promo-cta">
          {t.players.viewReports} <i className="fa-solid fa-arrow-right" />
        </span>
      </Link>

      <PlayersTable players={players} positionFamily={positionFamily} />
    </div>
  );
}
