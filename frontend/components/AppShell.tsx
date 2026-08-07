"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SiteHeader />
      <main>{children}</main>
    </I18nProvider>
  );
}
