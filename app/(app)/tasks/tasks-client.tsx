"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button, Chip, EmptyState, Field, Input, Label, Stack, ViewHeader } from "@/components/ui";
import { Modal, ConfirmModal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createTask, updateTask, toggleTask, deleteTask, restoreTask } from "@/app/actions/tasks";
import type { Task } from "@/lib/types";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const PRI_COLOR: Record<string, string> = {
  high: "bg-[var(--danger)]",
  medium: "bg-[#B08A3C]",
  low: "bg-[var(--ink-faint)]",
};

export function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [statusFilter, setStatusFilter] = useState<"open" | "done" | "all">("open");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const categories = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.category).filter(Boolean))) as string[],
    [tasks]
  );

  const filtered = useMemo(() => {
    let list = tasks.filter((t) => {
      if (statusFilter === "open" && t.done) return false;
      if (statusFilter === "done" && !t.done) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    const priOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return list.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const pa = a.priority ? priOrder[a.priority] : 3;
      const pb = b.priority ? priOrder[b.priority] : 3;
      if (pa !== pb) return pa - pb;
      if (a.due && b.due) return a.due.localeCompare(b.due);
      if (a.due) return -1;
      if (b.due) return 1;
      return 0;
    });
  }, [tasks, statusFilter, categoryFilter, query]);

  function openTaskCount() {
    return tasks.filter((t) => !t.done).length;
  }

  async function handleToggle(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    startTransition(async () => {
      await toggleTask(task.id, !task.done);
    });
  }

  async function handleDelete(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    startTransition(async () => {
      await deleteTask(task.id);
    });
    toast.show("Task deleted.", {
      actionLabel: "Undo",
      onAction: () => {
        setTasks((prev) => [task, ...prev]);
        startTransition(async () => {
          await restoreTask({
            id: task.id,
            title: task.title,
            priority: task.priority,
            category: task.category,
            due: task.due,
            due_time: task.due_time,
            done: task.done,
          });
        });
      },
    });
  }

  return (
    <div>
      <ViewHeader
        eyebrow={`${openTaskCount()} open`}
        title="Tasks"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <PlusIcon /> Add task
          </Button>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckIcon />}
          title="No tasks yet."
          description="Add something you want to get done."
          action={
            <Button
              variant="primary"
              className="mt-2"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <PlusIcon /> Add task
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-6 relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-faint)]" />
            <Input
              type="search"
              placeholder="Search tasks"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <Chip active={statusFilter === "open"} onClick={() => setStatusFilter("open")}>
              Open
            </Chip>
            <Chip active={statusFilter === "done"} onClick={() => setStatusFilter("done")}>
              Completed
            </Chip>
            <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
              All
            </Chip>
            {categories.map((c) => (
              <Chip key={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)}>
                {c}
              </Chip>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={<SearchIcon />} title="No matches." description="Try a different filter or search term." />
          ) : (
            <Stack>
              {filtered.map((task) => (
                <div key={task.id} className="flex items-center gap-3.5 py-3.5 group">
                  <button
                    onClick={() => handleToggle(task)}
                    aria-label="Toggle complete"
                    className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
                      task.done ? "bg-[var(--accent)] border-[var(--accent)]" : "border-[var(--line-strong)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {task.done && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2" className="h-[11px] w-[11px]">
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[14.5px] ${task.done ? "text-[var(--ink-faint)] line-through" : ""}`}>
                      {task.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-2.5 text-xs text-[var(--ink-faint)]">
                      {task.priority && (
                        <span className="inline-flex items-center gap-1">
                          <span className={`h-[7px] w-[7px] rounded-full ${PRI_COLOR[task.priority]}`} />
                          {task.priority}
                        </span>
                      )}
                      {task.category && (
                        <span className="rounded-full border border-[var(--line-strong)] px-2 py-0.5">{task.category}</span>
                      )}
                      {task.due && <span>Due {fmtDate(task.due)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditing(task);
                        setModalOpen(true);
                      }}
                      aria-label="Edit"
                      className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(task)}
                      aria-label="Delete"
                      className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </Stack>
          )}
        </>
      )}

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editing}
        onCreated={(t) => setTasks((prev) => [t, ...prev])}
        onUpdated={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
      />

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete task?"
        message={confirmDelete ? `"${confirmDelete.title}" will be removed.` : ""}
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
}

function TaskModal({
  open,
  onClose,
  task,
  onCreated,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  onCreated: (t: Task) => void;
  onUpdated: (t: Task) => void;
}) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [priority, setPriority] = useState<"high" | "medium" | "low" | "">(task?.priority ?? "");
  const [category, setCategory] = useState(task?.category ?? "");
  const [due, setDue] = useState(task?.due ?? "");
  const [dueTime, setDueTime] = useState(task?.due_time ?? "");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Reset local state whenever the modal opens for a (possibly different) task.
  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setPriority(task?.priority ?? "");
      setCategory(task?.category ?? "");
      setDue(task?.due ?? "");
      setDueTime(task?.due_time ?? "");
    }
  }, [open, task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isEdit && task) {
        await updateTask(task.id, { title, priority, category, due, due_time: dueTime });
        onUpdated({
          ...task,
          title,
          priority: priority || null,
          category: category || null,
          due: due || null,
          due_time: dueTime || null,
        });
        toast.show("Task updated.");
      } else {
        await createTask({ title, priority, category, due, due_time: dueTime });
        toast.show("Task added.");
        // The list will refresh via revalidatePath on next server render;
        // optimistic insert here keeps this instant.
        onCreated({
          id: crypto.randomUUID(),
          user_id: "",
          title,
          priority: priority || null,
          category: category || null,
          due: due || null,
          due_time: dueTime || null,
          done: false,
          created_at: new Date().toISOString(),
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit task" : "Add task"}>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="title">Title</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" />
        </Field>
        <Field>
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
            className="w-full rounded border border-[var(--line)] bg-[var(--paper-raised)] px-3 py-2.5 text-[15px] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">None</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </Field>
        <div className="flex gap-3">
          <Field>
            <Label htmlFor="due">Due date (optional)</Label>
            <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="dueTime">Time (optional)</Label>
            <Input id="dueTime" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </Field>
        </div>
        <Field>
          <Label htmlFor="category">Category (optional)</Label>
          <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. School, Personal" />
        </Field>
        <div className="mt-5 flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {isEdit ? "Save changes" : "Add task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M8 11.5l2.2 2.2L16 8.5" />
    </svg>
  );
}
function SearchIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 20l.9-3.6L16.6 4.7a1.5 1.5 0 0 1 2.1 0l.6.6a1.5 1.5 0 0 1 0 2.1L7.6 19.1 4 20Z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.1a1 1 0 0 1-1 .9H7.8a1 1 0 0 1-1-.9L6 7" />
    </svg>
  );
}
