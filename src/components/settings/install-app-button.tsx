"use client";

import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { usePwaInstall } from "@/lib/use-pwa-install";

export function InstallAppButton() {
  const { canInstall, installed, install } = usePwaInstall();
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">Install App</p>
        <p className="text-xs text-muted">
          Pasang Semangat Brow sebagai aplikasi agar bisa dibuka layaknya app native.
        </p>
      </div>
      {installed ? (
        <Button variant="secondary" disabled>
          <Check className="size-4" aria-hidden />
          Terpasang
        </Button>
      ) : (
        <Button
          variant="secondary"
          disabled={!canInstall}
          onClick={() => {
            void install().then((accepted) => {
              if (accepted) toast({ title: "TaskCanvas dipasang", tone: "success" });
            });
          }}
        >
          <Download className="size-4" aria-hidden />
          Install App
        </Button>
      )}
    </div>
  );
}
