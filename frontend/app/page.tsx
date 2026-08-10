import Link from "next/link";
import { getMeta } from "@/lib/api";

const MODULES = [
  {
    href: "/reports",
    title: "Reports",
    description: "Relatórios PDF-ready de 45 meias — grades xP, pass scores e mapas por categoria etária.",
    icon: "fa-file-lines",
    accent: "#a78bfa",
    featured: true,
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Perfil completo do jogador — radar de passes, índices xP e heatmaps de origem.",
    icon: "fa-user",
    accent: "#38bdf8",
  },
  {
    href: "/compare",
    title: "Compare",
    description: "Compare dois jogadores lado a lado dentro do mesmo pool de posição.",
    icon: "fa-scale-balanced",
    accent: "#34d399",
  },
  {
    href: "/maps",
    title: "Maps",
    description: "Mapas de passes e scatter de métricas — progressive, impact, line break e mais.",
    icon: "fa-map-location-dot",
    accent: "#fbbf24",
  },
  {
    href: "/players",
    title: "Players",
    description: "Lista completa do pool com ratings, filtros e ordenação por métrica.",
    icon: "fa-table-list",
    accent: "#94a3b8",
  },
] as const;

export default async function HomePage() {
  let meta = { player_count: 0, description: "", leagues: [] as string[] };
  try {
    meta = await getMeta();
  } catch {
    /* backend offline */
  }

  return (
    <div className="container home-page">
      <section className="home-intro">
        <p className="home-eyebrow">European pass analytics</p>
        <h1 className="home-title">
          Pass<span>Scout</span>
        </h1>
        <p className="home-lead">
          Análise de passes por posição nas 5 grandes ligas europeias — xP M4, ratings de
          progressão e perfis comparativos dentro de cada pool.
        </p>
        <div className="home-stats">
          <span className="home-stat">
            <strong className="tabular">{meta.player_count || "—"}</strong> jogadores
          </span>
          <span className="home-stat-sep" aria-hidden="true" />
          <span className="home-stat">
            <strong>{meta.leagues.length || 5}</strong> ligas
          </span>
          <span className="home-stat-sep" aria-hidden="true" />
          <span className="home-stat">
            <strong>xP</strong> modelo M4
          </span>
        </div>
      </section>

      <nav className="home-modules" aria-label="Módulos do Pass Scout">
        {MODULES.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className={`home-module-card${"featured" in mod && mod.featured ? " home-module-featured" : ""}`}
            style={{ "--module-accent": mod.accent } as React.CSSProperties}
          >
            <span className="home-module-icon" aria-hidden="true">
              <i className={`fa-solid ${mod.icon}`} />
            </span>
            <span className="home-module-body">
              <span className="home-module-title">{mod.title}</span>
              <span className="home-module-desc">{mod.description}</span>
            </span>
            <span className="home-module-arrow" aria-hidden="true">
              <i className="fa-solid fa-arrow-right" />
            </span>
          </Link>
        ))}
      </nav>

      <p className="home-footnote muted">
        {meta.description || "Premier League, Serie A, La Liga, Bundesliga e Ligue 1."}
      </p>
    </div>
  );
}
