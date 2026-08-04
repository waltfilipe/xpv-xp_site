"use client";

import Image from "next/image";
import { PassLengthMix } from "@/components/PassLengthMix";
import { formatContractUntil } from "@/lib/formatters";

function FactIcon({ icon }: { icon: string }) {
  return (
    <span className="identity-fact-icon" aria-hidden="true">
      <i className={`fa-solid ${icon}`} />
    </span>
  );
}

type Props = {
  side: "a" | "b";
  player: Record<string, unknown>;
  heatmap?: string | null;
};

export function ComparePlayerCard({ side, player, heatmap }: Props) {
  return (
    <div className={`player-card identity-card compare-side compare-side-${side}`}>
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

      <PassLengthMix data={{
        long_pass_share_pct: player.long_pass_share_pct as number | null | undefined,
        long_pass_share_ref_avg_pct: player.long_pass_share_ref_avg_pct as number | null | undefined,
        long_pass_share_pctile: player.long_pass_share_pctile as number | null | undefined,
      }} />
    </div>
  );
}
