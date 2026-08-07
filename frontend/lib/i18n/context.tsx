"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en, type Locale, type TranslationDict } from "./en";
import { pt } from "./pt";

const STORAGE_KEY = "pass-scout-locale";

const dictionaries: Record<Locale, TranslationDict> = { en, pt };

type I18nContextValue = {
  locale: Locale;
  t: TranslationDict;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "pt") {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => (current === "en" ? "pt" : "en"));
  }, []);

  const value = useMemo(
    () => ({
      locale,
      t: dictionaries[locale],
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

const PASS_SCORE_TITLE_MAP: Record<string, keyof TranslationDict["passScore"]> = {
  Volume: "volume",
  Efficiency: "efficiency",
  "Build-up": "buildup",
  "Chance creation": "chanceCreation",
  Impact: "impact",
  "Defensive Contribution": "defensiveContribution",
};

export function translatePassScoreTitle(title: string, t: TranslationDict): string {
  const key = PASS_SCORE_TITLE_MAP[title];
  if (!key || key === "tooltips" || key === "components" || key === "componentTips") {
    return title;
  }
  return t.passScore[key];
}

export function translatePassScoreTooltip(title: string, t: TranslationDict): string {
  const key = PASS_SCORE_TITLE_MAP[title];
  if (!key || key === "tooltips") return "";
  const tipKey = key as keyof TranslationDict["passScore"]["tooltips"];
  return t.passScore.tooltips[tipKey] ?? "";
}

export function translateComponentLabel(key: string, t: TranslationDict): string {
  const labels = t.passScore.components as Record<string, string>;
  return labels[key] ?? key.replace(/_/g, " ");
}

export function translateComponentTip(key: string, t: TranslationDict): string {
  const tips = t.passScore.componentTips as Record<string, string>;
  return tips[key] ?? "";
}

export function translateXpBarLabel(key: string, t: TranslationDict): string {
  if (key === "xp_activity_display") return t.xpProfile.productivity;
  if (key === "xp_efficiency_display") return t.xpProfile.precision;
  if (key === "xp_edge_display") return t.xpProfile.lethality;
  return key;
}

export function translateIndexLabel(label: string, t: TranslationDict): string {
  if (label === "Consistency") return t.xpProfile.consistency;
  if (label === "Impact") return t.xpProfile.impact;
  if (label === "Defensive Contribution") return t.xpProfile.defense;
  return label;
}

export function translateIndexTip(tierKey: string | undefined, label: string, t: TranslationDict): string {
  if (tierKey === "xp_idx_consistency" || label === "Consistency") return t.xpProfile.indexTips.consistency;
  if (tierKey === "xp_idx_impact" || label === "Impact") return t.xpProfile.indexTips.impact;
  if (tierKey === "xp_idx_defense" || label === "Defensive Contribution") return t.xpProfile.indexTips.defense;
  return "";
}

export function translateTier(tier: string | null | undefined, t: TranslationDict): string {
  const map = t.xpProfile.tiers as Record<string, string>;
  return map[tier ?? "mid"] ?? tier ?? "—";
}
