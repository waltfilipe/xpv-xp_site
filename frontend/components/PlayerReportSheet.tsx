"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PassGradePanel } from "@/components/PassGradePanel";
import { ReportPassScoreAccordion } from "@/components/ReportPassScoreAccordion";
import { ReportXpPanel } from "@/components/ReportXpPanel";
import { LoadingState } from "@/components/LoadingState";
import { getPassMap, type PlayerProfile } from "@/lib/api";
import type { EnrichedReportPlayer } from "@/lib/playerReports";
import { formatContractUntil } from "@/lib/formatters";

export type PlayerReportMaps = {
  pass_map_b64?: string | null;
  dest_map_b64?: string | null;
  caption?: string;
};

function FactIcon({ icon }: { icon: string }) {
  return (
    <span className="identity-fact-icon" aria-hidden="true">
      <i className={`fa-solid ${icon}`} />
    </span>
  );
}

type Props = {
  entry: EnrichedReportPlayer;
  profile: PlayerProfile;
  maps: PlayerReportMaps | null;
  index: number;
  onMapsLoaded?: (maps: PlayerReportMaps) => void;
};

export function PlayerReportSheet({ entry, profile, maps: initialMaps, index, onMapsLoaded }: Props) {
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [maps, setMaps] = useState<PlayerReportMaps | null>(initialMaps);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const p = profile.player;
  const category = entry.category;
  const displayName = String(p.player_name ?? "—");
  const playerId = entry.playerId;
  const accent = category.accent;

  useEffect(() => {
    if (activePage !== 2 || maps || mapsLoading) return;

    let cancelled = false;
    setMapsLoading(true);
    setMapsError(null);

    getPassMap(playerId, "progressive", "all", entry.positionFamily ?? "midfielders")
      .then((res) => {
        if (cancelled) return;
        const loaded = {
          pass_map_b64: res.pass_map_b64,
          dest_map_b64: res.dest_map_b64,
          caption: res.caption,
        };
        setMaps(loaded);
        onMapsLoaded?.(loaded);
      })
      .catch((e) => {
        if (cancelled) return;
        setMapsError(e instanceof Error ? e.message : "Falha ao carregar mapas");
      })
      .finally(() => {
        if (!cancelled) setMapsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activePage, maps, mapsLoading, playerId, entry.positionFamily, onMapsLoaded]);

  const identityBlock = (
    <div className="player-card identity-card report-identity-card">
      <div className="identity-hero identity-hero-side">
        <div className="identity-photo-side">
          {p.photo_url ? (
            <Image
              src={String(p.photo_url)}
              alt=""
              fill
              className="identity-photo"
              unoptimized
              priority={index < 3}
              sizes="160px"
            />
          ) : (
            <div className="identity-photo-placeholder identity-photo-placeholder-side">
              {displayName.charAt(0)}
            </div>
          )}
        </div>

        <div className="identity-hero-text">
          <h3 className="identity-title report-player-name">
            {displayName}
            {entry.note && <span className="report-player-note">{entry.note}</span>}
          </h3>
          <p className="identity-subline">
            {String(p.team ?? "—")} · {String(p.position ?? "—")}
          </p>
          <p className="report-league-line muted">
            {String(p.league_source ?? p.league ?? "—")}
          </p>

          <div className="identity-facts identity-facts-side">
            <div className="identity-fact">
              <FactIcon icon="fa-cake-candles" />
              <span className="identity-fact-label">Idade</span>
              <span className="identity-fact-value tabular">
                {p.age != null ? String(p.age) : "—"}
              </span>
            </div>
            <div className="identity-fact">
              <FactIcon icon="fa-ruler-vertical" />
              <span className="identity-fact-label">Altura</span>
              <span className="identity-fact-value">{String(p.height ?? "—")}</span>
            </div>
            <div className="identity-fact">
              <FactIcon icon="fa-earth-americas" />
              <span className="identity-fact-label">Nacionalidade</span>
              <span className="identity-fact-value">{String(p.nationality ?? "—")}</span>
            </div>
            <div className="identity-fact">
              <FactIcon icon="fa-shoe-prints" />
              <span className="identity-fact-label">Pé</span>
              <span className="identity-fact-value">{String(p.dominant_foot ?? "—")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="identity-meta-row">
        <div className="identity-meta-pill">
          <span><FactIcon icon="fa-coins" /> Valor</span>
          <strong>{String(p.market_value ?? "—")}</strong>
        </div>
        <div className="identity-meta-pill">
          <span><FactIcon icon="fa-calendar-days" /> Contrato</span>
          <strong>{formatContractUntil(p.contract_until)}</strong>
        </div>
        <div className="identity-meta-pill">
          <span><FactIcon icon="fa-clock" /> Minutos</span>
          <strong className="tabular">{p.minutes != null ? String(p.minutes) : "—"}</strong>
        </div>
      </div>

      {profile.origin_heatmap_b64 && (
        <img
          src={`data:image/png;base64,${profile.origin_heatmap_b64}`}
          alt="Origem dos passes"
          className="heatmap-img report-heatmap"
        />
      )}

      <div className="report-card-actions report-screen-only">
        {activePage === 1 ? (
          <button
            type="button"
            className="report-card-maps-btn"
            style={{ borderColor: `${accent}44`, color: accent }}
            onClick={() => setActivePage(2)}
          >
            <i className="fa-solid fa-map-location-dot" />
            <span>Ver mapas</span>
            <i className="fa-solid fa-arrow-right report-card-maps-arrow" />
          </button>
        ) : (
          <button
            type="button"
            className="report-card-maps-btn report-card-maps-btn-back"
            onClick={() => setActivePage(1)}
          >
            <i className="fa-solid fa-arrow-left" />
            <span>Voltar ao overview</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="player-report-bundle"
      data-category={category.id}
      data-player-id={playerId}
      id={`report-${playerId}`}
    >
      <section
        className={`player-report-sheet report-page-1${activePage === 2 ? " report-page-screen-hidden" : ""}`}
      >
        <header className="report-sheet-header">
          <div className="report-sheet-brand">
            <span className="brand-icon report-brand-icon">
              <i className="fa-solid fa-futbol" />
            </span>
            <div>
              <span className="report-sheet-eyebrow">Pass Scout · Midfielder Report</span>
              <h2 className="report-sheet-category" style={{ color: accent }}>
                {category.title}
              </h2>
            </div>
          </div>
          <div className="report-sheet-meta">
            {entry.groupLabel && (
              <span className="report-sheet-group">{entry.groupLabel}</span>
            )}
            <span className="report-sheet-page-label report-print-only">Página 1 · Overview</span>
            <span className="report-sheet-index tabular">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        </header>

        <p className="report-sheet-description">{category.description}</p>

        <div className="report-sheet-body pa-layout report-layout-v2">
          <div className="pa-col pa-col-identity">{identityBlock}</div>

          <div className="pa-col pa-col-score">
            <div className="score-stack">
              <PassGradePanel rating={profile.xp_pass_rating} />
              <ReportXpPanel profile={profile} accent={accent} />
            </div>
          </div>

          <div className="pa-col pa-col-pillars">
            <div className="player-card pillars-card report-pillars-card">
              <h3 className="section-label">Pass Scores</h3>
              <ReportPassScoreAccordion sections={profile.pass_scores} accent={accent} />
            </div>
          </div>
        </div>

        <footer className="report-sheet-footer">
          <span>
            <strong>Pass Scout</strong> · European pass analytics
          </span>
          <span className="report-sheet-footer-right">
            <Link
              href={`/profile?player=${playerId}&position_family=midfielders`}
              className="report-screen-only"
            >
              Perfil completo
            </Link>
            <span className="report-print-only tabular">
              {displayName} · {category.subtitle}
            </span>
          </span>
        </footer>
      </section>

      <section
        className={`player-report-sheet report-page-2${activePage === 1 ? " report-page-screen-hidden" : ""}`}
      >
        <header className="report-sheet-header">
          <div className="report-sheet-brand">
            <span className="brand-icon report-brand-icon">
              <i className="fa-solid fa-map-location-dot" />
            </span>
            <div>
              <span className="report-sheet-eyebrow">Pass Scout · Pass Maps</span>
              <h2 className="report-sheet-category" style={{ color: accent }}>
                {displayName}
              </h2>
            </div>
          </div>
          <div className="report-sheet-meta">
            <span className="report-sheet-group">Progressive passes</span>
            <span className="report-sheet-page-label report-print-only">Página 2 · Maps</span>
          </div>
        </header>

        <div className="report-maps-layout">
          <div className="report-maps-identity">{identityBlock}</div>

          <div className="report-maps-body">
            {mapsLoading && <LoadingState message="Gerando mapas do jogador…" />}
            {!mapsLoading && mapsError && <p className="error-box">{mapsError}</p>}
            {!mapsLoading && !mapsError && (maps?.pass_map_b64 || maps?.dest_map_b64) ? (
              <div className="report-maps-grid">
                {maps.pass_map_b64 && (
                  <div className="report-map-card">
                    <h4 className="section-label-sm">Pass map</h4>
                    <img
                      src={`data:image/png;base64,${maps.pass_map_b64}`}
                      alt="Pass map"
                      className="report-map-img"
                    />
                  </div>
                )}
                {maps.dest_map_b64 && (
                  <div className="report-map-card">
                    <h4 className="section-label-sm">Destination heatmap</h4>
                    <img
                      src={`data:image/png;base64,${maps.dest_map_b64}`}
                      alt="Destination heatmap"
                      className="report-map-img"
                    />
                  </div>
                )}
              </div>
            ) : null}
            {!mapsLoading && !mapsError && !maps?.pass_map_b64 && !maps?.dest_map_b64 && activePage === 2 && (
              <p className="placeholder-note">Mapas indisponíveis para este jogador.</p>
            )}
            {maps?.caption && <p className="muted report-maps-caption">{maps.caption}</p>}
          </div>
        </div>

        <footer className="report-sheet-footer">
          <span>
            <strong>Pass Scout</strong> · Pass maps · {displayName}
          </span>
          <span className="report-sheet-footer-right">
            <Link
              href={`/maps?player=${playerId}`}
              className="report-screen-only"
            >
              Abrir no Maps
            </Link>
            <span className="report-print-only tabular">{displayName} · Maps</span>
          </span>
        </footer>
      </section>
    </div>
  );
}
