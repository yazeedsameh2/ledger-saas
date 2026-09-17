"use client";

import { useEffect, useState, useTransition } from "react";
import { Button, EmptyState, Field, Input, Label, Stack, Textarea, ViewHeader } from "@/components/ui";
import { Modal, ConfirmModal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createGoal, updateGoal, toggleGoalDone, deleteGoal } from "@/app/actions/goals";
import type { Goal } from "@/lib/types";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function GoalsClient({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Goal | null>(null);
  const [, startTransition] = useTransition();
  const toast = useToast();

  const active = goals.filter((g) => g.status !== "done");
  const done = goals.filter((g) => g.status === "done");

  function openModal(goal: Goal | null) {
    setEditing(goal);
    setModalOpen(true);
  }

  async function handleToggleDone(goal: Goal) {
    const nowDone = goal.status !== "done";
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, status: nowDone ? "done" : "active", progress: nowDone ? 100 : g.progress } : g)));
    startTransition(async () => toggleGoalDone(goal.id, nowDone));
  }

  async function handleDelete(goal: Goal) {
    setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    startTransition(async () => deleteGoal(goal.id));
    toast.show("Goal deleted.");
  }

  function GoalRow({ goal }: { goal: Goal }) {
    return (
      <div className="flex items-start gap-3.5 py-3.5 group">
        <button
          onClick={() => handleToggleDone(goal)}
          aria-label="Toggle done"
          className={`mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
            goal.status === "done" ? "bg-[var(--accent)] border-[var(--accent)]" : "border-[var(--line-strong)] hover:border-[var(--accent)]"
          }`}
        >
          {goal.status === "done" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2" className="h-[11px] w-[11px]">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`text-[14.5px] ${goal.status === "done" ? "text-[var(--ink-faint)] line-through" : ""}`}>{goal.title}</div>
          <div className="mt-0.5 flex flex-wrap gap-2.5 text-xs text-[var(--ink-faint)]">
            {goal.category && <span className="rounded-full border border-[var(--line-strong)] px-2 py-0.5">{goal.category}</span>}
            {goal.deadline && <span>Due {fmtDate(goal.deadline)}</span>}
          </div>
          {goal.status !== "done" && (
            <div className="mt-2 h-[3px] max-w-[260px] rounded-full bg-[var(--line)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${goal.progress}%` }} />
            </div>
          )}
          {goal.notes && <div className="mt-1.5 text-xs text-[var(--ink-faint)]">{goal.notes}</div>}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => openModal(goal)} aria-label="Edit" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]">
            <EditIcon />
          </button>
          <button onClick={() => setConfirmDelete(goal)} aria-label="Delete" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]">
            <TrashIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ViewHeader
        eyebrow={`${active.length} active`}
        title="Goals"
        action={
          <Button variant="primary" size="sm" onClick={() => openModal(null)}>
            <PlusIcon /> New goal
          </Button>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={<GoalIcon />}
          title="No goals yet."
          description="Set something worth working toward."
          action={
            <Button variant="primary" className="mt-2" onClick={() => openModal(null)}>
              <PlusIcon /> New goal
            </Button>
          }
        />
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">In progress</div>
              <Stack>
                {active.map((g) => (
                  <GoalRow key={g.id} goal={g} />
                ))}
              </Stack>
            </>
          )}
          {done.length > 0 && (
            <div className={active.length > 0 ? "mt-8" : ""}>
              <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">Completed</div>
              <Stack>
                {done.map((g) => (
                  <GoalRow key={g.id} goal={g} />
                ))}
              </Stack>
            </div>
          )}
        </>
      )}

      <GoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        goal={editing}
        onCreated={(g) => setGoals((prev) => [...prev, g])}
        onUpdated={(g) => setGoals((prev) => prev.map((x) => (x.id === g.id ? g : x)))}
      />

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete goal?"
        message={confirmDelete ? `"${confirmDelete.title}" will be removed.` : ""}
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
}

function GoalModal({
  open,
  onClose,
  goal,
  onCreated,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  goal: Goal | null;
  onCreated: (g: Goal) => void;
  onUpdated: (g: Goal) => void;
}) {
  const isEdit = !!goal;
  const [title, setTitle] = useState(goal?.title ?? "");
  const [category, setCategory] = useState(goal?.category ?? "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [progress, setProgress] = useState(goal?.progress ?? 0);
  const [notes, setNotes] = useState(goal?.notes ?? "");
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setTitle(goal?.title ?? "");
      setCategory(goal?.category ?? "");
      setDeadline(goal?.deadline ?? "");
      setProgress(goal?.progress ?? 0);
      setNotes(goal?.notes ?? "");
    }
  }, [open, goal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const input = { title, category, deadline, progress, notes };
    if (isEdit && goal) {
      await updateGoal(goal.id, input);
      onUpdated({ ...goal, title, category: category || null, deadline: deadline || null, progress, notes: notes || null, status: progress >= 100 ? "done" : "active" });
      toast.show("Goal updated.");
    } else {
      await createGoal(input);
      onCreated({
        id: crypto.randomUUID(),
        user_id: "",
        title,
        category: category || null,
        deadline: deadline || null,
        progress,
        notes: notes || null,
        status: progress >= 100 ? "done" : "active",
      });
      toast.show("Goal added.");
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit goal" : "New goal"}>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="goalTitle">Goal</Label>
          <Input id="goalTitle" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you working toward?" />
        </Field>
        <div className="flex gap-3">
          <Field>
            <Label htmlFor="goalCategory">Category (optional)</Label>
            <Input id="goalCategory" value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="goalDeadline">Deadline (optional)</Label>
            <Input id="goalDeadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        </div>
        <Field>
          <Label htmlFor="goalProgress">Progress — {progress}%</Label>
          <input
            id="goalProgress"
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </Field>
        <Field>
          <Label htmlFor="goalNotes">Notes (optional)</Label>
          <Textarea id="goalNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="mt-5 flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEdit ? "Save changes" : "Add goal"}
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
function GoalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
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
