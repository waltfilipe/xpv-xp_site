import Link from "next/link";
import { getMeta } from "@/lib/api";

export default async function HomePage() {
  let meta = { player_count: 0, description: "", leagues: [] as string[] };
  try {
    meta = await getMeta();
  } catch {
    // Backend may be offline during static build
  }

  return (
    <div className="container">
      <section className="hero">
        <h1>Pass Scout</h1>
        <p>
          Análise de passes de meio-campistas europeus — xT v4, xP, ratings de progressão e
          perfis de jogadores das principais ligas.
        </p>
      </section>

      <div className="stats-row">
        <div className="card stat-card">
          <div className="value">{meta.player_count || "—"}</div>
          <div className="label">Meio-campistas</div>
        </div>
        <div className="card stat-card">
          <div className="value">{meta.leagues.length || 5}</div>
          <div className="label">Ligas europeias</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <p className="muted" style={{ marginBottom: "1rem" }}>
          {meta.description ||
            "Premier League, Serie A, La Liga, Bundesliga e Ligue 1."}
        </p>
        <Link href="/players" className="btn">
          Ver jogadores
        </Link>
      </div>
    </div>
  );
}
