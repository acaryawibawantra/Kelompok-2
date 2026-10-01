"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useMe, useUpdateMe } from "@/lib/queries";

const TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

export function PreferencesSection() {
  const { data: user } = useMe();
  const updateMe = useUpdateMe();
  const { toast } = useToast();

  const [goal, setGoal] = useState(user?.settings.dailyGoal ?? 3);
  const [timezone, setTimezone] = useState(user?.timezone ?? "Asia/Jakarta");
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);

  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id);
    setGoal(user.settings.dailyGoal);
    setTimezone(user.timezone);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="daily-goal">Target harian (task selesai)</Label>
        <div className="flex items-center gap-3">
          <input
            id="daily-goal"
            type="range"
            min={1}
            max={20}
            value={goal}
            onChange={(event) => setGoal(Number(event.target.value))}
            className="h-2 w-full max-w-xs cursor-pointer appearance-none rounded-full bg-surface-2 accent-brand-600"
          />
          <span className="grid size-9 place-items-center rounded-lg bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            {goal}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timezone">Zona waktu</Label>
        <select
          id="timezone"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          className="h-10 max-w-xs rounded-xl border border-border bg-surface px-3 text-sm focus-visible:border-brand-400"
        >
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted">
          Digunakan untuk menghitung streak dan jatuh tempo harian.
        </p>
      </div>

      <Button
        variant="secondary"
        loading={updateMe.isPending}
        onClick={() =>
          updateMe.mutate(
            { timezone, settings: { dailyGoal: goal } },
            {
              onSuccess: () => toast({ title: "Preferensi disimpan", tone: "success" }),
              onError: () => toast({ title: "Gagal menyimpan preferensi", tone: "error" }),
            },
          )
        }
      >
        Simpan preferensi
      </Button>
    </div>
  );
}
