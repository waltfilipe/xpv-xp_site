"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  playerCount: number;
  leagueCount: number;
  description?: string;
};

const MODULE_KEYS = ["reports", "profile", "compare", "maps", "players"] as const;
const MODULE_META = {
  reports: { href: "/reports", icon: "fa-file-lines", accent: "#a78bfa", featured: true },
  profile: { href: "/profile", icon: "fa-user", accent: "#38bdf8", featured: false },
  compare: { href: "/compare", icon: "fa-scale-balanced", accent: "#34d399", featured: false },
  maps: { href: "/maps", icon: "fa-map-location-dot", accent: "#fbbf24", featured: false },
  players: { href: "/players", icon: "fa-table-list", accent: "#94a3b8", featured: false },
} as const;

export function HomePageContent({ playerCount, leagueCount, description }: Props) {
  const { t } = useI18n();

  return (
    <div className="container home-page">
      <section className="home-intro">
        <p className="home-eyebrow">{t.home.eyebrow}</p>
        <h1 className="home-title">
          Pass<span>Scout</span>
        </h1>
        <p className="home-lead">{t.home.lead}</p>
        <div className="home-stats">
          <span className="home-stat">
            <strong className="tabular">{playerCount || "—"}</strong> {t.home.players}
          </span>
          <span className="home-stat-sep" aria-hidden="true" />
          <span className="home-stat">
            <strong>{leagueCount || 5}</strong> {t.home.leagues}
          </span>
          <span className="home-stat-sep" aria-hidden="true" />
          <span className="home-stat">
            <strong>xP</strong> {t.home.model} M4
          </span>
        </div>
      </section>

      <nav className="home-modules" aria-label={t.home.modulesAria}>
        {MODULE_KEYS.map((key) => {
          const meta = MODULE_META[key];
          const mod = t.home.modules[key];
          return (
            <Link
              key={meta.href}
              href={meta.href}
              className={`home-module-card${meta.featured ? " home-module-featured" : ""}`}
              style={{ "--module-accent": meta.accent } as React.CSSProperties}
            >
              <span className="home-module-icon" aria-hidden="true">
                <i className={`fa-solid ${meta.icon}`} />
              </span>
              <span className="home-module-body">
                <span className="home-module-title">{mod.title}</span>
                <span className="home-module-desc">{mod.description}</span>
              </span>
              <span className="home-module-arrow" aria-hidden="true">
                <i className="fa-solid fa-arrow-right" />
              </span>
            </Link>
          );
        })}
      </nav>

      <p className="home-footnote muted">{description || t.home.footnote}</p>
    </div>
  );
}
