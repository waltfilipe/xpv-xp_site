import { ReportsClient } from "./ReportsClient";
import { ReportsFootnote } from "./ReportsFootnote";

export const metadata = {
  title: "Reports | Pass Scout",
  description: "Curated midfielder scouting reports with xP grades, pass scores and pass maps",
};

export default function ReportsPage() {
  return (
    <div className="container reports-container">
      <ReportsClient />
      <ReportsFootnote />
    </div>
  );
}
