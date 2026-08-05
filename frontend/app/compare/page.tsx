"use client";

import { useEffect, useState } from "react";
import { CompareCenter } from "@/components/CompareCenter";
import { ComparePlayerCard } from "@/components/ComparePlayerCard";
import { LoadingState } from "@/components/LoadingState";
import { POSITION_FAMILIES } from "@/lib/positionFamilies";
import { getCompare, getMeta, getPlayerOptionsLegacy, type ComparePayload, type PlayerOption } from "@/lib/api";

export default function ComparePage() {
  const [positionFamily, setPositionFamily] = useState("midfielders");
  const [positionFamilies, setPositionFamilies] = useState<{ key: string; label: string }[]>([...POSITION_FAMILIES]);
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

  const nameA = data ? String(data.player_a.player_name ?? "Jogador A") : "Jogador A";
  const nameB = data ? String(data.player_b.player_name ?? "Jogador B") : "Jogador B";

  return (
    <div className="profile-page compare-page">
      <header className="profile-page-hero compare-page-hero">
        <div className="container">
          <div className="profile-page-hero-inner">
            <div>
              <span className="profile-page-eyebrow">Pass Scout</span>
              <h1>Compare</h1>
              <p>
                Compare dois jogadores do mesmo pool de posição. Métricas e notas são relativas aos pares da posição.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container profile-page-body">
        <div className="filter-card compare-filter-card">
          <div className="filters compare-selectors" style={{ marginBottom: 0 }}>
            <label className="filter-field">
              <span className="filter-label">Posição</span>
              <select value={positionFamily} onChange={(e) => setPositionFamily(e.target.value)}>
                {positionFamilies.map((family) => (
                  <option key={family.key} value={family.key}>{family.label}</option>
                ))}
              </select>
            </label>
            <label className="filter-field compare-player-select">
              <span className="filter-label">Jogador A</span>
              <select value={playerA} onChange={(e) => setPlayerA(e.target.value)}>
                {options.map((o) => <option key={o.player_id} value={o.player_id}>{o.label}</option>)}
              </select>
            </label>
            <span className="compare-vs muted">vs</span>
            <label className="filter-field compare-player-select">
              <span className="filter-label">Jogador B</span>
              <select value={playerB} onChange={(e) => setPlayerB(e.target.value)}>
                {options.filter((o) => o.player_id !== playerA).map((o) => (
                  <option key={o.player_id} value={o.player_id}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading && <LoadingState message="Carregando comparação…" />}
        {error && <div className="error-box">{error}</div>}

        {data && !loading && (
          <div className="compare-layout">
            <ComparePlayerCard
              side="a"
              player={data.player_a}
              heatmap={data.heatmap_a_b64}
            />
            <div className="player-card compare-charts-card">
              <CompareCenter
                pillars={data.pillars}
                passGrid={data.pass_grid}
                nameA={nameA}
                nameB={nameB}
              />
            </div>
            <ComparePlayerCard
              side="b"
              player={data.player_b}
              heatmap={data.heatmap_b_b64}
            />
          </div>
        )}
      </div>
    </div>
  );
}
