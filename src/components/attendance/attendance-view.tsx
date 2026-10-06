"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  useAttendance,
  useAttendanceSummary,
  useDeleteAttendance,
  useMe,
  useUpdateAttendance,
} from "@/lib/queries";
import { formatDateTime, formatFullDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceRecord, AttendanceStatus } from "@/types";
import { ATTENDANCE_STATUS_META, ATTENDANCE_STATUS_ORDER } from "./status";
import { AttendanceDashboard } from "./attendance-dashboard";
import { ShareCard } from "./share-card";

const selectClass =
  "h-9 rounded-xl border border-border bg-surface px-2 text-sm text-foreground focus-visible:border-brand-400";

export function AttendanceView() {
  const { data: user } = useMe();
  const name = user?.name ?? "Aku";
  const summaryQuery = useAttendanceSummary();
  const attendanceQuery = useAttendance();
  const updateAttendance = useUpdateAttendance();
  const deleteAttendance = useDeleteAttendance();
  const { toast } = useToast();

  const [viewing, setViewing] = useState<AttendanceRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AttendanceRecord | null>(null);

  const records = useMemo(() => attendanceQuery.data ?? [], [attendanceQuery.data]);
  const grouped = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    for (const record of records) {
      const list = map.get(record.date) ?? [];
      list.push(record);
      map.set(record.date, list);
    }
    return [...map.entries()];
  }, [records]);

  function changeStatus(record: AttendanceRecord, status: AttendanceStatus) {
    updateAttendance.mutate(
      { id: record.id, input: { status } },
      { onError: () => toast({ title: "Gagal memperbarui status", tone: "error" }) },
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteAttendance.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast({ title: "Catatan presensi dihapus" });
        setPendingDelete(null);
      },
      onError: () => toast({ title: "Gagal menghapus", tone: "error" }),
    });
  }

  const summary = summaryQuery.data;
  const loading = summaryQuery.isLoading || attendanceQuery.isLoading;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Presensi"
        title="Kehadiran Kuliah"
        description="Rekap kehadiran, streak, dan template siap bagikan."
      />

      {loading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-72 w-full rounded-card" />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {summary ? <AttendanceDashboard summary={summary} /> : null}
          {summary ? <ShareCard summary={summary} name={name} /> : null}

          <section className="rounded-card border border-border bg-surface p-4 shadow-soft sm:p-5">
            <h2 className="font-title mb-3 text-2xl text-foreground">Riwayat Presensi</h2>

            {records.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="size-6" aria-hidden />}
                title="Belum ada catatan presensi"
                description="Absen kelas pertamamu dari halaman Jadwal Kuliah untuk mulai mengisi riwayat."
              />
            ) : (
              <div className="space-y-5">
                {grouped.map(([date, items]) => (
                  <div key={date}>
                    <h3 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
                      {formatFullDate(date)}
                    </h3>
                    <ul className="space-y-2">
                      {items.map((record) => {
                        const meta = ATTENDANCE_STATUS_META[record.status];
                        return (
                          <li
                            key={record.id}
                            className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5"
                          >
                            {record.photo ? (
                              <button
                                type="button"
                                onClick={() => setViewing(record)}
                                className="border-border size-11 shrink-0 overflow-hidden rounded-lg border"
                                aria-label={`Lihat foto bukti ${record.course}`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element -- data URL presensi */}
                                <img
                                  src={record.photo}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              </button>
                            ) : (
                              <span className={cn("size-2.5 shrink-0 rounded-full", meta.dot)} />
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="text-foreground truncate text-sm font-medium">
                                {record.course}
                              </p>
                              <p className="text-muted truncate text-xs">
                                {record.room ? `Ruang ${record.room} · ` : ""}
                                {formatDateTime(record.checkedInAt)}
                                {record.note ? ` · ${record.note}` : ""}
                              </p>
                            </div>

                            <select
                              aria-label={`Status ${record.course}`}
                              value={record.status}
                              onChange={(event) =>
                                changeStatus(record, event.target.value as AttendanceStatus)
                              }
                              className={cn(selectClass, meta.badge, "border-transparent font-medium")}
                            >
                              {ATTENDANCE_STATUS_ORDER.map((value) => (
                                <option
                                  key={value}
                                  value={value}
                                  disabled={
                                    (value === "present" || value === "late") && !record.photo
                                  }
                                >
                                  {ATTENDANCE_STATUS_META[value].label}
                                </option>
                              ))}
                            </select>

                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Hapus presensi ${record.course}`}
                              onClick={() => setPendingDelete(record)}
                              className="hover:text-danger text-muted"
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.course ?? "Foto bukti"}
        description={viewing ? formatFullDate(viewing.date) : undefined}
      >
        {viewing?.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL presensi
          <img src={viewing.photo} alt="Bukti presensi" className="w-full rounded-xl" />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Presensi"
        description={`Hapus catatan presensi "${pendingDelete?.course ?? ""}"?`}
        confirmLabel="Ya, hapus"
        loading={deleteAttendance.isPending}
      />
    </div>
  );
}
