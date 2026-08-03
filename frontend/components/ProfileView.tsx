"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PassScoreSections } from "@/components/PassScoreSections";
import { XpProfileBars } from "@/components/XpProfileBars";
import { getPlayerProfile, type PlayerProfile } from "@/lib/api";

export function ProfileView({ playerId }: { playerId: string }) {
  const [data, setData] = useState<PlayerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPlayerProfile(playerId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) return <p className="muted">Carregando perfil… (pode levar ~2 min na primeira vez)</p>;
  if (error) return <div className="error-box">{error}</div>;
  if (!data) return null;

  const p = data.player;
  return (
    <div className="profile-layout">
      <div className="card profile-col">
        <div className="profile-identity">
          {p.photo_url ? (
            <Image src={String(p.photo_url)} alt="" width={80} height={80} className="profile-photo" unoptimized />
          ) : (
            <div className="profile-photo placeholder" />
          )}
          <div>
            <h2>{String(p.player_name ?? "—")}</h2>
            <p className="muted">{String(p.team ?? "—")} · {String(p.position ?? "—")}</p>
            <span className="badge">{String(p.league_source ?? p.league ?? "—")}</span>
          </div>
        </div>
        <dl className="profile-facts">
          <div><dt>Idade</dt><dd>{p.age != null ? String(p.age) : "—"}</dd></div>
          <div><dt>Altura</dt><dd>{String(p.height ?? "—")}</dd></div>
          <div><dt>Nacionalidade</dt><dd>{String(p.nationality ?? "—")}</dd></div>
          <div><dt>Pé</dt><dd>{String(p.dominant_foot ?? "—")}</dd></div>
          <div><dt>Valor</dt><dd>{String(p.market_value ?? "—")}</dd></div>
          <div><dt>Contrato</dt><dd>{String(p.contract_until ?? "—")}</dd></div>
          <div><dt>Minutos</dt><dd>{p.minutes != null ? String(p.minutes) : "—"}</dd></div>
        </dl>
        {data.origin_heatmap_b64 && (
          <img src={`data:image/png;base64,${data.origin_heatmap_b64}`} alt="Origem dos passes" className="heatmap-img" />
        )}
      </div>

      <div className="card profile-col">
        <h3>Overall Pass Grade</h3>
        <div className="pass-grade-big">{data.xp_pass_rating != null ? Number(data.xp_pass_rating).toFixed(1) : "—"}</div>
        <p className="muted">/ 10 · xP pass rating</p>
        <h3 style={{ marginTop: "1.5rem" }}>xP Profile</h3>
        <XpProfileBars bars={data.xp_bars} />
        <div className="index-row">
          <div><span className="muted">Consistency</span><strong>{data.xp_game_consistency_score != null ? Number(data.xp_game_consistency_score).toFixed(1) : "—"}</strong></div>
          <div><span className="muted">Impact</span><strong>{data.test_impact_v2_p90 != null ? Number(data.test_impact_v2_p90).toFixed(2) : "—"}</strong></div>
        </div>
        {data.long_pass_share_pct != null && (
          <p className="muted" style={{ marginTop: "1rem" }}>Long passes: {Number(data.long_pass_share_pct).toFixed(1)}%</p>
        )}
      </div>

      <div className="card profile-col">
        <h3>Pass Scores</h3>
        <PassScoreSections sections={data.pass_scores} />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <Link href={`/compare?a=${playerId}`} className="btn">Comparar jogador</Link>
        {" "}
        <Link href={`/maps?player=${playerId}`} className="btn" style={{ background: "var(--surface-2)", color: "var(--text)" }}>Ver mapas</Link>
      </div>
    </div>
  );
}
