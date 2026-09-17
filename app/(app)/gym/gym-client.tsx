"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Chip, EmptyState, Field, Input, Label, Stack, ViewHeader } from "@/components/ui";
import { Modal, ConfirmModal } from "@/components/modal";
import { useToast } from "@/components/toast";
import {
  createRoutine,
  updateRoutine,
  duplicateRoutine,
  deleteRoutine,
  logWorkout,
  deleteWorkoutLog,
  logBodyWeight,
  deleteBodyWeight,
} from "@/app/actions/gym";
import type { Workout, WorkoutExercise, WorkoutLog, WorkoutLogEntry, BodyWeight, WorkoutSet } from "@/lib/types";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Sparkline({ values }: { values: number[] }) {
  const w = 72, h = 24, pad = 3;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1 || 1);
  const pts = values.map((v, i) => `${(pad + i * step).toFixed(1)},${(h - pad - ((v - min) / range) * (h - pad * 2)).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Tab = "routines" | "history" | "records" | "bodyweight";

export function GymClient({
  initialWorkouts,
  initialExercises,
  initialLogs,
  initialEntries,
  initialBodyWeights,
}: {
  initialWorkouts: Workout[];
  initialExercises: WorkoutExercise[];
  initialLogs: WorkoutLog[];
  initialEntries: WorkoutLogEntry[];
  initialBodyWeights: BodyWeight[];
}) {
  const [workouts] = useState(initialWorkouts);
  const [exercises] = useState(initialExercises);
  const [logs] = useState(initialLogs);
  const [entries] = useState(initialEntries);
  const [bodyWeights, setBodyWeights] = useState(initialBodyWeights);
  const [tab, setTab] = useState<Tab>("routines");
  const [routineModal, setRoutineModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Workout | null>(null);
  const [logModal, setLogModal] = useState(false);
  const [weightModal, setWeightModal] = useState(false);
  const [confirmDelRoutine, setConfirmDelRoutine] = useState<Workout | null>(null);
  const toast = useToast();

  async function handleDeleteRoutine(w: Workout) {
    await deleteRoutine(w.id);
    toast.show("Routine deleted.");
    location.reload();
  }

  async function handleDuplicate(w: Workout) {
    await duplicateRoutine(w.id);
    toast.show("Routine created.");
    location.reload();
  }

  async function handleDeleteLog(id: string) {
    await deleteWorkoutLog(id);
    toast.show("Log deleted.");
    location.reload();
  }

  async function handleDeleteWeight(id: string) {
    setBodyWeights((prev) => prev.filter((w) => w.id !== id));
    await deleteBodyWeight(id);
    toast.show("Weight entry deleted.");
  }

  const records = useMemo(() => {
    const map: Record<string, { weight: number; date: string; history: { date: string; weight: number }[] }> = {};
    for (const entry of entries) {
      const maxSetW = Math.max(0, ...(entry.sets as WorkoutSet[]).map((s) => s.weight || 0));
      const log = logs.find((l) => l.id === entry.log_id);
      if (!log) continue;
      if (!map[entry.exercise_name]) map[entry.exercise_name] = { weight: 0, date: log.date, history: [] };
      map[entry.exercise_name].history.push({ date: log.date, weight: maxSetW });
      if (maxSetW > map[entry.exercise_name].weight) {
        map[entry.exercise_name].weight = maxSetW;
        map[entry.exercise_name].date = log.date;
      }
    }
    return map;
  }, [entries, logs]);

  return (
    <div>
      <ViewHeader
        eyebrow={`${workouts.length} routines`}
        title="Gym"
        action={
          tab !== "records" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (tab === "routines") { setEditingRoutine(null); setRoutineModal(true); }
                else if (tab === "history") setLogModal(true);
                else setWeightModal(true);
              }}
            >
              <PlusIcon /> {tab === "routines" ? "New routine" : tab === "bodyweight" ? "Log weight" : "Log workout"}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-7 flex gap-2">
        <Chip active={tab === "routines"} onClick={() => setTab("routines")}>Routines</Chip>
        <Chip active={tab === "history"} onClick={() => setTab("history")}>History</Chip>
        <Chip active={tab === "records"} onClick={() => setTab("records")}>Personal records</Chip>
        <Chip active={tab === "bodyweight"} onClick={() => setTab("bodyweight")}>Body weight</Chip>
      </div>

      {tab === "routines" && (
        workouts.length === 0 ? (
          <EmptyState
            icon={<GymIcon />}
            title="No routines yet."
            description="Build a routine with the exercises you actually do — nothing preloaded."
            action={<Button variant="primary" className="mt-2" onClick={() => { setEditingRoutine(null); setRoutineModal(true); }}><PlusIcon /> New routine</Button>}
          />
        ) : (
          <Stack>
            {workouts.map((w) => {
              const wExercises = exercises.filter((e) => e.workout_id === w.id);
              return (
                <div key={w.id} className="flex items-start gap-3.5 py-3.5 group">
                  <div className="flex-1">
                    <div className="text-[14.5px]">{w.name}</div>
                    <div className="text-xs text-[var(--ink-faint)]">
                      {wExercises.length} exercise{wExercises.length !== 1 ? "s" : ""}
                      {wExercises.length ? `: ${wExercises.map((e) => e.name).join(", ")}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDuplicate(w)} aria-label="Duplicate" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]"><CopyIcon /></button>
                    <button onClick={() => { setEditingRoutine(w); setRoutineModal(true); }} aria-label="Edit" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]"><EditIcon /></button>
                    <button onClick={() => setConfirmDelRoutine(w)} aria-label="Delete" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]"><TrashIcon /></button>
                  </div>
                </div>
              );
            })}
          </Stack>
        )
      )}

      {tab === "history" && (
        logs.length === 0 ? (
          <EmptyState
            icon={<GymIcon />}
            title="No workouts logged."
            description={workouts.length ? "Log a session to start building your history." : "Create a routine first, then log sessions against it."}
            action={workouts.length ? <Button variant="primary" className="mt-2" onClick={() => setLogModal(true)}><PlusIcon /> Log workout</Button> : undefined}
          />
        ) : (
          <Stack>
            {logs.map((log) => {
              const routine = workouts.find((w) => w.id === log.workout_id);
              const logEntries = entries.filter((e) => e.log_id === log.id);
              const volume = logEntries.reduce((sum, e) => sum + (e.sets as WorkoutSet[]).reduce((s2, s) => s2 + (s.reps || 0) * (s.weight || 0), 0), 0);
              return (
                <div key={log.id} className="flex items-start gap-3.5 py-3.5 group">
                  <div className="flex-1">
                    <div className="text-[14.5px]">{routine?.name ?? "Deleted routine"}</div>
                    <div className="text-xs text-[var(--ink-faint)]">
                      {fmtDate(log.date)}
                      {volume > 0 ? ` · Volume: ${volume.toLocaleString()}` : ""}
                      {log.notes ? ` · ${log.notes}` : ""}
                    </div>
                    {logEntries.length > 0 && (
                      <div className="mt-1 text-xs text-[var(--ink-faint)]">
                        {logEntries.map((e) => `${e.exercise_name}: ${(e.sets as WorkoutSet[]).map((s) => `${s.reps}×${s.weight}`).join(", ")}`).join(" · ")}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDeleteLog(log.id)} aria-label="Delete" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] opacity-0 transition-opacity hover:bg-black/5 hover:text-[var(--ink)] group-hover:opacity-100"><TrashIcon /></button>
                </div>
              );
            })}
          </Stack>
        )
      )}

      {tab === "records" && (
        Object.keys(records).length === 0 ? (
          <EmptyState icon={<GymIcon />} title="No records yet." description="Personal records appear automatically once you log workouts with weights." />
        ) : (
          <div className="flex flex-col divide-y divide-[var(--line)]">
            {Object.entries(records).map(([name, rec]) => {
              const hist = [...rec.history].sort((a, b) => a.date.localeCompare(b.date));
              return (
                <div key={name} className="flex items-center justify-between gap-5 py-5 first:border-t-0">
                  <span className="text-[13.5px] text-[var(--ink-soft)]">{name}</span>
                  <div className="flex items-center gap-3.5">
                    {hist.length > 1 && <Sparkline values={hist.map((h) => h.weight)} />}
                    <span className="font-mono text-[26px]">
                      {rec.weight}
                      <small className="text-sm text-[var(--ink-faint)]"> · {fmtDate(rec.date)}</small>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "bodyweight" && (
        bodyWeights.length === 0 ? (
          <EmptyState
            icon={<GymIcon />}
            title="No weight logged yet."
            description="Track your body weight over time alongside your lifts."
            action={<Button variant="primary" className="mt-2" onClick={() => setWeightModal(true)}><PlusIcon /> Log weight</Button>}
          />
        ) : (
          <>
            {(() => {
              const sorted = [...bodyWeights].sort((a, b) => a.date.localeCompare(b.date));
              const first = sorted[0], last = sorted[sorted.length - 1];
              const change = last.weight - first.weight;
              return (
                <>
                  <div className="flex items-end justify-between border-t border-[var(--line)] py-5">
                    <span className="text-[13.5px] text-[var(--ink-soft)]">Current</span>
                    <span className="font-mono text-[26px]">
                      {last.weight}
                      <small className="text-sm text-[var(--ink-faint)]"> kg</small>
                    </span>
                  </div>
                  <div className="flex items-end justify-between border-t border-[var(--line)] py-5">
                    <span className="text-[13.5px] text-[var(--ink-soft)]">Change since first log</span>
                    <div className="flex items-center gap-3.5">
                      {sorted.length > 1 && <Sparkline values={sorted.map((w) => w.weight)} />}
                      <span className="font-mono text-[26px]" style={{ color: change < 0 ? "var(--good)" : change > 0 ? "var(--accent)" : "var(--ink)" }}>
                        {change > 0 ? "+" : ""}
                        {change.toFixed(1)}
                        <small className="text-sm text-[var(--ink-faint)]"> kg</small>
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
            <div className="mb-3.5 mt-9 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">History</div>
            <Stack>
              {[...bodyWeights].sort((a, b) => b.date.localeCompare(a.date)).map((w) => (
                <div key={w.id} className="flex items-center gap-3.5 py-3.5 group">
                  <div className="flex-1">
                    <div className="text-[14.5px]">{w.weight} kg</div>
                    <div className="text-xs text-[var(--ink-faint)]">{fmtDate(w.date)}</div>
                  </div>
                  <button onClick={() => handleDeleteWeight(w.id)} aria-label="Delete" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] opacity-0 transition-opacity hover:bg-black/5 hover:text-[var(--ink)] group-hover:opacity-100"><TrashIcon /></button>
                </div>
              ))}
            </Stack>
          </>
        )
      )}

      <RoutineModal
        open={routineModal}
        onClose={() => setRoutineModal(false)}
        routine={editingRoutine}
        existingExercises={editingRoutine ? exercises.filter((e) => e.workout_id === editingRoutine.id) : []}
      />
      <LogWorkoutModal open={logModal} onClose={() => setLogModal(false)} workouts={workouts} exercises={exercises} />
      <WeightModal open={weightModal} onClose={() => setWeightModal(false)} onCreated={(w) => setBodyWeights((prev) => [...prev, w])} />
      <ConfirmModal
        open={!!confirmDelRoutine}
        onClose={() => setConfirmDelRoutine(null)}
        title="Delete routine?"
        message={confirmDelRoutine ? `"${confirmDelRoutine.name}" will be removed. Past workout history stays intact.` : ""}
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelRoutine && handleDeleteRoutine(confirmDelRoutine)}
      />
    </div>
  );
}

function RoutineModal({
  open,
  onClose,
  routine,
  existingExercises,
}: {
  open: boolean;
  onClose: () => void;
  routine: Workout | null;
  existingExercises: WorkoutExercise[];
}) {
  const isEdit = !!routine;
  const [name, setName] = useState(routine?.name ?? "");
  const [exerciseList, setExerciseList] = useState<string[]>(existingExercises.map((e) => e.name));
  const [exInput, setExInput] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setName(routine?.name ?? "");
      setExerciseList(existingExercises.map((e) => e.name));
    }
    // existingExercises is derived fresh from props each render; routine identity is what matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, routine]);

  function addExercise() {
    if (!exInput.trim()) return;
    setExerciseList((prev) => [...prev, exInput.trim()]);
    setExInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEdit && routine) {
      await updateRoutine(routine.id, name, exerciseList);
      toast.show("Routine updated.");
    } else {
      await createRoutine(name, exerciseList);
      toast.show("Routine created.");
    }
    onClose();
    location.reload();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit routine" : "New routine"}>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="routineName">Routine name</Label>
          <Input id="routineName" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Upper body" />
        </Field>
        <Field>
          <Label>Exercises</Label>
          <Stack>
            {exerciseList.map((ex, i) => (
              <div key={i} className="flex items-center gap-2 py-2">
                <div className="flex-1 text-[14.5px]">{ex}</div>
                <button type="button" onClick={() => setExerciseList((prev) => prev.filter((_, idx) => idx !== i))} className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]">
                  <XIcon />
                </button>
              </div>
            ))}
          </Stack>
          <div className="mt-2.5 flex gap-2">
            <Input
              value={exInput}
              onChange={(e) => setExInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExercise(); } }}
              placeholder="Exercise name"
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="sm" onClick={addExercise}><PlusIcon /> Add</Button>
          </div>
        </Field>
        <div className="mt-5 flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{isEdit ? "Save changes" : "Create routine"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function LogWorkoutModal({
  open,
  onClose,
  workouts,
  exercises,
}: {
  open: boolean;
  onClose: () => void;
  workouts: Workout[];
  exercises: WorkoutExercise[];
}) {
  const [workoutId, setWorkoutId] = useState(workouts[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [setInputs, setSetInputs] = useState<Record<string, string>>({});
  const toast = useToast();

  const relevantExercises = exercises.filter((e) => e.workout_id === workoutId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workoutId) return;
    const parsedEntries = relevantExercises
      .map((ex) => {
        const raw = setInputs[ex.name] ?? "";
        if (!raw.trim()) return null;
        const sets: WorkoutSet[] = raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((pair) => {
            const [reps, weight] = pair.toLowerCase().split("x").map((x) => parseFloat(x));
            return { reps: reps || 0, weight: weight || 0 };
          });
        return { exercise_name: ex.name, sets };
      })
      .filter((x): x is { exercise_name: string; sets: WorkoutSet[] } => x !== null);

    await logWorkout({ workout_id: workoutId, date, notes, entries: parsedEntries });
    toast.show("Workout logged.");
    onClose();
    location.reload();
  }

  return (
    <Modal open={open} onClose={onClose} title="Log workout">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="logRoutine">Routine</Label>
          <select
            id="logRoutine"
            value={workoutId}
            onChange={(e) => setWorkoutId(e.target.value)}
            className="w-full rounded border border-[var(--line)] bg-[var(--paper-raised)] px-3 py-2.5 text-[15px] focus:outline-none focus:border-[var(--accent)]"
          >
            {workouts.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </Field>
        <Field>
          <Label htmlFor="logDate">Date</Label>
          <Input id="logDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {relevantExercises.map((ex) => (
          <Field key={ex.id}>
            <Label>{ex.name} — reps × weight</Label>
            <Input
              value={setInputs[ex.name] ?? ""}
              onChange={(e) => setSetInputs((prev) => ({ ...prev, [ex.name]: e.target.value }))}
              placeholder="e.g. 10x40, 8x45"
            />
          </Field>
        ))}
        <Field>
          <Label htmlFor="logNotes">Notes (optional)</Label>
          <Input id="logNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="mt-5 flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save workout</Button>
        </div>
      </form>
    </Modal>
  );
}

function WeightModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (w: BodyWeight) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w <= 0) return;
    await logBodyWeight(date, w);
    onCreated({ id: crypto.randomUUID(), user_id: "", date, weight: w });
    toast.show("Weight logged.");
    setWeight("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Log weight">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Field>
            <Label htmlFor="wDate">Date</Label>
            <Input id="wDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="wKg">kg</Label>
            <Input id="wKg" type="number" min="0" step="0.1" required value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save</Button>
        </div>
      </form>
    </Modal>
  );
}

function PlusIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>; }
function XIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-4 w-4"><path d="M18 6 6 18M6 6l18 18" /></svg>; }
function GymIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 8v8M18 8v8M2 10v4M22 10v4M6 12h12" /></svg>; }
function EditIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M4 20l.9-3.6L16.6 4.7a1.5 1.5 0 0 1 2.1 0l.6.6a1.5 1.5 0 0 1 0 2.1L7.6 19.1 4 20Z" /></svg>; }
function TrashIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.1a1 1 0 0 1-1 .9H7.8a1 1 0 0 1-1-.9L6 7" /></svg>; }
function CopyIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect x="9" y="9" width="12" height="12" rx="1.5" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></svg>; }
