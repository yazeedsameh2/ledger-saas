"use client";

import { useState, useTransition } from "react";
import { Button, EmptyState, Field, Input, Label, Stack, ViewHeader } from "@/components/ui";
import { Modal, ConfirmModal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createHabit, updateHabit, deleteHabit, toggleHabitToday } from "@/app/actions/habits";
import type { Habit, HabitLog } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function calcStreak(habitId: string, logs: HabitLog[]) {
  const dates = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.date));
  let streak = 0;
  const cur = new Date();
  while (true) {
    const iso = cur.toISOString().slice(0, 10);
    if (dates.has(iso)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else break;
  }
  return streak;
}

export function HabitsClient({ initialHabits, initialLogs }: { initialHabits: Habit[]; initialLogs: HabitLog[] }) {
  const [habits, setHabits] = useState(initialHabits);
  const [logs, setLogs] = useState(initialLogs);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Habit | null>(null);
  const [name, setName] = useState("");
  const [, startTransition] = useTransition();
  const toast = useToast();
  const today = todayISO();

  function openModal(habit: Habit | null) {
    setEditing(habit);
    setName(habit?.name ?? "");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      setHabits((prev) => prev.map((h) => (h.id === editing.id ? { ...h, name } : h)));
      startTransition(async () => updateHabit(editing.id, name));
      toast.show("Habit updated.");
    } else {
      const optimisticId = crypto.randomUUID();
      setHabits((prev) => [...prev, { id: optimisticId, user_id: "", name }]);
      startTransition(async () => createHabit(name));
      toast.show("Habit added.");
    }
    setModalOpen(false);
  }

  async function handleToggle(habit: Habit) {
    const done = logs.some((l) => l.habit_id === habit.id && l.date === today);
    if (done) {
      setLogs((prev) => prev.filter((l) => !(l.habit_id === habit.id && l.date === today)));
    } else {
      setLogs((prev) => [...prev, { id: crypto.randomUUID(), user_id: "", habit_id: habit.id, date: today }]);
    }
    startTransition(async () => toggleHabitToday(habit.id, today, done));
  }

  async function handleDelete(habit: Habit) {
    setHabits((prev) => prev.filter((h) => h.id !== habit.id));
    startTransition(async () => deleteHabit(habit.id));
    toast.show("Habit deleted.");
  }

  return (
    <div>
      <ViewHeader
        eyebrow={`${habits.length} tracked`}
        title="Habits"
        action={
          <Button variant="primary" size="sm" onClick={() => openModal(null)}>
            <PlusIcon /> New habit
          </Button>
        }
      />

      {habits.length === 0 ? (
        <EmptyState
          icon={<HabitIcon />}
          title="No habits yet."
          description="Add something you want to do consistently."
          action={
            <Button variant="primary" className="mt-2" onClick={() => openModal(null)}>
              <PlusIcon /> New habit
            </Button>
          }
        />
      ) : (
        <Stack>
          {habits.map((habit) => {
            const done = logs.some((l) => l.habit_id === habit.id && l.date === today);
            const streak = calcStreak(habit.id, logs);
            return (
              <div key={habit.id} className="flex items-center gap-3.5 py-3.5 group">
                <button
                  onClick={() => handleToggle(habit)}
                  aria-label="Mark today"
                  className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
                    done ? "bg-[var(--accent)] border-[var(--accent)]" : "border-[var(--line-strong)] hover:border-[var(--accent)]"
                  }`}
                >
                  {done && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2" className="h-[11px] w-[11px]">
                      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="flex-1">
                  <div className="text-[14.5px]">{habit.name}</div>
                  <div className="text-xs text-[var(--ink-faint)]">{streak > 0 ? `${streak} day streak` : "No streak yet"}</div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(habit)} aria-label="Edit" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]">
                    <EditIcon />
                  </button>
                  <button onClick={() => setConfirmDelete(habit)} aria-label="Delete" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]">
                    <TrashIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </Stack>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit habit" : "New habit"}>
        <form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="habitName">Habit</Label>
            <Input id="habitName" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Read 20 minutes" />
          </Field>
          <div className="mt-5 flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editing ? "Save changes" : "Add habit"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete habit?"
        message={confirmDelete ? `"${confirmDelete.name}" and its history will be removed.` : ""}
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function HabitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
      <circle cx="12" cy="12" r="3.2" />
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
