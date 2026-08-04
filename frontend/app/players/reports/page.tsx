import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getPlayerProfile } from "@/lib/api";
import { enrichedReportPlayers, totalReportCount } from "@/lib/playerReports";
import { ReportsClient, type ReportEntry } from "./ReportsClient";

export const metadata = {
  title: "Player Reports | Pass Scout",
  description: "Curated midfielder scouting reports — PDF-ready for LinkedIn",
};

async function loadReports(): Promise<ReportEntry[]> {
  const entries = enrichedReportPlayers();

  const results = await Promise.all(
    entries.map(async (entry): Promise<ReportEntry> => {
      try {
        const profile = await getPlayerProfile(
          entry.playerId,
          entry.positionFamily ?? "midfielders",
        );
        return { entry, profile, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        return { entry, profile: null, error: msg };
      }
    }),
  );

  return results;
}

export default async function PlayerReportsPage() {
  const reports = await loadReports();
  const loaded = reports.filter((r) => r.profile).length;

  return (
    <div className="container reports-container">
      <div className="reports-intro-screen">
        <PageHero
          title="Player Reports"
          subtitle="Relatórios curados de meio-campistas — prontos para exportar em PDF e publicar no LinkedIn."
          icon="fa-file-lines"
        />

        <div className="reports-intro-actions report-screen-only">
          <Link href="/players" className="btn btn-ghost">
            <i className="fa-solid fa-arrow-left" /> Voltar à tabela
          </Link>
          <span className="muted">
            {loaded}/{totalReportCount()} perfis carregados
          </span>
        </div>
      </div>

      <ReportsClient reports={reports} />
    </div>
  );
}
