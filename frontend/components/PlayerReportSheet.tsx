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

type ReportMapSlot = {
  key: string;
  label: string;
  pass_map_b64?: string | null;
  loading?: boolean;
  error?: string | null;
};

const REPORT_MAP_FILTERS: { key: string; label: string }[] = [
  { key: "progressive", label: "Progressive Passes" },
  { key: "test_impact_v2", label: "Impact Passes" },
  { key: "long_passes", label: "Long Passes" },
  { key: "line_break", label: "Break line passes" },
];

function FactIcon({ icon }: { icon: string }) {
  return (
    <span className="identity-fact-icon" aria-hidden="true">
      <i className={`fa-solid ${icon}`} />
    </span>
  );
}

function minutesGradientStyle(pct: number | null | undefined): React.CSSProperties | undefined {
  if (pct == null || Number.isNaN(pct)) return undefined;
  const clamped = Math.max(0, Math.min(1, pct));
  const hue = clamped * 120;
  const color = `hsl(${hue}, 62%, 48%)`;
  return {
    "--minutes-pct": `${(clamped * 100).toFixed(0)}%`,
    borderColor: `${color}55`,
    background: `linear-gradient(135deg, ${color}18 0%, rgba(15, 23, 42, 0.55) 55%)`,
    boxShadow: `inset 0 0 0 1px ${color}22`,
  } as React.CSSProperties;
}

type Props = {
  entry: EnrichedReportPlayer;
  profile: PlayerProfile;
  maps: PlayerReportMaps | null;
  onMapsLoaded?: (maps: PlayerReportMaps) => void;
};

export function PlayerReportSheet({ entry, profile, maps: initialMaps, onMapsLoaded }: Props) {
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [mapSlots, setMapSlots] = useState<ReportMapSlot[]>(
    REPORT_MAP_FILTERS.map((f) => ({ key: f.key, label: f.label })),
  );
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const p = profile.player;
  const category = entry.category;
  const displayName = String(p.player_name ?? "—");
  const playerId = entry.playerId;
  const accent = category.accent;
  const minutesPct = p.minutes_pct != null ? Number(p.minutes_pct) : null;
  const categoryIndex = entry.categoryIndex;

  useEffect(() => {
    if (activePage !== 2) return;

    let cancelled = false;
    setMapsLoading(true);
    setMapsError(null);
    setMapSlots(REPORT_MAP_FILTERS.map((f) => ({ key: f.key, label: f.label, loading: true })));

    (async () => {
      const family = entry.positionFamily ?? "midfielders";
      let firstLoaded: PlayerReportMaps | null = initialMaps;

      for (const filter of REPORT_MAP_FILTERS) {
        if (cancelled) return;

        try {
          const res = await getPassMap(playerId, filter.key, "all", family);
          if (cancelled) return;

          const loaded = {
            pass_map_b64: res.pass_map_b64,
            dest_map_b64: res.dest_map_b64,
            caption: res.caption,
          };

          if (!firstLoaded?.pass_map_b64 && loaded.pass_map_b64) {
            firstLoaded = loaded;
            onMapsLoaded?.(loaded);
          }

          setMapSlots((prev) =>
            prev.map((slot) =>
              slot.key === filter.key
                ? { ...slot, pass_map_b64: res.pass_map_b64, loading: false, error: null }
                : slot,
            ),
          );
        } catch (e) {
          if (cancelled) return;
          const msg = e instanceof Error ? e.message : "Falha ao carregar";
          setMapSlots((prev) =>
            prev.map((slot) =>
              slot.key === filter.key ? { ...slot, loading: false, error: msg } : slot,
            ),
          );
        }
      }

      if (!cancelled) setMapsLoading(false);
    })().catch((e) => {
      if (!cancelled) {
        setMapsError(e instanceof Error ? e.message : "Falha ao carregar mapas");
        setMapsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activePage, playerId, entry.positionFamily, onMapsLoaded, initialMaps]);

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
              priority={categoryIndex <= 3}
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
        <div
          className="identity-meta-pill identity-meta-pill-minutes"
          style={minutesGradientStyle(minutesPct)}
          title={
            minutesPct != null
              ? `${(minutesPct * 100).toFixed(0)}% dos minutos possíveis na temporada`
              : undefined
          }
        >
          <span><FactIcon icon="fa-clock" /> Minutos</span>
          <strong className="tabular">{p.minutes != null ? String(p.minutes) : "—"}</strong>
          {minutesPct != null && (
            <span className="identity-minutes-pct tabular">
              {(minutesPct * 100).toFixed(0)}%
            </span>
          )}
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

  const loadedMaps = mapSlots.filter((s) => s.pass_map_b64);
  const anyLoading = mapSlots.some((s) => s.loading);

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
              {String(categoryIndex).padStart(2, "0")}
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
              <ReportPassScoreAccordion sections={profile.pass_scores} />
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
            <span className="report-sheet-group">4 map types</span>
            <span className="report-sheet-page-label report-print-only">Página 2 · Maps</span>
            <span className="report-sheet-index tabular">
              {String(categoryIndex).padStart(2, "0")}
            </span>
          </div>
        </header>

        <div className="report-maps-layout">
          <div className="report-maps-identity">{identityBlock}</div>

          <div className="report-maps-body">
            {mapsLoading && loadedMaps.length === 0 && (
              <LoadingState message="Gerando mapas do jogador…" />
            )}
            {mapsError && <p className="error-box">{mapsError}</p>}

            <div className="report-maps-grid report-maps-grid-4">
              {mapSlots.map((slot) => (
                <div key={slot.key} className="report-map-card">
                  <h4 className="section-label-sm">{slot.label}</h4>
                  {slot.loading && !slot.pass_map_b64 && (
                    <div className="report-map-skeleton" aria-busy="true">
                      <span className="report-map-skeleton-pulse" />
                    </div>
                  )}
                  {slot.error && !slot.pass_map_b64 && (
                    <p className="placeholder-note report-map-error">{slot.error}</p>
                  )}
                  {slot.pass_map_b64 && (
                    <img
                      src={`data:image/png;base64,${slot.pass_map_b64}`}
                      alt={slot.label}
                      className="report-map-img"
                    />
                  )}
                  {!slot.loading && !slot.error && !slot.pass_map_b64 && activePage === 2 && (
                    <p className="placeholder-note">Indisponível</p>
                  )}
                </div>
              ))}
            </div>

            {anyLoading && loadedMaps.length > 0 && (
              <p className="muted report-maps-loading-hint">
                Carregando mapas restantes… ({loadedMaps.length}/{REPORT_MAP_FILTERS.length})
              </p>
            )}
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
