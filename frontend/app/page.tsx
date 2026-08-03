import Link from "next/link";
import { getMeta } from "@/lib/api";

export default async function HomePage() {
  let meta = { player_count: 0, description: "", leagues: [] as string[] };
  try {
    meta = await getMeta();
  } catch { /* backend offline */ }

  return (
    <div className="container">
      <section className="home-hero">
        <h1>Pass Scout</h1>
        <p>
          Análise de passes de meio-campistas europeus — xT v4, xP, ratings de progressão
          e perfis das 5 grandes ligas europeias.
        </p>
        <div className="home-cta">
          <Link href="/profile" className="btn btn-primary">
            <i className="fa-solid fa-user" /> Player Profile
          </Link>
          <Link href="/compare" className="btn btn-ghost">
            <i className="fa-solid fa-scale-balanced" /> Compare
          </Link>
          <Link href="/maps" className="btn btn-ghost">
            <i className="fa-solid fa-map-location-dot" /> Maps
          </Link>
        </div>
      </section>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="value">{meta.player_count || "—"}</div>
          <div className="label">Meio-campistas</div>
        </div>
        <div className="card stat-card">
          <div className="value">{meta.leagues.length || 5}</div>
          <div className="label">Ligas europeias</div>
        </div>
        <div className="card stat-card">
          <div className="value">xP</div>
          <div className="label">Modelo M4</div>
        </div>
      </div>

      <div className="card" style={{ textAlign: "center" }}>
        <p className="muted" style={{ marginBottom: "1rem" }}>
          {meta.description || "Premier League, Serie A, La Liga, Bundesliga e Ligue 1."}
        </p>
        <Link href="/players" className="btn btn-ghost">
          <i className="fa-solid fa-table-list" /> Ver lista completa
        </Link>
      </div>
    </div>
  );
}
