"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CompareCenter } from "@/components/CompareCenter";
import { ComparePlayerCard } from "@/components/ComparePlayerCard";
import { LoadingState } from "@/components/LoadingState";
import { getCompare, getPlayerOptionsLegacy, type ComparePayload } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";

const POSITION_FAMILY = "midfielders";

export default function ComparePageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [playerA, setPlayerA] = useState(searchParams.get("a") ?? "");
  const [playerB, setPlayerB] = useState(searchParams.get("b") ?? "");
  const [data, setData] = useState<ComparePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapsMode, setMapsMode] = useState(false);

  useEffect(() => {
    getPlayerOptionsLegacy({ position_family: POSITION_FAMILY }).then((r) => {
      if (!playerA && r.options[0]) setPlayerA(r.options[0].player_id);
      if (!playerB && r.options[1]) setPlayerB(r.options[1].player_id);
    }).catch(() => setError(t.common.backendUnavailable));
  }, [playerA, playerB, t.common.backendUnavailable]);

  useEffect(() => {
    if (!playerA || !playerB || playerA === playerB) return;
    setLoading(true);
    getCompare(playerA, playerB, POSITION_FAMILY)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : t.common.error))
      .finally(() => setLoading(false));
  }, [playerA, playerB, t.common.error]);

  const nameA = data ? String(data.player_a.player_name ?? t.common.playerA) : t.common.playerA;
  const nameB = data ? String(data.player_b.player_name ?? t.common.playerB) : t.common.playerB;

  return (
    <div className="profile-page compare-page">
      <header className="profile-page-hero compare-page-hero">
        <div className="container">
          <div className="profile-page-hero-inner">
            <div>
              <span className="profile-page-eyebrow">Pass Scout</span>
              <h1>{t.compare.title}</h1>
              <p>{t.compare.description}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container profile-page-body">
        {loading && <LoadingState message={t.compare.loading} />}
        {error && <div className="error-box">{error}</div>}

        {data && !loading && (
          <div className={`compare-layout${mapsMode ? " compare-layout-maps" : ""}`}>
            <ComparePlayerCard
              side="a"
              player={data.player_a}
              heatmap={data.heatmap_a_b64}
              playerId={playerA}
              excludePlayerId={playerB}
              onPlayerChange={setPlayerA}
              mapsMode={mapsMode}
              onToggleMaps={() => setMapsMode((v) => !v)}
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
              playerId={playerB}
              excludePlayerId={playerA}
              onPlayerChange={setPlayerB}
              mapsMode={mapsMode}
              onToggleMaps={() => setMapsMode((v) => !v)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
