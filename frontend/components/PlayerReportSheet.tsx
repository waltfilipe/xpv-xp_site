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
import { useI18n } from "@/lib/i18n/context";
import { getReportMapFilters, translateReportCategory, translateReportGroupLabel } from "@/lib/i18n/localize";

export type PlayerReportMaps = {
  pass_map_b64?: string | null;
  dest_map_b64?: string | null;
  caption?: string;
};

export type ReportMapSlot = {
  key: string;
  label: string;
  pass_map_b64?: string | null;
  loading?: boolean;
  error?: string | null;
};

/** @deprecated Use getReportMapFilters from @/lib/i18n/localize */
export const REPORT_MAP_FILTERS = [
  { key: "progressive", label: "Progressive Passes" },
  { key: "test_impact_v2", label: "Impact Passes" },
  { key: "long_passes", label: "Long Passes" },
  { key: "line_break", label: "Break line passes" },
] as const;

function FactIcon({ icon }: { icon: string }) {
  return (
    <span className="identity-fact-icon" aria-hidden="true">
      <i className={`fa-solid ${icon}`} />
    </span>
  );
}

function minutesPillStyle(pct: number | null | undefined): React.CSSProperties | undefined {
  if (pct == null || Number.isNaN(pct)) return undefined;
  const clamped = Math.max(0, Math.min(1, pct));
  const hue = clamped * 120;
  const color = `hsla(${hue}, 42%, 40%, 0.72)`;
  return {
    "--minutes-ring": color,
  } as React.CSSProperties;
}

type Props = {
  entry: EnrichedReportPlayer;
  profile: PlayerProfile;
  maps: PlayerReportMaps | null;
  mapSlots?: ReportMapSlot[] | null;
  expandAll?: boolean;
  preloadMaps?: boolean;
  onMapsLoaded?: (maps: PlayerReportMaps, slots: ReportMapSlot[]) => void;
  onExportPdf?: (playerId: string) => void;
  exportDisabled?: boolean;
};

export function PlayerReportSheet({
  entry,
  profile,
  maps: initialMaps,
  mapSlots: externalSlots,
  expandAll = false,
  preloadMaps = false,
  onMapsLoaded,
  onExportPdf,
  exportDisabled = false,
}: Props) {
  const { t } = useI18n();
  const mapFilters = getReportMapFilters(t);
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [localSlots, setLocalSlots] = useState<ReportMapSlot[]>(
    mapFilters.map((f) => ({ key: f.key, label: f.label })),
  );
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);

  const mapSlots = externalSlots ?? localSlots;
  const setMapSlots = externalSlots ? () => {} : setLocalSlots;

  const p = profile.player;
  const category = entry.category;
  const categoryTitle = translateReportCategory(category.id, "title", t, category.title);
  const categorySubtitle = translateReportCategory(category.id, "subtitle", t, category.subtitle);
  const categoryDescription = translateReportCategory(category.id, "description", t, category.description);
  const groupLabel = translateReportGroupLabel(entry.groupLabel, t);
  const displayName = String(p.player_name ?? "—");
  const playerId = entry.playerId;
  const accent = category.accent;
  const minutesPct = p.minutes_pct != null ? Number(p.minutes_pct) : null;
  const categoryIndex = entry.categoryIndex;
  const shouldLoadMaps = activePage === 2 || preloadMaps;

  useEffect(() => {
    if (!shouldLoadMaps) return;
    if (mapSlots.length > 0 && mapSlots.every((s) => s.pass_map_b64 || s.error)) return;
    if (externalSlots?.every((s) => s.pass_map_b64 || s.error)) return;

    let cancelled = false;
    setMapsLoading(true);
    setMapsError(null);
    setMapSlots(mapFilters.map((f) => {
      const existing = mapSlots.find((s) => s.key === f.key);
      return existing?.pass_map_b64
        ? { ...existing, loading: false }
        : { key: f.key, label: f.label, loading: true };
    }));

    (async () => {
      const family = entry.positionFamily ?? "midfielders";
      let firstLoaded: PlayerReportMaps | null = initialMaps;
      const nextSlots: ReportMapSlot[] = [...mapSlots];

      for (const filter of mapFilters) {
        if (cancelled) return;
        const existing = nextSlots.find((s) => s.key === filter.key);
        if (existing?.pass_map_b64) continue;

        try {
          const res = await getPassMap(playerId, filter.key, "all", family);
          if (cancelled) return;

          const idx = nextSlots.findIndex((s) => s.key === filter.key);
          const slot: ReportMapSlot = {
            key: filter.key,
            label: filter.label,
            pass_map_b64: res.pass_map_b64,
            loading: false,
            error: null,
          };
          if (idx >= 0) nextSlots[idx] = slot;
          else nextSlots.push(slot);

          const loaded = {
            pass_map_b64: res.pass_map_b64,
            dest_map_b64: res.dest_map_b64,
            caption: res.caption,
          };
          if (!firstLoaded?.pass_map_b64 && loaded.pass_map_b64) {
            firstLoaded = loaded;
          }

          setMapSlots([...nextSlots]);
        } catch (e) {
          if (cancelled) return;
          const msg = e instanceof Error ? e.message : t.reports.mapLoadFailed;
          const idx = nextSlots.findIndex((s) => s.key === filter.key);
          if (idx >= 0) nextSlots[idx] = { ...nextSlots[idx], loading: false, error: msg };
          setMapSlots([...nextSlots]);
        }
      }

      if (!cancelled) {
        setMapsLoading(false);
        const primary = nextSlots.find((s) => s.pass_map_b64);
        if (primary?.pass_map_b64) {
          onMapsLoaded?.(
            { pass_map_b64: primary.pass_map_b64 },
            nextSlots,
          );
        }
      }
    })().catch((e) => {
      if (!cancelled) {
        setMapsError(e instanceof Error ? e.message : t.reports.mapLoadFailedMaps);
        setMapsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoadMaps, playerId, entry.positionFamily]);

  const renderIdentity = (compact = false) => (
    <div className={`player-card identity-card report-identity-card${compact ? " report-identity-compact" : ""}`}>
      <div className={`identity-hero identity-hero-side${compact ? " identity-hero-compact" : ""}`}>
        <div className="identity-photo-side">
          {p.photo_url ? (
            <Image
              src={String(p.photo_url)}
              alt=""
              fill
              className="identity-photo"
              unoptimized
              priority={categoryIndex <= 3}
              sizes={compact ? "72px" : "160px"}
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
          {!compact && (
            <p className="report-league-line muted">
              {String(p.league_source ?? p.league ?? "—")}
            </p>
          )}

          {!compact && (
            <div className="identity-facts identity-facts-side">
              <div className="identity-fact">
                <FactIcon icon="fa-cake-candles" />
                <span className="identity-fact-label">{t.common.age}</span>
                <span className="identity-fact-value tabular">
                  {p.age != null ? String(p.age) : "—"}
                </span>
              </div>
              <div className="identity-fact">
                <FactIcon icon="fa-ruler-vertical" />
                <span className="identity-fact-label">{t.common.height}</span>
                <span className="identity-fact-value">{String(p.height ?? "—")}</span>
              </div>
              <div className="identity-fact">
                <FactIcon icon="fa-earth-americas" />
                <span className="identity-fact-label">{t.common.nationality}</span>
                <span className="identity-fact-value">{String(p.nationality ?? "—")}</span>
              </div>
              <div className="identity-fact">
                <FactIcon icon="fa-shoe-prints" />
                <span className="identity-fact-label">{t.common.foot}</span>
                <span className="identity-fact-value">{String(p.dominant_foot ?? "—")}</span>
              </div>
            </div>
          )}

          {compact && (
            <div className="identity-facts identity-facts-compact">
              <span className="identity-fact-inline tabular">
                {p.age != null ? t.reports.yearsOld(Number(p.age)) : "—"}
              </span>
              <span className="identity-fact-inline">{String(p.league_source ?? p.league ?? "—")}</span>
            </div>
          )}
        </div>
      </div>

      <div className={`identity-meta-row${compact ? " identity-meta-row-compact" : ""}`}>
        {!compact && (
          <>
            <div className="identity-meta-pill">
              <span><FactIcon icon="fa-coins" /> {t.common.value}</span>
              <strong>{String(p.market_value ?? "—")}</strong>
            </div>
            <div className="identity-meta-pill">
              <span><FactIcon icon="fa-calendar-days" /> {t.common.contract}</span>
              <strong>{formatContractUntil(p.contract_until)}</strong>
            </div>
          </>
        )}
        <div
          className="identity-meta-pill identity-meta-pill-minutes"
          style={minutesPillStyle(minutesPct)}
          title={
            minutesPct != null
              ? t.reports.minutesPct(Number((minutesPct * 100).toFixed(0)))
              : undefined
          }
        >
          <span><FactIcon icon="fa-clock" /> {t.common.minutes}</span>
          <strong className="tabular">{p.minutes != null ? String(p.minutes) : "—"}</strong>
        </div>
      </div>

      {!compact && profile.origin_heatmap_b64 && (
        <img
          src={`data:image/png;base64,${profile.origin_heatmap_b64}`}
          alt={t.profile.passOriginAlt}
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
            <span>{t.reports.viewMaps}</span>
            <i className="fa-solid fa-arrow-right report-card-maps-arrow" />
          </button>
        ) : (
          <button
            type="button"
            className="report-card-maps-btn report-card-maps-btn-back"
            onClick={() => setActivePage(1)}
          >
            <i className="fa-solid fa-arrow-left" />
            <span>{t.reports.backToProfile}</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderMapsStrip = () => (
    <div className="report-maps-player-strip">
      <div className="report-maps-strip-photo">
        {p.photo_url ? (
          <Image
            src={String(p.photo_url)}
            alt=""
            width={48}
            height={48}
            className="report-maps-strip-img"
            unoptimized
          />
        ) : (
          <div className="report-maps-strip-placeholder">{displayName.charAt(0)}</div>
        )}
      </div>
      <div className="report-maps-strip-main">
        <strong className="report-maps-strip-name">{displayName}</strong>
        <span className="report-maps-strip-meta">
          {String(p.team ?? "—")} · {String(p.position ?? "—")}
          {p.age != null ? ` · ${t.reports.yearsOld(Number(p.age))}` : ""}
        </span>
        <span className="report-maps-strip-league muted">
          {String(p.league_source ?? p.league ?? "—")}
        </span>
      </div>
      <div
        className="identity-meta-pill identity-meta-pill-minutes report-maps-strip-minutes"
        style={minutesPillStyle(minutesPct)}
      >
        <span><FactIcon icon="fa-clock" /> {t.reports.min}</span>
        <strong className="tabular">{p.minutes != null ? String(p.minutes) : "—"}</strong>
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
        className={`player-report-sheet report-page-1${activePage === 2 && !expandAll ? " report-page-screen-hidden" : ""}`}
      >
        <header className="report-sheet-header">
          <div className="report-sheet-brand">
            <span className="brand-icon report-brand-icon">
              <i className="fa-solid fa-futbol" />
            </span>
            <div>
              <span className="report-sheet-eyebrow">{t.reports.sheetEyebrow}</span>
              <h2 className="report-sheet-category" style={{ color: accent }}>
                {categoryTitle}
              </h2>
            </div>
          </div>
          <div className="report-sheet-meta">
            {groupLabel && (
              <span className="report-sheet-group">{groupLabel}</span>
            )}
            <span className="report-sheet-page-label report-print-only">{t.reports.overview}</span>
            <div className="report-sheet-meta-row">
              <span className="report-sheet-index tabular">
                {String(categoryIndex).padStart(2, "0")}
              </span>
              {onExportPdf && (
                <button
                  type="button"
                  className="report-export-one-btn report-screen-only"
                  onClick={() => onExportPdf(playerId)}
                  disabled={exportDisabled}
                  title={t.reports.exportPdfTitle(displayName)}
                >
                  <i className="fa-solid fa-file-pdf" />
                </button>
              )}
            </div>
          </div>
        </header>

        <p className="report-sheet-description">{categoryDescription}</p>

        <div className="report-sheet-body pa-layout report-layout-v2">
          <div className="pa-col pa-col-identity">{renderIdentity(false)}</div>

          <div className="pa-col pa-col-score">
            <div className="score-stack">
              <PassGradePanel rating={profile.xp_pass_rating} />
              <ReportXpPanel profile={profile} accent={accent} expandAll={expandAll} />
            </div>
          </div>

          <div className="pa-col pa-col-pillars">
            <div className="player-card pillars-card report-pillars-card">
              <h3 className="section-label">{t.profile.passScores}</h3>
              <ReportPassScoreAccordion sections={profile.pass_scores} expandAll={expandAll} />
            </div>
          </div>
        </div>

        <footer className="report-sheet-footer">
          <span>
            <strong>Pass Scout</strong> · {displayName}
          </span>
          <span className="report-sheet-footer-right">
            <Link
              href={`/profile?player=${playerId}&position_family=midfielders`}
              className="report-screen-only"
            >
              {t.profile.fullProfile}
            </Link>
            <span className="report-print-only tabular">
              {t.reports.pageFootnote(displayName, categorySubtitle)}
            </span>
          </span>
        </footer>
      </section>

      <section
        className={`player-report-sheet report-page-2${activePage === 1 && !expandAll && !preloadMaps ? " report-page-screen-hidden" : ""}`}
      >
        <header className="report-sheet-header report-sheet-header-compact">
          <div className="report-sheet-brand">
            <span className="brand-icon report-brand-icon">
              <i className="fa-solid fa-map-location-dot" />
            </span>
            <div>
              <span className="report-sheet-eyebrow">{t.reports.mapsEyebrow}</span>
              <h2 className="report-sheet-category" style={{ color: accent }}>
                {displayName}
              </h2>
            </div>
          </div>
          <div className="report-sheet-meta report-maps-header-meta">
            <button
              type="button"
              className="report-maps-back-btn report-screen-only"
              onClick={() => setActivePage(1)}
            >
              <i className="fa-solid fa-arrow-left" />
              {t.reports.backToProfile}
            </button>
            <span className="report-sheet-page-label report-print-only">{t.reports.mapsPage}</span>
            <span className="report-sheet-index tabular">
              {String(categoryIndex).padStart(2, "0")}
            </span>
          </div>
        </header>

        <div className="report-maps-page">
          {renderMapsStrip()}

          <div className="report-maps-body">
            {mapsLoading && loadedMaps.length === 0 && (
              <LoadingState message={t.reports.generatingMaps} />
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
                  {!slot.loading && !slot.error && !slot.pass_map_b64 && shouldLoadMaps && (
                    <p className="placeholder-note">{t.reports.unavailable}</p>
                  )}
                </div>
              ))}
            </div>

            {anyLoading && loadedMaps.length > 0 && (
              <p className="muted report-maps-loading-hint report-screen-only">
                {t.reports.loadingMaps(loadedMaps.length, mapFilters.length)}
              </p>
            )}
          </div>
        </div>

        <footer className="report-sheet-footer">
          <span>
            <strong>Pass Scout</strong> · Maps · {displayName}
          </span>
          <span className="report-sheet-footer-right report-print-only tabular">
            {displayName}
          </span>
        </footer>
      </section>
    </div>
  );
}
