"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ScatterChart } from "@/components/ScatterChart";
import {
  getAggregatedMaps,
  getMapsOptions,
  getPassMap,
  getPlayerOptions,
  getScatter,
  type PlayerOption,
  type ScatterData,
} from "@/lib/api";

function MapsContent() {
  const searchParams = useSearchParams();
  const [options, setOptions] = useState<PlayerOption[]>([]);
  const [mapOpts, setMapOpts] = useState<{ scatter_metrics: { key: string; label: string }[]; pass_filters: { key: string; label: string }[] } | null>(null);
  const [playerId, setPlayerId] = useState(searchParams.get("player") ?? "");
  const [view, setView] = useState<"scatter" | "pass_map">("scatter");
  const [xKey, setXKey] = useState("xpass_coe_pct");
  const [yKey, setYKey] = useState("test_impact_v2_p90");
  const [passFilter, setPassFilter] = useState("progressive");
  const [scatter, setScatter] = useState<ScatterData | null>(null);
  const [passMap, setPassMap] = useState<{ pass_map_b64?: string | null; dest_map_b64?: string | null; caption: string } | null>(null);
  const [aggregated, setAggregated] = useState<{ common_map_b64?: string | null; rare_map_b64?: string | null; quadrant_stats: { quadrant: string; passes: number; share_pct: number }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPlayerOptions(), getMapsOptions(), getAggregatedMaps()])
      .then(([opts, mopts, agg]) => {
        setOptions(opts.options);
        setMapOpts(mopts);
        setAggregated(agg);
        if (!playerId && opts.options[0]) setPlayerId(opts.options[0].player_id);
      })
      .catch(() => setError("Backend indisponível"));
  }, [playerId]);

  useEffect(() => {
    if (view !== "scatter" || !playerId) return;
    getScatter(xKey, yKey, playerId).then(setScatter).catch((e) => setError(String(e)));
  }, [view, xKey, yKey, playerId]);

  useEffect(() => {
    if (view !== "pass_map" || !playerId) return;
    getPassMap(playerId, passFilter, "all").then(setPassMap).catch((e) => setError(String(e)));
  }, [view, passFilter, playerId]);

  return (
    <div className="container">
      <section className="hero">
        <h1>Maps</h1>
        <p className="muted">Scatter de métricas ou mapas de passes por jogador.</p>
      </section>

      {error && <div className="error-box">{error}</div>}

      <div className="filters">
        <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
          {options.map((o) => <option key={o.player_id} value={o.player_id}>{o.label}</option>)}
        </select>
        <select value={view} onChange={(e) => setView(e.target.value as "scatter" | "pass_map")}>
          <option value="scatter">Scatter</option>
          <option value="pass_map">Pass map</option>
        </select>
      </div>

      {view === "scatter" && mapOpts && (
        <>
          <div className="filters">
            <select value={xKey} onChange={(e) => setXKey(e.target.value)}>
              {mapOpts.scatter_metrics.map((m) => <option key={m.key} value={m.key}>{m.label} (X)</option>)}
            </select>
            <select value={yKey} onChange={(e) => setYKey(e.target.value)}>
              {mapOpts.scatter_metrics.map((m) => <option key={m.key} value={m.key}>{m.label} (Y)</option>)}
            </select>
          </div>
          {scatter && <ScatterChart points={scatter.points} xLabel={scatter.x_label} yLabel={scatter.y_label} means={scatter.means} />}
        </>
      )}

      {view === "pass_map" && mapOpts && (
        <>
          <div className="filters">
            <select value={passFilter} onChange={(e) => setPassFilter(e.target.value)}>
              {mapOpts.pass_filters.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          {passMap && (
            <div className="maps-grid">
              {passMap.pass_map_b64 && <img src={`data:image/png;base64,${passMap.pass_map_b64}`} alt="Pass map" className="map-img" />}
              {passMap.dest_map_b64 && <img src={`data:image/png;base64,${passMap.dest_map_b64}`} alt="Destination heatmap" className="map-img" />}
              <p className="muted">{passMap.caption}</p>
            </div>
          )}
        </>
      )}

      {aggregated && (
        <section style={{ marginTop: "2rem" }}>
          <h2>Visão agregada (top 250 por volume)</h2>
          <div className="maps-grid">
            {aggregated.common_map_b64 && <img src={`data:image/png;base64,${aggregated.common_map_b64}`} alt="Common passes" className="map-img" />}
            {aggregated.rare_map_b64 && <img src={`data:image/png;base64,${aggregated.rare_map_b64}`} alt="Rare passes" className="map-img" />}
          </div>
          {aggregated.quadrant_stats?.length > 0 && (
            <table style={{ marginTop: "1rem" }}>
              <thead><tr><th>Quadrante</th><th>Passes</th><th>%</th></tr></thead>
              <tbody>
                {aggregated.quadrant_stats.map((q) => (
                  <tr key={q.quadrant}><td>{q.quadrant}</td><td>{q.passes}</td><td>{q.share_pct?.toFixed(1)}%</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

export default function MapsPage() {
  return (
    <Suspense fallback={<p className="muted">Carregando…</p>}>
      <MapsContent />
    </Suspense>
  );
}
