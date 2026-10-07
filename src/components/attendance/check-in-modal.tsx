"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Clock,
  ImageUp,
  RotateCcw,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useCheckIn, useUpdateAttendance } from "@/lib/queries";
import { captureVideoFrame, fileToCompressedDataUrl } from "@/lib/attendance-media";
import { formatFullDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceRecord, AttendanceStatus, ClassSchedule } from "@/types";
import { ATTENDANCE_STATUS_META, ATTENDANCE_STATUS_ORDER } from "./status";

const STATUS_ICON: Record<AttendanceStatus, typeof CheckCircle2> = {
  present: CheckCircle2,
  late: Clock,
  excused: ShieldCheck,
  absent: XCircle,
};

interface FormErrors {
  photo?: string;
}

function CheckInForm({
  schedule,
  date,
  record,
  onClose,
}: {
  schedule: ClassSchedule;
  date: string;
  record: AttendanceRecord | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const checkIn = useCheckIn();
  const updateAttendance = useUpdateAttendance();
  const loading = checkIn.isPending || updateAttendance.isPending;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<AttendanceStatus>(record?.status ?? "present");
  const [photo, setPhoto] = useState<string | null>(record?.photo ?? null);
  const [note, setNote] = useState(record?.note ?? "");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (cameraOn && video && streamRef.current) {
      video.srcObject = streamRef.current;
      void video.play().catch(() => undefined);
    }
  }, [cameraOn]);

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setCameraError("Kamera tidak bisa diakses. Gunakan unggah foto sebagai gantinya.");
    }
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    setPhoto(captureVideoFrame(video));
    setErrors({});
    stopCamera();
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setPhoto(await fileToCompressedDataUrl(file));
      setErrors({});
      stopCamera();
    } catch {
      toast({ title: "Gagal memproses gambar", tone: "error" });
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const requiresPhoto = status === "present" || status === "late";
    const nextErrors: FormErrors = {};
    if (requiresPhoto && !photo) nextErrors.photo = "Ambil atau unggah foto bukti dulu.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const trimmedNote = note.trim() === "" ? null : note.trim();
    const onSuccess = () => {
      toast({ title: record ? "Presensi diperbarui" : "Presensi tersimpan" });
      stopCamera();
      onClose();
    };
    const onError = () => toast({ title: "Gagal menyimpan presensi", tone: "error" });

    if (record) {
      updateAttendance.mutate(
        { id: record.id, input: { status, photo, note: trimmedNote } },
        { onSuccess, onError },
      );
    } else {
      checkIn.mutate(
        { scheduleId: schedule.id, date, status, photo, note: trimmedNote },
        { onSuccess, onError },
      );
    }
  }

  const requiresPhoto = status === "present" || status === "late";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-border bg-surface-2/60 flex items-center gap-3 rounded-xl border px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-medium">{schedule.course}</p>
          <p className="text-muted text-xs">
            {schedule.start}–{schedule.end}
            {schedule.room ? ` · Ruang ${schedule.room}` : ""}
          </p>
        </div>
        <span className="text-muted shrink-0 text-xs">{formatFullDate(date)}</span>
      </div>

      <div className="space-y-1.5">
        <p className="text-foreground text-sm font-medium">Status kehadiran</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ATTENDANCE_STATUS_ORDER.map((value) => {
            const meta = ATTENDANCE_STATUS_META[value];
            const Icon = STATUS_ICON[value];
            const active = status === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                aria-pressed={active}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                    : "border-border bg-surface text-muted hover:border-brand-300 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <Field
        label="Foto bukti"
        htmlFor="attendance-photo"
        error={errors.photo}
        hint={requiresPhoto ? "Wajib untuk status Hadir/Terlambat." : "Opsional untuk status ini."}
        required={requiresPhoto}
      >
        <div className="space-y-2">
          {photo ? (
            <div className="relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL dari kamera/File API */}
              <img src={photo} alt="Bukti presensi" className="max-h-64 w-full object-contain" />
              <div className="bg-surface/90 absolute top-2 right-2 flex gap-1 rounded-lg p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Ganti foto"
                  onClick={() => setPhoto(null)}
                >
                  <RotateCcw className="size-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Hapus foto"
                  onClick={() => setPhoto(null)}
                  className="hover:text-danger text-muted"
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          ) : cameraOn ? (
            <div className="space-y-2">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="bg-surface-2 max-h-64 w-full rounded-xl border border-border object-contain"
              />
              <div className="flex gap-2">
                <Button type="button" onClick={takePhoto}>
                  <Camera className="size-4" aria-hidden />
                  Ambil Foto
                </Button>
                <Button type="button" variant="ghost" onClick={stopCamera}>
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => void startCamera()}>
                <Camera className="size-4" aria-hidden />
                Nyalakan Kamera
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageUp className="size-4" aria-hidden />
                Unggah Foto
              </Button>
            </div>
          )}
          <input
            id="attendance-photo"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => void handleFile(event)}
          />
          {cameraError ? <p className="text-danger text-xs">{cameraError}</p> : null}
        </div>
      </Field>

      <Field label="Catatan" htmlFor="attendance-note" hint="Opsional — mis. materi atau keterangan izin.">
        <Textarea
          id="attendance-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={280}
          rows={2}
          placeholder="contoh: Hadir, membahas bab 3"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" loading={loading}>
          Simpan Presensi
        </Button>
      </div>
    </form>
  );
}

export interface CheckInModalProps {
  open: boolean;
  schedule: ClassSchedule | null;
  date: string;
  record: AttendanceRecord | null;
  onClose: () => void;
}

export function CheckInModal({ open, schedule, date, record, onClose }: CheckInModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record ? "Ubah Presensi" : "Absen Kelas"}
      description="Ambil foto sebagai bukti kehadiran, lalu simpan."
    >
      {open && schedule ? (
        <CheckInForm
          key={`${schedule.id}-${date}-${record?.id ?? "new"}`}
          schedule={schedule}
          date={date}
          record={record}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}
