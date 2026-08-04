"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CompareCenter } from "@/components/CompareCenter";
import { LoadingState } from "@/components/LoadingState";
import { PageHero } from "@/components/PageHero";
import { PassLengthMix } from "@/components/PassLengthMix";
import { XpProfileBars } from "@/components/XpProfileBars";
import { POSITION_FAMILIES } from "@/lib/positionFamilies";
import { getCompare, getMeta, getPlayerOptionsLegacy, type ComparePayload, type PlayerOption } from "@/lib/api";

export default function ComparePage() {
  const [positionFamily, setPositionFamily] = useState("midfielders");
  const [positionFamilies, setPositionFamilies] = useState(POSITION_FAMILIES);
  const [options, setOptions] = useState<PlayerOption[]>([]);
  const [playerA, setPlayerA] = useState("");
  const [playerB, setPlayerB] = useState("");
  const [data, setData] = useState<ComparePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMeta()
      .then((meta) => {
        if (meta.position_families?.length) setPositionFamilies(meta.position_families);
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  useEffect(() => {
    getPlayerOptionsLegacy({ position_family: positionFamily }).then((r) => {
      setOptions(r.options);
      if (r.options[0]) setPlayerA(r.options[0].player_id);
      if (r.options[1]) setPlayerB(r.options[1].player_id);
    }).catch(() => setError("Backend indisponível"));
  }, [positionFamily]);

  useEffect(() => {
    if (!playerA || !playerB || playerA === playerB) return;
    setLoading(true);
    getCompare(playerA, playerB, positionFamily)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, [playerA, playerB, positionFamily]);

  function PlayerCard({ side, player, heatmap }: { side: "a" | "b"; player: Record<string, unknown>; heatmap?: string | null }) {
    const bars = (player.xp_bars as { key: string; label: string; value?: number }[]) ?? [];
    return (
      <div className={`player-card compare-side compare-side-${side}`}>
        <div className="identity-header">
          {player.photo_url ? (
            <div className="identity-photo-wrap">
              <Image src={String(player.photo_url)} alt="" width={58} height={58} className="identity-photo" unoptimized />
            </div>
          ) : (
            <div className="identity-photo-wrap">
              <div className="identity-photo-placeholder">{String(player.player_name ?? "?").charAt(0)}</div>
            </div>
          )}
          <div className="identity-head-text">
            <h3 className="identity-title" style={{ fontSize: "1rem" }}>{String(player.player_name)}</h3>
            <p className="identity-meta">{String(player.team)} · {String(player.position)}</p>
          </div>
        </div>
        <div className="metric-lines" style={{ marginTop: "0.5rem" }}>
          <div className="metric-line"><span>Valor</span><span className="stat-val">{String(player.market_value ?? "—")}</span></div>
          <div className="metric-line"><span>Idade</span><span className="stat-val">{String(player.age ?? "—")}</span></div>
          <div className="metric-line"><span>Minutos</span><span className="stat-val">{String(player.minutes ?? "—")}</span></div>
        </div>
        {heatmap && <img src={`data:image/png;base64,${heatmap}`} alt="Heatmap" className="heatmap-img" />}
        <div style={{ marginTop: "0.75rem" }}>
          <XpProfileBars bars={bars} />
        </div>
        <PassLengthMix data={{
          long_pass_share_pct: player.long_pass_share_pct as number | null | undefined,
          long_pass_share_ref_avg_pct: player.long_pass_share_ref_avg_pct as number | null | undefined,
          long_pass_share_pctile: player.long_pass_share_pctile as number | null | undefined,
        }} />
      </div>
    );
  }

  return (
    <div className="container">
      <PageHero
        title="Compare"
        subtitle="Compare dois jogadores do mesmo pool de posição. Métricas e notas são relativas aos pares da posição."
        icon="fa-scale-balanced"
      />

      <div className="filter-card">
        <div className="filters" style={{ marginBottom: 0 }}>
          <label className="filter-field">
            <span className="filter-label">Posição</span>
            <select value={positionFamily} onChange={(e) => setPositionFamily(e.target.value)}>
              {positionFamilies.map((family) => (
                <option key={family.key} value={family.key}>{family.label}</option>
              ))}
            </select>
          </label>
          <select value={playerA} onChange={(e) => setPlayerA(e.target.value)}>
            {options.map((o) => <option key={o.player_id} value={o.player_id}>{o.label}</option>)}
          </select>
          <span className="muted" style={{ fontWeight: 700 }}>vs</span>
          <select value={playerB} onChange={(e) => setPlayerB(e.target.value)}>
            {options.filter((o) => o.player_id !== playerA).map((o) => (
              <option key={o.player_id} value={o.player_id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <LoadingState message="Carregando comparação…" />}
      {error && <div className="error-box">{error}</div>}

      {data && !loading && (
        <div className="compare-layout">
          <PlayerCard side="a" player={data.player_a} heatmap={data.heatmap_a_b64} />
          <div className="player-card" style={{ padding: "1rem" }}>
            <CompareCenter pillars={data.pillars} passGrid={data.pass_grid} />
          </div>
          <PlayerCard side="b" player={data.player_b} heatmap={data.heatmap_b_b64} />
        </div>
      )}
    </div>
  );
}
