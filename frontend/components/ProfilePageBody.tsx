"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { PlayerSearchRow } from "@/components/PlayerSearchRow";
import { ProfileFilters } from "@/components/ProfileFilters";
import { ProfileView } from "@/components/ProfileView";
import { getMeta, getPlayerOptions } from "@/lib/api";
import { mergeFilterOptions } from "@/lib/filterDefaults";
import type { FilterOptionsMeta } from "@/lib/filterTypes";
import { filtersFromRecord } from "@/lib/profileParams";

function ProfilePageBodyInner() {
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => filtersFromRecord(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );
  const family = filters.position_family ?? "midfielders";

  const [filterOptions, setFilterOptions] = useState<FilterOptionsMeta>(mergeFilterOptions());
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [options, setOptions] = useState<{ player_id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = searchParams.toString();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const currentFilters = filtersFromRecord(Object.fromEntries(searchParams.entries()));

    Promise.all([getMeta(family), getPlayerOptions(currentFilters)])
      .then(([meta, res]) => {
        if (cancelled) return;
        setFilterOptions(mergeFilterOptions(meta));
        setNationalities(meta.nationalities ?? []);
        setOptions(res.options);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Backend indisponível");
        setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [family, filterKey, searchParams]);

  const playerId = filters.player ?? options[0]?.player_id;

  if (loading) {
    return <LoadingState message="Carregando pool de jogadores…" />;
  }

  return (
    <>
      {error && (
        <p className="muted profile-empty-note">
          {error}. O backend pode levar alguns minutos no primeiro carregamento — tente novamente em instantes.
        </p>
      )}

      <ProfileFilters
        options={filterOptions}
        nationalities={nationalities}
        current={filters}
      />

      {options.length > 0 ? (
        <PlayerSearchRow options={options} currentId={playerId} filters={filters} />
      ) : !error ? (
        <p className="muted profile-empty-note">
          Nenhum jogador encontrado com estes filtros.
        </p>
      ) : null}

      {playerId ? <ProfileView playerId={playerId} positionFamily={family} /> : null}
    </>
  );
}

export function ProfilePageBody() {
  return (
    <Suspense fallback={<LoadingState message="Carregando perfil…" />}>
      <ProfilePageBodyInner />
    </Suspense>
  );
}
