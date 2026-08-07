"use client";

import { useI18n } from "@/lib/i18n/context";

export function ProfilePageHero() {
  const { t } = useI18n();

  return (
    <header className="profile-page-hero">
      <div className="container profile-page-hero-inner">
        <div className="profile-page-hero-copy">
          <span className="profile-page-eyebrow">Pass Scout</span>
          <h1>{t.profile.title}</h1>
          <p>{t.profile.description}</p>
        </div>
      </div>
    </header>
  );
}
