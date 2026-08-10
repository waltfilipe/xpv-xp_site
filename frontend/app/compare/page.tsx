"use client";

import { Suspense } from "react";
import { LoadingState } from "@/components/LoadingState";
import ComparePageContent from "./ComparePageContent";

export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingState message="Carregando comparação…" />}>
      <ComparePageContent />
    </Suspense>
  );
}
