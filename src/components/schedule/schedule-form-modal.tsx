"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useCreateSchedule, useUpdateSchedule } from "@/lib/queries";
import type { ClassSchedule } from "@/types";

// Urutan Senin–Sabtu lalu Minggu, sesuai kebiasaan jadwal kuliah.
// Dipakai bersama oleh form manual dan hasil impor OCR.
export const DAY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 0, label: "Minggu" },
];

const selectClass =
  "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus-visible:border-brand-400";

interface FormErrors {
  course?: string;
  end?: string;
}

// Form di-mount ulang lewat key setiap modal dibuka / jadwal berganti,
// jadi state selalu mulai bersih tanpa perlu effect reset.
function ScheduleForm({
  schedule,
  onClose,
}: {
  schedule: ClassSchedule | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const loading = createSchedule.isPending || updateSchedule.isPending;

  const [weekday, setWeekday] = useState(String(schedule?.weekday ?? new Date().getDay()));
  const [start, setStart] = useState(schedule?.start ?? "07:00");
  const [end, setEnd] = useState(schedule?.end ?? "09:00");
  const [course, setCourse] = useState(schedule?.course ?? "");
  const [room, setRoom] = useState(schedule?.room ?? "");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (course.trim() === "") nextErrors.course = "Nama mata kuliah wajib diisi";
    if (start >= end) nextErrors.end = "Jam selesai harus setelah jam mulai";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input = {
      weekday: Number(weekday),
      start,
      end,
      course: course.trim(),
      room: room.trim() === "" ? null : room.trim(),
    };

    const onSuccess = () => {
      toast({ title: schedule ? "Jadwal diperbarui" : "Jadwal ditambahkan" });
      onClose();
    };
    const onError = () => {
      toast({ title: "Gagal menyimpan jadwal", tone: "error" });
    };

    if (schedule) {
      updateSchedule.mutate({ id: schedule.id, input }, { onSuccess, onError });
    } else {
      createSchedule.mutate(input, { onSuccess, onError });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Hari" htmlFor="schedule-weekday" required>
        <select
          id="schedule-weekday"
          value={weekday}
          onChange={(event) => setWeekday(event.target.value)}
          className={selectClass}
        >
          {DAY_OPTIONS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mulai" htmlFor="schedule-start" required>
          <Input
            id="schedule-start"
            type="time"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            required
          />
        </Field>
        <Field label="Selesai" htmlFor="schedule-end" required error={errors.end}>
          <Input
            id="schedule-end"
            type="time"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            required
            aria-invalid={errors.end ? true : undefined}
          />
        </Field>
      </div>

      <Field
        label="Mata kuliah"
        htmlFor="schedule-course"
        required
        error={errors.course}
        className="sm:col-span-2"
      >
        <Input
          id="schedule-course"
          value={course}
          onChange={(event) => setCourse(event.target.value)}
          placeholder="contoh: Pemrograman Web"
          maxLength={80}
          aria-invalid={errors.course ? true : undefined}
        />
      </Field>

      <Field label="Ruang" htmlFor="schedule-room" className="sm:col-span-2" hint="Opsional">
        <Input
          id="schedule-room"
          value={room}
          onChange={(event) => setRoom(event.target.value)}
          placeholder="contoh: A-101"
          maxLength={40}
        />
      </Field>

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" loading={loading}>
          Simpan
        </Button>
      </div>
    </form>
  );
}

export interface ScheduleFormModalProps {
  open: boolean;
  schedule: ClassSchedule | null;
  onClose: () => void;
}

export function ScheduleFormModal({ open, schedule, onClose }: ScheduleFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={schedule ? "Edit Jadwal" : "Tambah Jadwal"}
      description="Kelas ini berulang otomatis setiap minggu."
    >
      {open ? (
        <ScheduleForm key={`${schedule?.id ?? "new"}-${open ? "open" : "closed"}`} schedule={schedule} onClose={onClose} />
      ) : null}
    </Modal>
  );
}
