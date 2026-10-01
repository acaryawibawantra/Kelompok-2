"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { FontPicker, ThemePicker } from "@/components/settings/font-picker";
import { PreferencesSection } from "@/components/settings/preferences-section";
import { AccountSection } from "@/components/settings/account-section";
import { InstallAppButton } from "@/components/settings/install-app-button";
import { useUpdateMe } from "@/lib/queries";
import { useSettingsStore } from "@/lib/stores/settings-store";

function SettingsCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
      <h2 className="font-title text-2xl text-foreground">{title}</h2>
      {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const theme = useSettingsStore((state) => state.theme);
  const titleFont = useSettingsStore((state) => state.titleFont);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setTitleFont = useSettingsStore((state) => state.setTitleFont);
  const updateMe = useUpdateMe();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Preferensi"
        title="Pengaturan"
        description="Sesuaikan tampilan, target harian, dan akunmu."
      />

      <div className="mt-8 space-y-5">
        <SettingsCard
          title="Gaya Font Judul"
          description="Berlaku seketika di seluruh aplikasi."
        >
          <FontPicker
            value={titleFont}
            onChange={(font) => {
              setTitleFont(font);
              updateMe.mutate({ settings: { titleFont: font } });
            }}
          />
        </SettingsCard>

        <SettingsCard title="Tema" description="Terang, gelap, atau mengikuti sistem.">
          <ThemePicker
            value={theme}
            onChange={(next) => {
              setTheme(next);
              updateMe.mutate({ settings: { theme: next } });
            }}
          />
        </SettingsCard>

        <SettingsCard title="Target & Zona Waktu">
          <PreferencesSection />
        </SettingsCard>

        <SettingsCard title="Akun">
          <AccountSection />
        </SettingsCard>

        <SettingsCard title="Aplikasi" description="Pasang TaskCanvas di perangkatmu.">
          <InstallAppButton />
        </SettingsCard>
      </div>
    </div>
  );
}
