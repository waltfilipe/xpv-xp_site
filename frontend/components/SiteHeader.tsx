"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export function SiteHeader() {
  const { t, toggleLocale } = useI18n();

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand">
          <span className="brand-icon"><i className="fa-solid fa-futbol" /></span>
          Pass<span>Scout</span>
        </Link>
        <nav className="nav">
          <Link href="/reports">{t.nav.reports}</Link>
          <Link href="/profile">{t.nav.profile}</Link>
          <Link href="/compare">{t.nav.compare}</Link>
          <Link href="/maps">{t.nav.maps}</Link>
          <Link href="/players">{t.nav.players}</Link>
          <button
            type="button"
            className="lang-toggle"
            onClick={toggleLocale}
            aria-label={t.nav.languageAria}
          >
            {t.nav.language}
          </button>
        </nav>
      </div>
    </header>
  );
}
