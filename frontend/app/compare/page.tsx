"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CompareCenter } from "@/components/CompareCenter";
import { XpProfileBars } from "@/components/XpProfileBars";
import { getCompare, getPlayerOptions, type ComparePayload, type PlayerOption } from "@/lib/api";

export default function ComparePage() {
  const [options, setOptions] = useState<PlayerOption[]>([]);
  const [playerA, setPlayerA] = useState("");
  const [playerB, setPlayerB] = useState("");
  const [data, setData] = useState<ComparePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPlayerOptions().then((r) => {
      setOptions(r.options);
      if (r.options[0]) setPlayerA(r.options[0].player_id);
      if (r.options[1]) setPlayerB(r.options[1].player_id);
    }).catch(() => setError("Backend indisponível"));
  }, []);

  useEffect(() => {
    if (!playerA || !playerB || playerA === playerB) return;
    setLoading(true);
    getCompare(playerA, playerB)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, [playerA, playerB]);

  function PlayerCard({ side, player, heatmap }: { side: "a" | "b"; player: Record<string, unknown>; heatmap?: string | null }) {
    const bars = (player.xp_bars as { key: string; label: string; value?: number }[]) ?? [];
    return (
      <div className={`card compare-side compare-side-${side}`}>
        <div className="profile-identity">
          {player.photo_url ? (
            <Image src={String(player.photo_url)} alt="" width={64} height={64} className="profile-photo" unoptimized />
          ) : <div className="profile-photo placeholder" />}
          <div>
            <h3>{String(player.player_name)}</h3>
            <p className="muted">{String(player.team)} · {String(player.position)}</p>
          </div>
        </div>
        <dl className="profile-facts compact">
          <div><dt>Valor</dt><dd>{String(player.market_value ?? "—")}</dd></div>
          <div><dt>Idade</dt><dd>{String(player.age ?? "—")}</dd></div>
          <div><dt>Minutos</dt><dd>{String(player.minutes ?? "—")}</dd></div>
        </dl>
        {heatmap && <img src={`data:image/png;base64,${heatmap}`} alt="Heatmap" className="heatmap-img" />}
        <XpProfileBars bars={bars} />
      </div>
    );
  }

  return (
    <div className="container">
      <section className="hero">
        <h1>Compare</h1>
        <p className="muted">Compare dois meio-campistas lado a lado.</p>
      </section>

      <div className="filters">
        <select value={playerA} onChange={(e) => setPlayerA(e.target.value)}>
          {options.map((o) => <option key={o.player_id} value={o.player_id}>{o.label}</option>)}
        </select>
        <select value={playerB} onChange={(e) => setPlayerB(e.target.value)}>
          {options.filter((o) => o.player_id !== playerA).map((o) => (
            <option key={o.player_id} value={o.player_id}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading && <p className="muted">Carregando comparação…</p>}
      {error && <div className="error-box">{error}</div>}

      {data && !loading && (
        <div className="compare-layout">
          <PlayerCard side="a" player={data.player_a} heatmap={data.heatmap_a_b64} />
          <div className="card"><CompareCenter pillars={data.pillars} passGrid={data.pass_grid} /></div>
          <PlayerCard side="b" player={data.player_b} heatmap={data.heatmap_b_b64} />
        </div>
      )}
    </div>
  );
}
