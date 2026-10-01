import { describe, expect, it } from "vitest";
import { parseLegacyData } from "./migrate-legacy";

describe("parseLegacyData", () => {
  it("memetakan struktur taskcanvas baru", () => {
    const structured = JSON.stringify({
      projects: [
        {
          id: "p-1",
          name: "KULIAH",
          icon: "📚",
          subjects: [
            {
              id: "s-1",
              name: "Struktur Data",
              tasks: [
                { id: 1, text: "Latihan graph", completed: false, dueDate: "2026-10-05" },
                { id: 2, text: "Baca modul", completed: true, dueDate: null },
              ],
            },
          ],
        },
      ],
    });

    const result = parseLegacyData(structured, null);
    expect(result.source).toBe("taskcanvas");
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]!.name).toBe("KULIAH");
    expect(result.projects[0]!.emoji).toBe("📚");
    expect(result.projects[0]!.subjects[0]!.name).toBe("Struktur Data");
    expect(result.projects[0]!.subjects[0]!.tasks).toEqual([
      { title: "Latihan graph", isDone: false, dueDate: "2026-10-05" },
      { title: "Baca modul", isDone: true, dueDate: null },
    ]);
    expect(result.taskCount).toBe(2);
  });

  it("memetakan array task lama menjadi satu project PERSONAL", () => {
    const legacy = JSON.stringify([
      { id: 1, text: "Beli buku", completed: false, dueDate: null },
      { id: 2, text: "Olahraga", completed: true },
    ]);

    const result = parseLegacyData(null, legacy);
    expect(result.source).toBe("tasks");
    expect(result.projects[0]!.name).toBe("PERSONAL");
    expect(result.projects[0]!.subjects[0]!.tasks).toHaveLength(2);
    expect(result.projects[0]!.subjects[0]!.tasks[1]).toEqual({
      title: "Olahraga",
      isDone: true,
      dueDate: null,
    });
  });

  it("mengembalikan none untuk data tidak valid", () => {
    expect(parseLegacyData("bukan-json", "{juga salah").source).toBe("none");
    expect(parseLegacyData(null, null).projects).toHaveLength(0);
  });

  it("melewati task tanpa judul dan menghitung skipped", () => {
    const structured = JSON.stringify({
      projects: [
        {
          name: "Proyek",
          subjects: [{ name: "S", tasks: [{ id: 1, text: "  " }, { id: 2, text: "Valid" }] }],
        },
      ],
    });

    const result = parseLegacyData(structured, null);
    expect(result.skipped).toBe(1);
    expect(result.projects[0]!.subjects[0]!.tasks).toHaveLength(1);
    expect(result.projects[0]!.emoji).toBe("🗂️");
  });

  it("menormalkan dueDate yang bukan string", () => {
    const structured = JSON.stringify({
      projects: [
        { name: "P", subjects: [{ name: "S", tasks: [{ text: "T", completed: false, dueDate: 123 }] }] },
      ],
    });
    const result = parseLegacyData(structured, null);
    expect(result.projects[0]!.subjects[0]!.tasks[0]!.dueDate).toBeNull();
  });
});
