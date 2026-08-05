import type { CSSProperties } from "react";
import type { PlayerProfile } from "@/lib/api";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { MetricGradientBar } from "@/components/ui/MetricGradientBar";
import { XpHeatBar } from "@/components/ui/XpHeatBar";
import { RoundGradeChart } from "@/components/RoundGradeChart";
import type { ReportMapSlot } from "@/components/PlayerReportSheet";
import type { EnrichedReportPlayer } from "@/lib/playerReports";
import { formatContractUntil, formatMetric } from "@/lib/formatters";
import {
  gradeTier,
  passGradeGradientColor,
  passGradePct,
  rankToBarScore,
  XP_INDEX_TIER_LABELS,
  xpIndexTierClass,
} from "@/lib/gradeColors";
import { COMPONENT_LABELS } from "@/lib/tooltips";

export type PrintReportEntry = {
  entry: EnrichedReportPlayer;
  profile: PlayerProfile;
  mapSlots: ReportMapSlot[];
};

const XP_BAR_ICONS: Record<string, string> = {
  xp_activity_display: "fa-chart-simple",
  xp_efficiency_display: "fa-gauge-high",
  xp_edge_display: "fa-bolt",
};

const REF_CENTER_PCT = 11.4;

function minutesRingStyle(pct: number | null | undefined): CSSProperties | undefined {
  if (pct == null || Number.isNaN(pct)) return undefined;
  const clamped = Math.max(0, Math.min(1, pct));
  const hue = clamped * 120;
  return { "--minutes-ring": `hsla(${hue}, 42%, 40%, 0.72)` } as CSSProperties;
}

function PrintPassGrade({ rating }: { rating: number | null | undefined }) {
  const displayScore = rating != null ? rating * 10 : null;
  if (displayScore == null) {
    return (
      <div className="print-card print-pass-grade">
        <div className="print-section-title">Overall Pass Grade</div>
        <p className="print-muted">—</p>
      </div>
    );
  }

  const pct = passGradePct(displayScore);
  const color = passGradeGradientColor(pct);
  const tier = gradeTier(displayScore);

  return (
    <div className="print-card print-pass-grade">
      <div className="print-pass-grade-head">
        <span className="print-section-title">Overall Pass Grade</span>
        <span className="print-tier-pill" style={{ color, borderColor: `${color}66`, background: `${color}18` }}>
          {tier}
        </span>
      </div>
      <div className="print-pass-grade-body">
        <span className="print-pass-grade-score tabular" style={{ color }}>
          {displayScore.toFixed(1)}
        </span>
        <span className="print-pass-grade-scale">/ 10</span>
        <div className="print-pass-grade-track">
          <span className="print-pass-grade-marker" style={{ left: `${Math.max(1.5, Math.min(98.5, pct))}%` }} />
        </div>
      </div>
    </div>
  );
}

function PrintPassLength({ profile }: { profile: PlayerProfile }) {
  const share = profile.long_pass_share_pct;
  if (share == null) return null;
  const shortShare = 100 - share;
  const playerPos = Math.max(4, Math.min(96, share));
  const refPos = Math.max(4, Math.min(96, REF_CENTER_PCT));

  return (
    <div className="print-card print-pass-length">
      <div className="print-section-title">Pass Length Mix</div>
      <div className="print-pass-length-track">
        <span className="print-pass-length-ref" style={{ left: `${refPos}%` }} />
        <span className="print-pass-length-marker" style={{ left: `${playerPos}%` }} />
      </div>
      <div className="print-pass-length-axis">
        <span>Short</span>
        <span>Long</span>
      </div>
      <div className="print-pass-length-legend">
        <span><strong>{shortShare.toFixed(1)}%</strong> short</span>
        <span><strong>{share.toFixed(1)}%</strong> long</span>
      </div>
    </div>
  );
}

function formatImpactPrintValue(key: string, value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (key === "xp_residual_mean") {
    const cents = value * 100;
    return `${cents >= 0 ? "+" : ""}${cents.toFixed(2)}¢`;
  }
  return value.toFixed(3);
}

function PrintSheetOverview({ item }: { item: PrintReportEntry }) {
  const { entry, profile } = item;
  const p = profile.player;
  const category = entry.category;
  const displayName = String(p.player_name ?? "—");
  const minutesPct = p.minutes_pct != null ? Number(p.minutes_pct) : null;
  const indices = profile.xp_indices ?? [];
  const consistency = indices.find((i) => i.key === "consistency");
  const impact = indices.find((i) => i.key === "impact");
  const otherIndices = indices.filter((i) => i.key !== "consistency" && i.key !== "impact");
  const roundGrades = profile.xp_round_grades ?? [];

  return (
    <article className="print-sheet print-sheet-overview" data-player-id={entry.playerId}>
      <header className="print-header">
        <div>
          <span className="print-eyebrow">Pass Scout · Midfielder Report</span>
          <h2 className="print-category" style={{ color: category.accent }}>{category.title}</h2>
        </div>
        <div className="print-header-meta">
          {entry.groupLabel && <span className="print-group">{entry.groupLabel}</span>}
          <span className="print-page-tag">Overview</span>
          <span className="print-index tabular">{String(entry.categoryIndex).padStart(2, "0")}</span>
        </div>
      </header>

      <p className="print-description">{category.description}</p>

      <div className="print-body-grid">
        <div className="print-col print-col-identity">
          <div className="print-card print-identity">
            <div className="print-identity-top">
              {p.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String(p.photo_url)} alt="" className="print-photo" />
              ) : (
                <div className="print-photo print-photo-placeholder">{displayName.charAt(0)}</div>
              )}
              <div>
                <h3 className="print-player-name">
                  {displayName}
                  {entry.note && <span className="print-note">{entry.note}</span>}
                </h3>
                <p className="print-subline">{String(p.team ?? "—")} · {String(p.position ?? "—")}</p>
                <p className="print-league">{String(p.league_source ?? p.league ?? "—")}</p>
              </div>
            </div>

            <div className="print-facts">
              <div><span>Idade</span><strong className="tabular">{p.age != null ? String(p.age) : "—"}</strong></div>
              <div><span>Altura</span><strong>{String(p.height ?? "—")}</strong></div>
              <div><span>Nacionalidade</span><strong>{String(p.nationality ?? "—")}</strong></div>
              <div><span>Pé</span><strong>{String(p.dominant_foot ?? "—")}</strong></div>
            </div>

            <div className="print-meta-row">
              <div className="print-meta-pill"><span>Valor</span><strong>{String(p.market_value ?? "—")}</strong></div>
              <div className="print-meta-pill"><span>Contrato</span><strong>{formatContractUntil(p.contract_until)}</strong></div>
              <div
                className="print-meta-pill print-meta-minutes"
                style={minutesRingStyle(minutesPct)}
              >
                <span>Minutos</span>
                <strong className="tabular">{p.minutes != null ? String(p.minutes) : "—"}</strong>
              </div>
            </div>

            {profile.origin_heatmap_b64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${profile.origin_heatmap_b64}`}
                alt="Origem dos passes"
                className="print-heatmap"
              />
            )}
          </div>
        </div>

        <div className="print-col print-col-score">
          <PrintPassGrade rating={profile.xp_pass_rating} />

          <div className="print-card print-xp-profile">
            <div className="print-section-title">xP Profile</div>
            <div className="print-xp-bars">
              {profile.xp_bars.map((bar) => (
                <div key={bar.key} className="print-xp-bar-block">
                  <div className="print-xp-bar-label">
                    {XP_BAR_ICONS[bar.key] && (
                      <i className={`fa-solid ${XP_BAR_ICONS[bar.key]}`} aria-hidden="true" />
                    )}
                    {bar.label}
                  </div>
                  <XpHeatBar value={bar.value} />
                </div>
              ))}
            </div>

            {indices.length > 0 && (
              <div className="print-indices">
                <div className="print-section-subtitle">xP Indices</div>
                {consistency && (
                  <div className={`print-index-row ${xpIndexTierClass(consistency.tier)}`}>
                    <span><i className={`fa-solid ${consistency.icon ?? "fa-wave-square"}`} /> {consistency.label}</span>
                    <span>{XP_INDEX_TIER_LABELS[consistency.tier ?? "mid"] ?? consistency.tier ?? "—"}</span>
                  </div>
                )}
                {consistency && roundGrades.filter((pt) => pt.grade != null).length >= 2 && (
                  <RoundGradeChart
                    points={roundGrades}
                    accent={category.accent}
                    embedded
                    tier={consistency.tier_key ?? consistency.tier ?? "mid"}
                  />
                )}
                {impact && (
                  <div className={`print-index-block ${xpIndexTierClass(impact.tier)}`}>
                    <div className="print-index-row">
                      <span><i className={`fa-solid ${impact.icon ?? "fa-crosshairs"}`} /> {impact.label}</span>
                      <span>{XP_INDEX_TIER_LABELS[impact.tier ?? "mid"] ?? impact.tier ?? "—"}</span>
                    </div>
                    {(impact.components ?? []).map((comp) => (
                      <div key={comp.key} className="print-impact-metric">
                        <span>{comp.label}</span>
                        <span className="tabular">{formatImpactPrintValue(comp.key, comp.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {otherIndices.map((item) => (
                  <div key={item.key} className={`print-index-row ${xpIndexTierClass(item.tier)}`}>
                    <span><i className={`fa-solid ${item.icon ?? "fa-circle"}`} /> {item.label}</span>
                    <span>{XP_INDEX_TIER_LABELS[item.tier ?? "mid"] ?? item.tier ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}

            <PrintPassLength profile={profile} />
          </div>
        </div>

        <div className="print-col print-col-pillars">
          <div className="print-card print-pass-scores">
            <div className="print-section-title">Pass Scores</div>
            {profile.pass_scores.map((section) => (
              <div key={section.title} className="print-pass-section">
                <div className="print-pass-section-head">
                  <span className="print-pass-section-title">{section.title}</span>
                  <GradeBadge letter={section.letter} size="sm" />
                </div>
                <div className="print-pass-metrics">
                  {section.components.map((c) => (
                    <div key={c.key} className="print-pass-metric">
                      <div className="print-pass-metric-head">
                        <span>{COMPONENT_LABELS[c.key] ?? c.key.replace(/_/g, " ")}</span>
                        <span className="tabular">{formatMetric(c.value, c.key)}</span>
                      </div>
                      <MetricGradientBar
                        score={rankToBarScore(c.rank, c.rank_pool)}
                        letter={section.letter}
                        displayScore={section.display_score}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="print-footer">
        <span><strong>Pass Scout</strong> · {displayName}</span>
        <span className="tabular">{displayName} · {category.subtitle}</span>
      </footer>
    </article>
  );
}

function PrintSheetMaps({ item }: { item: PrintReportEntry }) {
  const { entry, profile, mapSlots } = item;
  const p = profile.player;
  const category = entry.category;
  const displayName = String(p.player_name ?? "—");
  const minutesPct = p.minutes_pct != null ? Number(p.minutes_pct) : null;

  return (
    <article className="print-sheet print-sheet-maps" data-player-id={entry.playerId}>
      <header className="print-header print-header-compact">
        <div>
          <span className="print-eyebrow">Pass Maps</span>
          <h2 className="print-category" style={{ color: category.accent }}>{displayName}</h2>
        </div>
        <div className="print-header-meta">
          <span className="print-page-tag">Maps</span>
          <span className="print-index tabular">{String(entry.categoryIndex).padStart(2, "0")}</span>
        </div>
      </header>

      <div className="print-maps-strip">
        {p.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={String(p.photo_url)} alt="" className="print-maps-strip-photo" />
        ) : (
          <div className="print-maps-strip-photo print-photo-placeholder">{displayName.charAt(0)}</div>
        )}
        <div>
          <strong>{displayName}</strong>
          <span className="print-maps-strip-meta">
            {String(p.team ?? "—")} · {String(p.position ?? "—")}
            {p.age != null ? ` · ${p.age} anos` : ""}
          </span>
          <span className="print-league">{String(p.league_source ?? p.league ?? "—")}</span>
        </div>
        <div className="print-meta-pill print-meta-minutes" style={minutesRingStyle(minutesPct)}>
          <span>Min</span>
          <strong className="tabular">{p.minutes != null ? String(p.minutes) : "—"}</strong>
        </div>
      </div>

      <div className="print-maps-grid">
        {mapSlots.map((slot) => (
          <div key={slot.key} className="print-map-card">
            <div className="print-section-subtitle">{slot.label}</div>
            {slot.pass_map_b64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${slot.pass_map_b64}`}
                alt={slot.label}
                className="print-map-img"
              />
            ) : (
              <p className="print-muted">{slot.error ?? "Indisponível"}</p>
            )}
          </div>
        ))}
      </div>

      <footer className="print-footer">
        <span><strong>Pass Scout</strong> · Maps · {displayName}</span>
        <span className="tabular">{displayName}</span>
      </footer>
    </article>
  );
}

type Props = {
  entries: PrintReportEntry[];
};

export function ReportPrintDocument({ entries }: Props) {
  if (!entries.length) return null;

  return (
    <div id="report-print-root" className="report-print-root" aria-hidden="true">
      {entries.map((item) => (
        <div key={item.entry.playerId} className="print-player-bundle">
          <PrintSheetOverview item={item} />
          <PrintSheetMaps item={item} />
        </div>
      ))}
    </div>
  );
}
