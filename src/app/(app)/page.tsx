import { PageHeader } from "@/components/layout/page-header";

export default function MySpacePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Root Canvas"
        title="My Space"
        description="Pilih project untuk melihat subject dan daftar task. Segera hadir di langkah berikutnya."
      />
    </div>
  );
}
