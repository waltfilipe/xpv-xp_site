"use client";

import { totalReportCount } from "@/lib/playerReports";
import { useI18n } from "@/lib/i18n/context";

export function ReportsFootnote() {
  const { t } = useI18n();
  return (
    <p className="reports-footnote muted report-screen-only">
      {t.reports.footnote(totalReportCount())}
    </p>
  );
}
