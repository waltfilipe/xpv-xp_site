"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ComparePlayerPicker } from "@/components/ComparePlayerPicker";
import { CompareXpIndicesStrip } from "@/components/CompareXpIndicesStrip";
import { PassLengthMix } from "@/components/PassLengthMix";
import { getPassMap } from "@/lib/api";
import { formatContractUntil } from "@/lib/formatters";

export const COMPARE_MAP_FILTERS: { key: string; label: string }[] = [
  { key: "progressive", label: "Progressive Passes" },
  { key: "test_impact_v2", label: "Impact Passes" },
  { key: "line_break", label: "Breakline passes" },
  { key: "key_passes", label: "Key Passes" },
];

const POSITION_FAMILY = "midfielders";

function FactIcon({ icon }: { icon: string }) {
  return (
    <span className="identity-fact-icon" aria-hidden="true">
      <i className={`fa-solid ${icon}`} />
    </span>
  );
}

type IndexItem = {
  key: string;
  label: string;
  tier?: string | null;
  icon?: string;
};

type Props = {
  side: "a" | "b";
  player: Record<string, unknown>;
  heatmap?: string | null;
  playerId: string;
  excludePlayerId?: string;
  onPlayerChange: (playerId: string) => void;
  mapsMode?: boolean;
  onToggleMaps?: () => void;
};

type MapSlot = {
  key: string;
  label: string;
  pass_map_b64?: string | null;
  loading?: boolean;
  error?: string | null;
};

export function ComparePlayerCard({
  side,
  player,
  heatmap,
  playerId,
  excludePlayerId,
  onPlayerChange,
  mapsMode = false,
  onToggleMaps,
}: Props) {
  const [mapSlots, setMapSlots] = useState<MapSlot[]>([]);
  const xpIndices = (player.xp_indices as IndexItem[] | undefined) ?? [];

  useEffect(() => {
    if (!mapsMode || !playerId) {
      setMapSlots([]);
      return;
    }

    let cancelled = false;
    setMapSlots(COMPARE_MAP_FILTERS.map((f) => ({ ...f, loading: true })));

    (async () => {
      const next = await Promise.all(
        COMPARE_MAP_FILTERS.map(async (filter) => {
          try {
            const res = await getPassMap(playerId, filter.key, "all", POSITION_FAMILY);
            return {
              key: filter.key,
              label: filter.label,
              pass_map_b64: res.pass_map_b64,
              loading: false,
              error: null,
            } satisfies MapSlot;
          } catch (e) {
            return {
              key: filter.key,
              label: filter.label,
              loading: false,
              error: e instanceof Error ? e.message : "Falha ao carregar mapa",
            } satisfies MapSlot;
          }
        }),
      );
      if (!cancelled) setMapSlots(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [mapsMode, playerId]);

  if (mapsMode) {
    return (
      <div className={`player-card compare-side compare-side-${side} compare-side-maps`}>
        <ComparePlayerPicker
          label={`Jogador ${side === "a" ? "A" : "B"}`}
          value={playerId}
          exclude={excludePlayerId}
          onChange={onPlayerChange}
        />
        <h2 className="compare-maps-player-name">{String(player.player_name ?? "—")}</h2>
        <div className="compare-maps-stack">
          {mapSlots.map((slot) => (
            <div key={slot.key} className="compare-map-slot">
              <span className="compare-map-slot-label">{slot.label}</span>
              {slot.loading && <div className="compare-map-slot-skeleton" aria-busy="true" />}
              {slot.error && !slot.pass_map_b64 && (
                <p className="placeholder-note compare-map-slot-error">{slot.error}</p>
              )}
              {slot.pass_map_b64 && (
                <img
                  src={`data:image/png;base64,${slot.pass_map_b64}`}
                  alt={slot.label}
                  className="heatmap-img compare-map-slot-img"
                />
              )}
            </div>
          ))}
        </div>
        {onToggleMaps && (
          <button type="button" className="compare-maps-toggle-btn" onClick={onToggleMaps}>
            <i className="fa-solid fa-user" />
            Voltar ao perfil
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`player-card identity-card compare-side compare-side-${side}`}>
      <ComparePlayerPicker
        label={`Jogador ${side === "a" ? "A" : "B"}`}
        value={playerId}
        exclude={excludePlayerId}
        onChange={onPlayerChange}
      />

      <div className="identity-hero identity-hero-side">
        <div className="identity-photo-side">
          {player.photo_url ? (
            <Image
              src={String(player.photo_url)}
              alt=""
              fill
              className="identity-photo"
              unoptimized
              sizes="160px"
            />
          ) : (
            <div className="identity-photo-placeholder identity-photo-placeholder-side">
              {String(player.player_name ?? "?").charAt(0)}
            </div>
          )}
        </div>

        <div className="identity-hero-text">
          <h2 className="identity-title">{String(player.player_name ?? "—")}</h2>
          <p className="identity-subline">
            {String(player.team ?? "—")} · {String(player.position ?? "—")}
          </p>

          <div className="identity-facts identity-facts-side">
            <div className="identity-fact">
              <FactIcon icon="fa-cake-candles" />
              <span className="identity-fact-label">Idade</span>
              <span className="identity-fact-value tabular">{player.age != null ? String(player.age) : "—"}</span>
            </div>
            <div className="identity-fact">
              <FactIcon icon="fa-ruler-vertical" />
              <span className="identity-fact-label">Altura</span>
              <span className="identity-fact-value">{String(player.height ?? "—")}</span>
            </div>
            <div className="identity-fact">
              <FactIcon icon="fa-earth-americas" />
              <span className="identity-fact-label">Nacionalidade</span>
              <span className="identity-fact-value">{String(player.nationality ?? "—")}</span>
            </div>
            <div className="identity-fact">
              <FactIcon icon="fa-shoe-prints" />
              <span className="identity-fact-label">Pé</span>
              <span className="identity-fact-value">{String(player.dominant_foot ?? "—")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="identity-meta-row">
        <div className="identity-meta-pill">
          <span><FactIcon icon="fa-coins" /> Valor</span>
          <strong>{String(player.market_value ?? "—")}</strong>
        </div>
        <div className="identity-meta-pill">
          <span><FactIcon icon="fa-calendar-days" /> Contrato</span>
          <strong>{formatContractUntil(player.contract_until)}</strong>
        </div>
        <div className="identity-meta-pill">
          <span><FactIcon icon="fa-clock" /> Minutos</span>
          <strong className="tabular">{player.minutes != null ? String(player.minutes) : "—"}</strong>
        </div>
      </div>

      {heatmap && (
        <img src={`data:image/png;base64,${heatmap}`} alt="Origem dos passes" className="heatmap-img" />
      )}

      <CompareXpIndicesStrip indices={xpIndices} />

      <PassLengthMix data={{
        long_pass_share_pct: player.long_pass_share_pct as number | null | undefined,
        long_pass_share_ref_avg_pct: player.long_pass_share_ref_avg_pct as number | null | undefined,
        long_pass_share_pctile: player.long_pass_share_pctile as number | null | undefined,
      }} />

      {onToggleMaps && (
        <button type="button" className="compare-maps-toggle-btn" onClick={onToggleMaps}>
          <i className="fa-solid fa-map-location-dot" />
          Comparar mapas
        </button>
      )}
    </div>
  );
}
