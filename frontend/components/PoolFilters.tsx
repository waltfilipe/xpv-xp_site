"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useTransition } from "react";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  leagues: { key: string; label: string }[];
  currentLeague?: string;
  currentSearch?: string;
  actionPath: string;
};

export function PoolFilters({ leagues, currentLeague, currentSearch, actionPath }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const league = String(form.get("league") || "");
    const search = String(form.get("search") || "").trim();
    if (league && league !== "all") params.set("league", league);
    if (search) params.set("search", search);
    startTransition(() => router.push(`${actionPath}?${params.toString()}`));
  }

  return (
    <div className="filter-card">
      <div className="filter-head">
        <span className="filter-title">
          <i className="fa-solid fa-sliders" /> {t.poolFilters.title}
        </span>
        <span className="filter-sub">{t.poolFilters.subtitle}</span>
      </div>
      <form className="filters" style={{ marginBottom: 0 }} onSubmit={onSubmit}>
        <input
          name="search"
          type="search"
          placeholder={t.poolFilters.searchPlaceholder}
          defaultValue={currentSearch ?? searchParams.get("search") ?? ""}
        />
        <select name="league" defaultValue={currentLeague ?? searchParams.get("league") ?? "all"}>
          {leagues.map((l) => (
            <option key={l.key} value={l.key}>{l.label}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "…" : t.poolFilters.filter}
        </button>
      </form>
    </div>
  );
}
