"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUp, RotateCcw, ScanLine, Trash2, Wand2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { useCreateSchedules } from "@/lib/queries";
import { parseScheduleText } from "@/lib/schedule-ocr";
import { DAY_OPTIONS } from "./schedule-form-modal";
import type { CreateClassScheduleInput } from "@/types";

const selectClass =
  "h-9 rounded-xl border border-border bg-surface px-2.5 text-sm text-foreground focus-visible:border-brand-400";

type Step = "choose" | "reading" | "review";

interface DraftItem {
  key: string;
  weekday: number;
  start: string;
  end: string;
  course: string;
  room: string;
  include: boolean;
}

function updateDraft(drafts: DraftItem[], key: string, patch: Partial<DraftItem>): DraftItem[] {
  return drafts.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft));
}

function ImportScheduleInner({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const createSchedules = useCreateSchedules();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState("");
  const [progress, setProgress] = useState(0);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  // Lepas object URL preview saat komponen unmount / gambar berganti.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function chooseFile(nextFile: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  async function handleRecognize() {
    if (!file) return;
    setStep("reading");
    setProgress(0);
    setProgressLabel("Memuat mesin OCR…");

    try {
      // Dynamic import: bundle utama tidak ikut berat; worker & data bahasa
      // diambil tesseract.js dari CDN pada pemakaian pertama.
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("ind+eng", 1, {
        logger: (message) => {
          setProgressLabel(
            message.status === "recognizing text"
              ? "Membaca teks…"
              : message.status === "loading language traineddata"
                ? "Memuat data bahasa (sekali saja)…"
                : "Menyiapkan…",
          );
          if (message.status === "recognizing text") {
            setProgress(Math.round(message.progress * 100));
          }
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const parsed = parseScheduleText(data.text);
      if (parsed.length === 0) {
        toast({
          title: "Tidak ada jadwal terdeteksi",
          description: "Coba screenshot yang lebih jelas, atau input manual.",
        });
        setStep("choose");
        return;
      }

      const stamp = Date.now();
      setDrafts(
        parsed.map((item, index) => ({
          key: `d${stamp}-${index}`,
          weekday: item.weekday ?? 1,
          start: item.start,
          end: item.end,
          course: item.course,
          room: item.room ?? "",
          include: true,
        })),
      );
      setStep("review");
    } catch {
      toast({
        title: "Gagal membaca gambar",
        description: "Pastikan koneksi internet aktif (OCR memuat data bahasa) lalu coba lagi.",
        tone: "error",
      });
      setStep("choose");
    }
  }

  function handleSave() {
    const items: CreateClassScheduleInput[] = drafts
      .filter((draft) => draft.include && draft.course.trim() !== "" && draft.start < draft.end)
      .map((draft) => ({
        weekday: draft.weekday,
        start: draft.start,
        end: draft.end,
        course: draft.course.trim(),
        room: draft.room.trim() === "" ? null : draft.room.trim(),
      }));

    if (items.length === 0) {
      toast({
        title: "Tidak ada jadwal valid",
        description: "Centang minimal satu draf dengan mata kuliah & jam yang benar.",
      });
      return;
    }

    createSchedules.mutate(items, {
      onSuccess: (created) => {
        toast({ title: `${created.length} jadwal tersimpan` });
        onClose();
      },
      onError: () => toast({ title: "Gagal menyimpan jadwal", tone: "error" }),
    });
  }

  const includedCount = drafts.filter(
    (draft) => draft.include && draft.course.trim() !== "" && draft.start < draft.end,
  ).length;

  return (
    <div className="space-y-4">
      {step === "choose" ? (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border-border hover:border-brand-400 hover:bg-surface-2/60 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- preview lokal dari File API
              <img
                src={previewUrl}
                alt="Pratinjau screenshot jadwal"
                className="max-h-56 w-auto rounded-lg border border-border object-contain"
              />
            ) : (
              <>
                <ImageUp className="text-muted size-8" aria-hidden />
                <span className="text-foreground text-sm font-medium">
                  Pilih screenshot jadwal kuliah
                </span>
                <span className="text-muted text-xs">
                  Format JPG/PNG — hasil SIAKAD, kartu rencana studi, dsb.
                </span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
          />

          <div className="flex items-center justify-between gap-2">
            {file ? (
              <Button variant="ghost" size="sm" onClick={() => chooseFile(null)}>
                Ganti gambar
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={() => void handleRecognize()} disabled={!file}>
              <ScanLine className="size-4" aria-hidden />
              Baca dengan OCR
            </Button>
          </div>
        </>
      ) : null}

      {step === "reading" ? (
        <div className="space-y-3 py-6">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm font-medium">{progressLabel}</p>
            <p className="text-muted text-sm tabular-nums">{progress}%</p>
          </div>
          <div className="bg-surface-2 h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-brand-500 h-full rounded-full transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-muted text-xs">
            Pemakaian pertama memuat data bahasa (beberapa MB) — selanjutnya jauh lebih cepat.
          </p>
        </div>
      ) : null}

      {step === "review" ? (
        <>
          <p className="text-muted text-sm">
            <Wand2 className="mr-1 inline size-4" aria-hidden />
            Periksa & perbaiki hasil pembacaan sebelum disimpan — OCR tidak selalu sempurna.
          </p>
          <ul className="space-y-2">
            {drafts.map((draft) => (
              <li
                key={draft.key}
                className="border-border bg-surface flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2"
              >
                <Checkbox
                  checked={draft.include}
                  label={`Sertakan jadwal ${draft.course}`}
                  onCheckedChange={(checked) =>
                    setDrafts((prev) => updateDraft(prev, draft.key, { include: checked }))
                  }
                />
                <select
                  aria-label="Hari"
                  value={draft.weekday}
                  onChange={(event) =>
                    setDrafts((prev) =>
                      updateDraft(prev, draft.key, { weekday: Number(event.target.value) }),
                    )
                  }
                  className={selectClass}
                >
                  {DAY_OPTIONS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
                <Input
                  aria-label="Jam mulai"
                  type="time"
                  value={draft.start}
                  onChange={(event) =>
                    setDrafts((prev) => updateDraft(prev, draft.key, { start: event.target.value }))
                  }
                  className="h-9 w-[6.5rem]"
                />
                <Input
                  aria-label="Jam selesai"
                  type="time"
                  value={draft.end}
                  onChange={(event) =>
                    setDrafts((prev) => updateDraft(prev, draft.key, { end: event.target.value }))
                  }
                  className="h-9 w-[6.5rem]"
                />
                <Input
                  aria-label="Mata kuliah"
                  value={draft.course}
                  onChange={(event) =>
                    setDrafts((prev) =>
                      updateDraft(prev, draft.key, { course: event.target.value }),
                    )
                  }
                  className="h-9 min-w-40 flex-1"
                />
                <Input
                  aria-label="Ruang"
                  value={draft.room}
                  onChange={(event) =>
                    setDrafts((prev) => updateDraft(prev, draft.key, { room: event.target.value }))
                  }
                  className="h-9 w-24"
                  placeholder="Ruang"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Buang baris ini"
                  onClick={() =>
                    setDrafts((prev) => prev.filter((item) => item.key !== draft.key))
                  }
                  className="hover:text-danger text-muted"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setStep("choose");
                setDrafts([]);
              }}
            >
              <RotateCcw className="size-4" aria-hidden />
              Ulangi
            </Button>
            <Button onClick={handleSave} loading={createSchedules.isPending}>
              Simpan {includedCount} Jadwal
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export interface ImportScheduleModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportScheduleModal({ open, onClose }: ImportScheduleModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Impor dari Screenshot"
      description="Screenshot jadwal dibaca dengan OCR menjadi draf yang bisa kamu koreksi."
      size="lg"
    >
      {open ? <ImportScheduleInner key={`import-${open}`} onClose={onClose} /> : null}
    </Modal>
  );
}
