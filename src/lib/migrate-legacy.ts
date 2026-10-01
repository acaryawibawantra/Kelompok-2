export interface LegacyImportTask {
  title: string;
  isDone: boolean;
  dueDate: string | null;
}

export interface LegacyImportSubject {
  name: string;
  tasks: LegacyImportTask[];
}

export interface LegacyImportProject {
  name: string;
  emoji: string | null;
  subjects: LegacyImportSubject[];
}

export type LegacySource = "taskcanvas" | "tasks" | "none";

export interface LegacyImportResult {
  projects: LegacyImportProject[];
  source: LegacySource;
  skipped: number;
  taskCount: number;
}

const DEFAULT_PROJECT_EMOJI = "🗂️";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mapTask(value: unknown): LegacyImportTask | null {
  if (!isRecord(value)) return null;
  const rawTitle = value.text ?? value.title;
  if (typeof rawTitle !== "string" || rawTitle.trim() === "") return null;
  const dueDate = typeof value.dueDate === "string" && value.dueDate.length > 0 ? value.dueDate : null;
  return {
    title: rawTitle.trim(),
    isDone: value.completed === true || value.isDone === true,
    dueDate,
  };
}

interface Mapped {
  project: LegacyImportProject;
  skipped: number;
}

function mapProject(value: unknown): Mapped | null {
  if (!isRecord(value)) return null;
  const name = typeof value.name === "string" && value.name.trim() ? value.name.trim() : "Project";
  const emoji =
    typeof value.icon === "string" && value.icon.trim()
      ? value.icon.trim()
      : typeof value.emoji === "string" && value.emoji.trim()
        ? value.emoji.trim()
        : null;

  const rawSubjects = Array.isArray(value.subjects) ? value.subjects : [];
  const subjects: LegacyImportSubject[] = [];
  let skipped = 0;

  for (const rawSubject of rawSubjects) {
    if (!isRecord(rawSubject)) continue;
    const subjectName =
      typeof rawSubject.name === "string" && rawSubject.name.trim()
        ? rawSubject.name.trim()
        : "Task Saya";
    const rawTasks = Array.isArray(rawSubject.tasks) ? rawSubject.tasks : [];
    const tasks: LegacyImportTask[] = [];
    for (const rawTask of rawTasks) {
      const task = mapTask(rawTask);
      if (task) tasks.push(task);
      else skipped += 1;
    }
    subjects.push({ name: subjectName, tasks });
  }

  return { project: { name, emoji: emoji ?? DEFAULT_PROJECT_EMOJI, subjects }, skipped };
}

export function parseLegacyData(
  rawTaskcanvas: string | null,
  rawTasks: string | null,
): LegacyImportResult {
  const parsedStructured = safeParse(rawTaskcanvas);
  if (isRecord(parsedStructured) && Array.isArray(parsedStructured.projects)) {
    const projects: LegacyImportProject[] = [];
    let skipped = 0;
    for (const rawProject of parsedStructured.projects) {
      const mapped = mapProject(rawProject);
      if (mapped) {
        projects.push(mapped.project);
        skipped += mapped.skipped;
      } else {
        skipped += 1;
      }
    }
    const taskCount = projects.reduce(
      (sum, project) => sum + project.subjects.reduce((s, subject) => s + subject.tasks.length, 0),
      0,
    );
    if (projects.length > 0) {
      return { projects, source: "taskcanvas", skipped, taskCount };
    }
  }

  const parsedTasks = safeParse(rawTasks);
  if (Array.isArray(parsedTasks)) {
    const tasks: LegacyImportTask[] = [];
    let skipped = 0;
    for (const rawTask of parsedTasks) {
      const task = mapTask(rawTask);
      if (task) tasks.push(task);
      else skipped += 1;
    }
    if (tasks.length > 0) {
      return {
        projects: [
          {
            name: "PERSONAL",
            emoji: "🏠",
            subjects: [{ name: "Task Saya", tasks }],
          },
        ],
        source: "tasks",
        skipped,
        taskCount: tasks.length,
      };
    }
  }

  return { projects: [], source: "none", skipped: 0, taskCount: 0 };
}

export function readLegacyFromStorage(storage: Storage): LegacyImportResult {
  let structured: string | null = null;
  let legacyTasks: string | null = null;
  try {
    structured = storage.getItem("taskcanvas");
    legacyTasks = storage.getItem("tasks");
  } catch {
    /* storage tidak tersedia */
  }
  return parseLegacyData(structured, legacyTasks);
}
