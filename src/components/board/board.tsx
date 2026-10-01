"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";
import { SubjectColumn } from "./subject-column";
import { TaskDetailDrawer } from "./task-detail-drawer";
import { useCreateSubject, useUpdateSubject, useUpdateTask } from "@/lib/queries";
import { useToast } from "@/components/ui/toast";
import { positionBetween } from "@/lib/ordering";
import { cn } from "@/lib/utils";
import type { ProjectDetail } from "@/lib/api";
import type { BoardView } from "@/lib/stores/ui-store";
import type { Subject, Task } from "@/types";

function NewSubjectInline({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const createSubject = useCreateSubject(projectId);
  const { toast } = useToast();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit() {
    const value = name.trim();
    if (!value) return;
    createSubject.mutate(
      { name: value },
      {
        onSuccess: () => {
          setName("");
          setOpen(false);
        },
        onError: () => toast({ title: "Gagal menambah subject", tone: "error" }),
      },
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-[280px] shrink-0 snap-start items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface/40 text-sm font-medium text-muted transition-colors hover:border-brand-400 hover:text-brand-600"
      >
        <Plus className="size-4" aria-hidden />
        New Subject
      </button>
    );
  }

  return (
    <div className="flex h-12 w-[280px] shrink-0 snap-start items-center gap-1.5 rounded-card border border-brand-300 bg-surface px-2">
      <input
        ref={inputRef}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
          if (event.key === "Escape") {
            setName("");
            setOpen(false);
          }
        }}
        placeholder="Nama subject"
        aria-label="Nama subject baru"
        className="h-8 w-full bg-transparent px-1 text-sm focus:outline-none"
      />
      <button
        type="button"
        onClick={() => {
          setName("");
          setOpen(false);
        }}
        aria-label="Batal"
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

interface SortableSubjectProps {
  subject: Subject;
  wrapperClassName: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}

function SortableSubject({ subject, wrapperClassName, children }: SortableSubjectProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subject.id,
  });
  const dragHandle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`Geser subject ${subject.name}`}
      className="mt-1 hidden cursor-grab touch-none text-muted/50 hover:text-muted focus-visible:block group-hover:block"
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(wrapperClassName, isDragging && "z-10 opacity-80")}
    >
      {children(dragHandle)}
    </div>
  );
}

export interface BoardProps {
  detail: ProjectDetail;
  projectId: string;
  timezone: string;
  canEdit: boolean;
  view: BoardView;
}

export function Board({ detail, projectId, timezone, canEdit, view }: BoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const updateTask = useUpdateTask(projectId);
  const updateSubject = useUpdateSubject(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const subjectIds = new Set(detail.subjects.map((subject) => subject.id));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (subjectIds.has(activeId)) {
      const ordered = [...detail.subjects].sort((a, b) => a.position - b.position);
      const oldIndex = ordered.findIndex((subject) => subject.id === activeId);
      const newIndex = ordered.findIndex((subject) => subject.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const rest = ordered.filter((subject) => subject.id !== activeId);
      const prev = newIndex > 0 ? (rest[newIndex - 1]?.position ?? null) : null;
      const next = newIndex < rest.length ? (rest[newIndex]?.position ?? null) : null;
      updateSubject.mutate({
        id: activeId,
        input: { position: positionBetween(prev, next) },
      });
      return;
    }

    const activeTask = detail.tasks.find((task) => task.id === activeId);
    if (!activeTask) return;

    const targetSubjectId = overId.startsWith("col:")
      ? overId.slice(4)
      : (detail.tasks.find((task) => task.id === overId)?.subjectId ?? activeTask.subjectId);

    const targetTasks = detail.tasks
      .filter((task) => task.subjectId === targetSubjectId && task.id !== activeId)
      .sort((a, b) => a.position - b.position);

    let index: number;
    if (overId.startsWith("col:")) {
      index = targetTasks.length;
    } else {
      const overIndex = targetTasks.findIndex((task) => task.id === overId);
      index = overIndex === -1 ? targetTasks.length : overIndex;
    }

    const prev = index > 0 ? (targetTasks[index - 1]?.position ?? null) : null;
    const next = index < targetTasks.length ? (targetTasks[index]?.position ?? null) : null;

    updateTask.mutate({
      id: activeId,
      input: { subjectId: targetSubjectId, position: positionBetween(prev, next) },
    });
  }

  const tasksBySubject = (subjectId: string) =>
    detail.tasks.filter((task) => task.subjectId === subjectId);

  const renderColumn = (
    subject: Subject,
    columnClassName: string,
    dragHandle: React.ReactNode,
  ) => (
    <SubjectColumn
      projectId={projectId}
      subject={subject}
      tasks={tasksBySubject(subject.id)}
      members={detail.members}
      timezone={timezone}
      canEdit={canEdit}
      onOpenDetail={setSelectedTask}
      dragHandle={canEdit ? dragHandle : null}
      className={columnClassName}
    />
  );

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        {view === "board" ? (
          <div className="no-scrollbar flex h-full snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-6">
            <SortableContext
              items={detail.subjects.map((subject) => subject.id)}
              strategy={horizontalListSortingStrategy}
            >
              {detail.subjects.map((subject) => (
                <SortableSubject
                  key={subject.id}
                  subject={subject}
                  wrapperClassName="h-full"
                >
                  {(dragHandle) => renderColumn(subject, "h-full", dragHandle)}
                </SortableSubject>
              ))}
            </SortableContext>
            {canEdit ? <NewSubjectInline projectId={projectId} /> : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 overflow-y-auto px-4 pb-6 sm:grid-cols-2 sm:px-6 xl:grid-cols-3">
            <SortableContext
              items={detail.subjects.map((subject) => subject.id)}
              strategy={horizontalListSortingStrategy}
            >
              {detail.subjects.map((subject) => (
                <SortableSubject
                  key={subject.id}
                  subject={subject}
                  wrapperClassName="h-[520px]"
                >
                  {(dragHandle) =>
                    renderColumn(subject, "h-[520px] w-full", dragHandle)
                  }
                </SortableSubject>
              ))}
            </SortableContext>
            {canEdit ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <NewSubjectInline projectId={projectId} />
              </div>
            ) : null}
          </div>
        )}
      </DndContext>

      <TaskDetailDrawer
        task={selectedTask}
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        projectId={projectId}
        members={detail.members}
        canEdit={canEdit}
      />
    </>
  );
}
