"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { PassGradePanel } from "@/components/PassGradePanel";
import { PassLengthMix } from "@/components/PassLengthMix";
import { PassScoreSections } from "@/components/PassScoreSections";
import { XpIndicesPanel } from "@/components/XpIndicesPanel";
import { XpProfileBars } from "@/components/XpProfileBars";
import { getPlayerProfile, type PlayerProfile } from "@/lib/api";
import { formatContractUntil } from "@/lib/formatters";

function FactIcon({ icon }: { icon: string }) {
  return (
    <span className="identity-fact-icon" aria-hidden="true">
      <i className={`fa-solid ${icon}`} />
    </span>
  );
}

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
        <div className="pa-col pa-col-identity">
          <div className="player-card identity-card">
            <div className="identity-photo-wrap identity-photo-hero">
              {p.photo_url ? (
                <Image
                  src={String(p.photo_url)}
                  alt=""
                  width={400}
                  height={400}
                  className="identity-photo"
                  unoptimized
                  priority
                />
              ) : (
                <div className="identity-photo-placeholder identity-photo-placeholder-hero">
                  {String(p.player_name ?? "?").charAt(0)}
                </div>
              )}
            </div>

            <div className="identity-hero-text">
              <h2 className="identity-title">{String(p.player_name ?? "—")}</h2>
              <p className="identity-subline">
                {String(p.team ?? "—")} · {String(p.position ?? "—")}
              </p>

              <div className="identity-facts">
                <div className="identity-fact">
                  <FactIcon icon="fa-cake-candles" />
                  <span className="identity-fact-label">Idade</span>
                  <span className="identity-fact-value tabular">{p.age != null ? String(p.age) : "—"}</span>
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

            {data.origin_heatmap_b64 && (
              <img src={`data:image/png;base64,${data.origin_heatmap_b64}`} alt="Origem dos passes" className="heatmap-img" />
            )}
          </div>
        </div>

        <div className="pa-col pa-col-score">
          <div className="score-stack">
            <PassGradePanel rating={data.xp_pass_rating} />

            <div className="player-card xp-profile-card">
              <h3 className="section-label">xP Profile</h3>
              <XpProfileBars bars={data.xp_bars} />
              <XpIndicesPanel indices={data.xp_indices ?? []} />
              <PassLengthMix data={data} />
            </div>
          </div>
        </div>

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
