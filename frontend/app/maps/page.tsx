"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { PageHero } from "@/components/PageHero";
import { ScatterChart } from "@/components/ScatterChart";
import { POSITION_FAMILIES } from "@/lib/positionFamilies";
import {
  getAggregatedMaps,
  getMapsOptions,
  getMeta,
  getPassMap,
  getPlayerOptions,
  getScatter,
  type PlayerOption,
  type ScatterData,
} from "@/lib/api";
import { imageSrcFromPayload } from "@/lib/imageSrc";

function MapsContent() {
  const searchParams = useSearchParams();
  const [positionFamily, setPositionFamily] = useState("midfielders");
  const [positionFamilies, setPositionFamilies] = useState<{ key: string; label: string }[]>([...POSITION_FAMILIES]);
  const [options, setOptions] = useState<PlayerOption[]>([]);
  const [mapOpts, setMapOpts] = useState<{ scatter_metrics: { key: string; label: string }[]; pass_filters: { key: string; label: string }[] } | null>(null);
  const [playerId, setPlayerId] = useState(searchParams.get("player") ?? "");
  const [view, setView] = useState<"scatter" | "pass_map">("scatter");
  const [xKey, setXKey] = useState("xpass_coe_pct");
  const [yKey, setYKey] = useState("test_impact_v2_p90");
  const [passFilter, setPassFilter] = useState("progressive");
  const [scatter, setScatter] = useState<ScatterData | null>(null);
  const [passMap, setPassMap] = useState<{
    pass_map_b64?: string | null;
    dest_map_b64?: string | null;
    pass_map_url?: string | null;
    dest_map_url?: string | null;
    caption: string;
  } | null>(null);
  const [aggregated, setAggregated] = useState<{
    common_map_b64?: string | null;
    rare_map_b64?: string | null;
    common_map_url?: string | null;
    rare_map_url?: string | null;
    quadrant_stats: { quadrant: string; passes: number; share_pct: number }[];
  } | null>(null);
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
    Promise.all([
      getPlayerOptions({ position_family: positionFamily }),
      getMapsOptions(),
      getAggregatedMaps(positionFamily),
    ])
      .then(([opts, mopts, agg]) => {
        setOptions(opts.options);
        setMapOpts(mopts);
        setAggregated(agg);
        setPlayerId((current) => {
          const stillValid = opts.options.some((o) => o.player_id === current);
          if (stillValid) return current;
          return opts.options[0]?.player_id ?? "";
        });
      })
      .catch(() => setError("Backend indisponível"));
  }, [positionFamily]);

  useEffect(() => {
    if (view !== "scatter" || !playerId) return;
    setLoading(true);
    getScatter(xKey, yKey, playerId, positionFamily)
      .then(setScatter)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [view, xKey, yKey, playerId, positionFamily]);

  useEffect(() => {
    if (view !== "pass_map" || !playerId) return;
    setLoading(true);
    getPassMap(playerId, passFilter, "all", positionFamily)
      .then(setPassMap)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [view, passFilter, playerId, positionFamily]);

  return (
    <div className="container">
      <PageHero title="Maps" subtitle="Scatter e mapas de passes por pool de posição." icon="fa-map-location-dot" />

      {error && <div className="error-box">{error}</div>}

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
          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            {options.map((o) => <option key={o.player_id} value={o.player_id}>{o.label}</option>)}
          </select>
          <div className="view-toggle">
            <button type="button" className={view === "scatter" ? "active" : ""} onClick={() => setView("scatter")}>Scatter</button>
            <button type="button" className={view === "pass_map" ? "active" : ""} onClick={() => setView("pass_map")}>Pass map</button>
          </div>
        </div>
      </div>

      {loading && <LoadingState message="Gerando mapas…" />}

      {view === "scatter" && mapOpts && !loading && (
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

      {view === "pass_map" && mapOpts && !loading && (
        <>
          <div className="filters">
            <select value={passFilter} onChange={(e) => setPassFilter(e.target.value)}>
              {mapOpts.pass_filters.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          {passMap && (
            <div className="maps-grid">
              {imageSrcFromPayload(passMap.pass_map_url, passMap.pass_map_b64) && (
                <img src={imageSrcFromPayload(passMap.pass_map_url, passMap.pass_map_b64)!} alt="Pass map" className="map-img" />
              )}
              {imageSrcFromPayload(passMap.dest_map_url, passMap.dest_map_b64) && (
                <img src={imageSrcFromPayload(passMap.dest_map_url, passMap.dest_map_b64)!} alt="Destination heatmap" className="map-img" />
              )}
              <p className="muted" style={{ gridColumn: "1 / -1" }}>{passMap.caption}</p>
            </div>
          )}
        </>
      )}

      {aggregated && (
        <section style={{ marginTop: "2rem" }}>
          <h3 className="section-label" style={{ fontSize: "0.75rem", marginBottom: "0.75rem" }}>Visão agregada · top 250 por volume</h3>
          <div className="maps-grid">
            {imageSrcFromPayload(aggregated.common_map_url, aggregated.common_map_b64) && (
              <img src={imageSrcFromPayload(aggregated.common_map_url, aggregated.common_map_b64)!} alt="Common passes" className="map-img" />
            )}
            {imageSrcFromPayload(aggregated.rare_map_url, aggregated.rare_map_b64) && (
              <img src={imageSrcFromPayload(aggregated.rare_map_url, aggregated.rare_map_b64)!} alt="Rare passes" className="map-img" />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default function MapsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MapsContent />
    </Suspense>
  );
}
