"use client";

import { useCallback, useEffect, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { PlayerReportSheet, type PlayerReportMaps } from "@/components/PlayerReportSheet";
import { getPlayerProfile, type PlayerProfile } from "@/lib/api";
import {
  enrichedReportPlayers,
  PLAYER_REPORT_CATEGORIES,
  type EnrichedReportPlayer,
} from "@/lib/playerReports";

export type ReportEntry = {
  entry: EnrichedReportPlayer;
  profile: PlayerProfile | null;
  maps: PlayerReportMaps | null;
  error: string | null;
  loading?: boolean;
};

const PROFILE_CONCURRENCY = 4;

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

function emptyReports(): ReportEntry[] {
  return enrichedReportPlayers().map((entry) => ({
    entry,
    profile: null,
    maps: null,
    error: null,
    loading: true,
  }));
}

export function ReportsClient() {
  const [reports, setReports] = useState<ReportEntry[]>(emptyReports);
  const [bootLoading, setBootLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const entries = enrichedReportPlayers();

    mapPool(entries, PROFILE_CONCURRENCY, async (entry) => {
      const family = entry.positionFamily ?? "midfielders";
      try {
        const profile = await getPlayerProfile(entry.playerId, family);
        return { entry, profile, maps: null, error: null, loading: false } satisfies ReportEntry;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        return { entry, profile: null, maps: null, error: msg, loading: false } satisfies ReportEntry;
      }
    }).then((loaded) => {
      if (!cancelled) {
        setReports(loaded);
        setBootLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const patchReport = useCallback((playerId: string, patch: Partial<ReportEntry>) => {
    setReports((prev) =>
      prev.map((item) =>
        item.entry.playerId === playerId ? { ...item, ...patch } : item,
      ),
    );
  }, []);

  const visibleReports =
    activeCategory === "all"
      ? reports
      : reports.filter((r) => r.entry.category.id === activeCategory);

  const handlePrint = useCallback((scope: string) => {
    setPrinting(true);
    document.body.dataset.printScope = scope;

    const bundles = document.querySelectorAll<HTMLElement>(".player-report-bundle");
    bundles.forEach((bundle) => {
      const cat = bundle.dataset.category ?? "";
      const hide = scope !== "all" && cat !== scope;
      bundle.classList.toggle("report-print-hidden", hide);
    });

    const restore = () => {
      bundles.forEach((bundle) => bundle.classList.remove("report-print-hidden"));
      delete document.body.dataset.printScope;
      setPrinting(false);
      window.removeEventListener("afterprint", restore);
    };

    window.addEventListener("afterprint", restore);
    window.print();
  }, []);

  const okCount = reports.filter((r) => r.profile).length;
  const loadingCount = reports.filter((r) => r.loading).length;

  return (
    <div className={`reports-page${printing ? " reports-printing" : ""}`}>
      <div className="reports-toolbar">
        <div className="reports-toolbar-filters">
          <button
            type="button"
            className={`reports-filter-btn${activeCategory === "all" ? " active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            Todos ({reports.length})
          </button>
          {PLAYER_REPORT_CATEGORIES.map((cat) => {
            const count = reports.filter((r) => r.entry.category.id === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                className={`reports-filter-btn${activeCategory === cat.id ? " active" : ""}`}
                style={
                  activeCategory === cat.id
                    ? { borderColor: `${cat.accent}66`, color: cat.accent }
                    : undefined
                }
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.title.split(" — ")[0]} ({count})
              </button>
            );
          })}
        </div>

        <div className="reports-toolbar-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => handlePrint(activeCategory)}
            disabled={bootLoading || loadingCount > 0}
          >
            <i className="fa-solid fa-file-pdf" /> Exportar PDF
            {activeCategory !== "all" ? " (categoria)" : ""}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handlePrint("all")}
            disabled={bootLoading || loadingCount > 0}
          >
            <i className="fa-solid fa-print" /> Exportar todos
          </button>
        </div>
      </div>

      <p className="reports-hint muted report-screen-only">
        {bootLoading
          ? "Carregando relatórios em lotes para não sobrecarregar o backend…"
          : `${okCount} relatórios prontos. Mapas carregam ao clicar em Ver mapas em cada atleta.`}
      </p>

      {bootLoading && loadingCount === reports.length && (
        <LoadingState message="Carregando primeiros relatórios…" />
      )}

      <div className="reports-stack">
        {visibleReports.map((item) => {
          if (item.loading) {
            return (
              <div key={item.entry.playerId} className="player-report-bundle">
                <div className="player-report-sheet report-loading-sheet">
                  <LoadingState message={`Carregando ${item.entry.playerId}…`} />
                </div>
              </div>
            );
          }

          if (!item.profile) {
            return (
              <div key={item.entry.playerId} className="player-report-bundle report-error-bundle">
                <div className="player-report-sheet report-error-sheet">
                  <p className="error-box">
                    Falha ao carregar jogador {item.entry.playerId}
                    {item.error ? `: ${item.error}` : ""}
                  </p>
                </div>
              </div>
            );
          }

          const globalIndex = reports.findIndex(
            (r) => r.entry.playerId === item.entry.playerId,
          );

          return (
            <PlayerReportSheet
              key={item.entry.playerId}
              entry={item.entry}
              profile={item.profile}
              maps={item.maps}
              index={globalIndex}
              onMapsLoaded={(maps) => patchReport(item.entry.playerId, { maps })}
            />
          );
        })}
      </div>
    </div>
  );
}
