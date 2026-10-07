"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Pencil, Plus, RotateCcw, ScanLine, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ScheduleFormModal } from "./schedule-form-modal";
import { ImportScheduleModal } from "./import-schedule-modal";
import { AttendanceTodayPanel } from "@/components/attendance/today-panel";
import { useDeleteAllSchedules, useDeleteSchedule, useSchedules } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { ClassSchedule } from "@/types";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

// Tampilkan Senin–Sabtu dulu, Minggu terakhir.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function ScheduleView() {
  const schedulesQuery = useSchedules();
  const deleteSchedule = useDeleteSchedule();
  const deleteAllSchedules = useDeleteAllSchedules();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSchedule | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ClassSchedule | null>(null);

  const schedules = useMemo(() => schedulesQuery.data ?? [], [schedulesQuery.data]);
  const today = new Date().getDay();

  const byDay = useMemo(() => {
    const map = new Map<number, ClassSchedule[]>();
    for (const schedule of schedules) {
      const list = map.get(schedule.weekday) ?? [];
      list.push(schedule);
      map.set(schedule.weekday, list);
    }
    return map;
  }, [schedules]);

  const visibleDays = DAY_ORDER.filter((day) => (byDay.get(day)?.length ?? 0) > 0 || day === today);
  const todayCount = byDay.get(today)?.length ?? 0;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(schedule: ClassSchedule) {
    setEditing(schedule);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteSchedule.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast({ title: "Jadwal dihapus" });
        setPendingDelete(null);
      },
      onError: () => toast({ title: "Gagal menghapus jadwal", tone: "error" }),
    });
  }

  function confirmClearAll() {
    deleteAllSchedules.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Semua jadwal dihapus" });
        setClearAllOpen(false);
      },
      onError: () => toast({ title: "Gagal menghapus jadwal", tone: "error" }),
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Jadwal"
        title="Jadwal Kuliah"
        description={
          schedules.length > 0
            ? `${schedules.length} kelas per minggu${todayCount > 0 ? ` · ${todayCount} kelas hari ini` : ""}`
            : "Atur kelas mingguanmu — kelas berulang otomatis setiap minggu."
        }
        actions={
          <>
            {schedules.length > 0 ? (
              <Button
                variant="ghost"
                onClick={() => setClearAllOpen(true)}
                className="hover:text-danger text-muted"
              >
                <Trash2 className="size-4" aria-hidden />
                Hapus Semua
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <ScanLine className="size-4" aria-hidden />
              Impor Screenshot
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden />
              Tambah Jadwal
            </Button>
          </>
        }
      />

      <div className="mt-6">
        {schedulesQuery.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : schedulesQuery.isError ? (
          <EmptyState
            icon={<GraduationCap className="size-6" aria-hidden />}
            title="Gagal memuat jadwal"
            description="Terjadi kesalahan saat mengambil jadwal kuliah."
            action={
              <Button variant="secondary" onClick={() => void schedulesQuery.refetch()}>
                <RotateCcw className="size-4" aria-hidden />
                Coba lagi
              </Button>
            }
          />
        ) : schedules.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="size-6" aria-hidden />}
            title="Belum ada jadwal"
            description="Tambahkan kelas pertamamu — jadwal akan otomatis tampil di Calendar setiap minggunya."
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" aria-hidden />
                Tambah Jadwal
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            <AttendanceTodayPanel schedules={schedules} />
            {visibleDays.map((day) => {
              const items = byDay.get(day) ?? [];
              const isToday = day === today;
              return (
                <section key={day} aria-label={`Jadwal hari ${DAY_NAMES[day]}`}>
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <h2
                      className={cn(
                        "font-title text-xl leading-none",
                        isToday ? "text-brand-600 dark:text-brand-300" : "text-foreground",
                      )}
                    >
                      {DAY_NAMES[day]}
                    </h2>
                    {isToday ? (
                      <span className="bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                        Hari ini
                      </span>
                    ) : null}
                    <span className="text-muted text-xs tabular-nums">{items.length} kelas</span>
                  </div>

                  {items.length === 0 ? (
                    <p className="border-border text-muted rounded-xl border border-dashed px-4 py-3 text-sm">
                      Tidak ada kelas hari ini 🎉
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((schedule) => (
                        <li
                          key={schedule.id}
                          className="group border-border bg-surface hover:border-brand-300 hover:bg-surface-2/60 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors sm:gap-4 sm:px-4"
                        >
                          <span className="text-brand-600 dark:text-brand-300 w-24 shrink-0 text-sm font-semibold tabular-nums sm:w-28">
                            {schedule.start}–{schedule.end}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-foreground truncate text-sm font-medium">
                              {schedule.course}
                            </p>
                            {schedule.room ? (
                              <p className="text-muted truncate text-xs">Ruang {schedule.room}</p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit jadwal ${schedule.course}`}
                              onClick={() => openEdit(schedule)}
                            >
                              <Pencil className="size-4" aria-hidden />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Hapus jadwal ${schedule.course}`}
                              onClick={() => setPendingDelete(schedule)}
                              className="hover:text-danger text-muted"
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      <ScheduleFormModal open={formOpen} schedule={editing} onClose={() => setFormOpen(false)} />

      <ImportScheduleModal open={importOpen} onClose={() => setImportOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Jadwal"
        description={`Hapus kelas "${pendingDelete?.course ?? ""}" dari jadwal mingguan?`}
        confirmLabel="Ya, hapus"
        loading={deleteSchedule.isPending}
      />

      <ConfirmDialog
        open={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        onConfirm={confirmClearAll}
        title="Hapus Semua Jadwal"
        description={`Hapus ${schedules.length} jadwal kuliah? Kamu bisa memasukkan datanya ulang setelah ini.`}
        confirmLabel="Ya, hapus semua"
        loading={deleteAllSchedules.isPending}
      />
    </div>
  );
}
