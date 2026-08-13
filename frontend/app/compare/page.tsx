"use client";

import { Suspense } from "react";
import { LoadingState } from "@/components/LoadingState";
import { useI18n } from "@/lib/i18n/context";
import ComparePageContent from "./ComparePageContent";

function ComparePageFallback() {
  const { t } = useI18n();
  return <LoadingState message={t.compare.loading} />;
}

export default function ComparePage() {
  return (
    <Suspense fallback={<ComparePageFallback />}>
      <ComparePageContent />
    </Suspense>
  );
}
