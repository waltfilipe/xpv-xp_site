import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { totalReportCount } from "@/lib/playerReports";
import { ReportsClient } from "./ReportsClient";

export const metadata = {
  title: "Reports | Pass Scout",
  description: "Curated midfielder scouting reports — PDF-ready for LinkedIn",
};

export default function ReportsPage() {
  return (
    <div className="container reports-container">
      <div className="reports-intro-screen">
        <PageHero
          title="Reports"
          subtitle="Relatórios curados de meio-campistas — overview, grades por rodada e mapas de passe. Prontos para PDF e LinkedIn."
          icon="fa-file-lines"
        />

        <div className="reports-intro-actions report-screen-only">
          <Link href="/players" className="btn btn-ghost">
            <i className="fa-solid fa-table-list" /> Tabela de jogadores
          </Link>
          <span className="muted">{totalReportCount()} relatórios curados</span>
        </div>
      </div>

      <ReportsClient />
    </div>
  );
}
