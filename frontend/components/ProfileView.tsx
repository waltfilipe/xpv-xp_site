"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { PassGradePanel } from "@/components/PassGradePanel";
import { PassScoreSections } from "@/components/PassScoreSections";
import { XpProfileBars } from "@/components/XpProfileBars";
import { getPlayerProfile, type PlayerProfile } from "@/lib/api";

export function ProfileView({ playerId }: { playerId: string }) {
  const [data, setData] = useState<PlayerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPlayerProfile(playerId)
      .then(setData)
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Erro";
        setError(
          msg === "Failed to fetch"
            ? "Não foi possível conectar ao backend. Verifique se o FastAPI está rodando (porta 8000)."
            : msg,
        );
      })
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) return <LoadingState message="Carregando perfil do jogador…" />;
  if (error) return <div className="error-box">{error}</div>;
  if (!data) return null;

  const p = data.player;

  return (
    <>
      <div className="pa-layout">
        {/* Coluna 1 — Identidade */}
        <div className="pa-col pa-col-identity">
          <div className="player-card identity-card">
            <div className="identity-header">
              <div className="identity-photo-wrap">
                {p.photo_url ? (
                  <Image src={String(p.photo_url)} alt="" width={58} height={58} className="identity-photo" unoptimized />
                ) : (
                  <div className="identity-photo-placeholder">{String(p.player_name ?? "?").charAt(0)}</div>
                )}
              </div>
              <div className="identity-head-text">
                <h2 className="identity-title">{String(p.player_name ?? "—")}</h2>
                <p className="identity-meta">{String(p.team ?? "—")} · {String(p.position ?? "—")}</p>
                <span className="identity-chip">{String(p.league_source ?? p.league ?? "—").replace(/_/g, " ")}</span>
              </div>
            </div>

            <div className="identity-divider" />

            <div className="metric-lines">
              <div className="metric-line"><span>Idade</span><span className="stat-val">{p.age != null ? String(p.age) : "—"}</span></div>
              <div className="metric-line"><span>Altura</span><span className="stat-val">{String(p.height ?? "—")}</span></div>
              <div className="metric-line"><span>Nacionalidade</span><span className="stat-val">{String(p.nationality ?? "—")}</span></div>
              <div className="metric-line"><span>Pé</span><span className="stat-val">{String(p.dominant_foot ?? "—")}</span></div>
              <div className="metric-line"><span>Valor</span><span className="stat-val">{String(p.market_value ?? "—")}</span></div>
              <div className="metric-line"><span>Contrato</span><span className="stat-val">{String(p.contract_until ?? "—")}</span></div>
              <div className="metric-line"><span>Minutos</span><span className="stat-val">{p.minutes != null ? String(p.minutes) : "—"}</span></div>
            </div>

            {data.origin_heatmap_b64 && (
              <img src={`data:image/png;base64,${data.origin_heatmap_b64}`} alt="Origem dos passes" className="heatmap-img" />
            )}
          </div>
        </div>

        {/* Coluna 2 — Scores */}
        <div className="pa-col pa-col-score">
          <div className="score-stack">
            <PassGradePanel rating={data.xp_pass_rating} />

            <div className="player-card xp-profile-card">
              <h3 className="section-label">xP Profile</h3>
              <XpProfileBars bars={data.xp_bars} />

              <div className="xp-index-wrap">
                <h4 className="section-label-sm">xP Indices</h4>
                <div className="xp-index-list">
                  <div className="xp-index-row">
                    <span>Consistency</span>
                    <span className="stat-val">{data.xp_game_consistency_score != null ? Number(data.xp_game_consistency_score).toFixed(1) : "—"}</span>
                  </div>
                  <div className="xp-index-row">
                    <span>Impact</span>
                    <span className="stat-val">{data.test_impact_v2_p90 != null ? Number(data.test_impact_v2_p90).toFixed(2) : "—"}</span>
                  </div>
                </div>
              </div>

              {data.long_pass_share_pct != null && (
                <div className="pass-length-mix">
                  <span className="section-label-sm">Pass length mix</span>
                  <div className="length-bar-track">
                    <div className="length-bar-long" style={{ width: `${Number(data.long_pass_share_pct)}%` }} />
                  </div>
                  <span className="length-label">Long passes: {Number(data.long_pass_share_pct).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna 3 — Pass Scores */}
        <div className="pa-col pa-col-pillars">
          <div className="player-card pillars-card">
            <h3 className="section-label">Pass Scores</h3>
            <PassScoreSections sections={data.pass_scores} />
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <Link href={`/compare?a=${playerId}`} className="btn btn-primary">
          <i className="fa-solid fa-scale-balanced" /> Comparar
        </Link>
        <Link href={`/maps?player=${playerId}`} className="btn btn-ghost">
          <i className="fa-solid fa-map-location-dot" /> Ver mapas
        </Link>
      </div>
    </>
  );
}
