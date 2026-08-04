"use client";

import { useCallback, useState } from "react";
import type { PlayerProfile } from "@/lib/api";
import { PLAYER_REPORT_CATEGORIES, type EnrichedReportPlayer } from "@/lib/playerReports";
import { PlayerReportSheet, type PlayerReportMaps } from "@/components/PlayerReportSheet";

export type ReportEntry = {
  entry: EnrichedReportPlayer;
  profile: PlayerProfile | null;
  maps: PlayerReportMaps | null;
  error: string | null;
};

type Props = {
  reports: ReportEntry[];
};

export function ReportsClient({ reports }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [printing, setPrinting] = useState(false);

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
          >
            <i className="fa-solid fa-file-pdf" /> Exportar PDF
            {activeCategory !== "all" ? " (categoria)" : ""}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handlePrint("all")}
          >
            <i className="fa-solid fa-print" /> Exportar todos
          </button>
        </div>
      </div>

      <p className="reports-hint muted report-screen-only">
        {okCount} relatórios carregados. Cada atleta tem <strong>Overview</strong> e{" "}
        <strong>Maps</strong> — no PDF, as duas páginas são exportadas em sequência.
      </p>

      <div className="reports-stack">
        {visibleReports.map((item) => {
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
            />
          );
        })}
      </div>
    </div>
  );
}
