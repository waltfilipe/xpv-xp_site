"use client";

import { useI18n } from "@/lib/i18n/context";

type Props = { message?: string };

export function LoadingState({ message }: Props) {
  const { t } = useI18n();
  return (
    <div className="loading-state">
      <div className="loading-spinner" aria-hidden="true" />
      <p>{message ?? t.common.loading}</p>
    </div>
  );
}
