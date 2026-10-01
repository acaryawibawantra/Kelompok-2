import { Skeleton } from "@/components/ui/skeleton";

export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm space-y-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
      </div>
    </div>
  );
}
