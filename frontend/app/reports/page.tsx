import { totalReportCount } from "@/lib/playerReports";
import { ReportsClient } from "./ReportsClient";

export const metadata = {
  title: "Reports | Pass Scout",
  description: "Curated midfielder scouting reports with xP grades, pass scores and pass maps",
};

export default function ReportsPage() {
  return (
    <div className="container reports-container">
      <ReportsClient />
      <p className="reports-footnote muted report-screen-only">
        {totalReportCount()} atletas · pool meio-campistas · 5 ligas europeias
      </p>
    </div>
  );
}
