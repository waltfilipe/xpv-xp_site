import Image from "next/image";
import Link from "next/link";
import { PassGradePanel } from "@/components/PassGradePanel";
import { PassLengthMix } from "@/components/PassLengthMix";
import { PassScoreSections } from "@/components/PassScoreSections";
import { PlayerReportRadar } from "@/components/PlayerReportRadar";
import { XpIndicesPanel } from "@/components/XpIndicesPanel";
import { XpProfileBars } from "@/components/XpProfileBars";
import type { PlayerProfile } from "@/lib/api";
import type { EnrichedReportPlayer } from "@/lib/playerReports";
import { formatContractUntil } from "@/lib/formatters";

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
  index: number;
};

export function PlayerReportSheet({ entry, profile, index }: Props) {
  const p = profile.player;
  const category = entry.category;
  const displayName = String(p.player_name ?? "—");
  const playerId = entry.playerId;

  return (
    <article
      className="player-report-sheet"
      data-category={category.id}
      data-player-id={playerId}
      id={`report-${playerId}`}
    >
      <header className="report-sheet-header">
        <div className="report-sheet-brand">
          <span className="brand-icon report-brand-icon">
            <i className="fa-solid fa-futbol" />
          </span>
          <div>
            <span className="report-sheet-eyebrow">Pass Scout · Midfielder Report</span>
            <h2 className="report-sheet-category" style={{ color: category.accent }}>
              {category.title}
            </h2>
          </div>
        </div>
        <div className="report-sheet-meta">
          {entry.groupLabel && (
            <span className="report-sheet-group">{entry.groupLabel}</span>
          )}
          <span className="report-sheet-index tabular">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </header>

      <p className="report-sheet-description">{category.description}</p>

      <div className="report-sheet-body pa-layout">
        <div className="pa-col pa-col-identity">
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
          </div>
        </div>

        <div className="pa-col pa-col-score">
          <div className="score-stack">
            <PassGradePanel rating={profile.xp_pass_rating} />

            <div className="player-card xp-profile-card report-xp-card">
              <h3 className="section-label">xP Profile</h3>
              <XpProfileBars bars={profile.xp_bars} />
              <XpIndicesPanel indices={profile.xp_indices ?? []} />
              <PassLengthMix data={profile} />
            </div>

            <div className="player-card report-radar-card">
              <h3 className="section-label">Pass Profile</h3>
              <PlayerReportRadar sections={profile.pass_scores} accent={category.accent} />
            </div>
          </div>
        </div>

        <div className="pa-col pa-col-pillars">
          <div className="player-card pillars-card report-pillars-card">
            <h3 className="section-label">Pass Scores</h3>
            <PassScoreSections sections={profile.pass_scores} />
          </div>
        </div>
      </div>

      <footer className="report-sheet-footer">
        <span>
          <strong>Pass Scout</strong> · European pass analytics
        </span>
        <span className="report-sheet-footer-right">
          <Link href={`/profile?player=${playerId}&position_family=midfielders`} className="report-screen-only">
            Ver perfil completo
          </Link>
          <span className="report-print-only tabular">
            {displayName} · {category.subtitle}
          </span>
        </span>
      </footer>
    </article>
  );
}
