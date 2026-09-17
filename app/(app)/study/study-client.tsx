"use client";

import { useEffect, useState } from "react";
import { Button, Chip, EmptyState, Field, Input, Label, Stack, ViewHeader } from "@/components/ui";
import { Modal, ConfirmModal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createSubject, updateSubject, deleteSubject, createSession, deleteSession } from "@/app/actions/study";
import type { Subject, StudySession } from "@/lib/types";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function StudyClient({
  initialSubjects,
  initialSessions,
}: {
  initialSubjects: Subject[];
  initialSessions: StudySession[];
}) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [sessions, setSessions] = useState(initialSessions);
  const [tab, setTab] = useState<"subjects" | "sessions">("subjects");
  const [subjModal, setSubjModal] = useState(false);
  const [sessModal, setSessModal] = useState(false);
  const [editingSubj, setEditingSubj] = useState<Subject | null>(null);
  const [confirmDelSubj, setConfirmDelSubj] = useState<Subject | null>(null);
  const toast = useToast();

  async function handleDeleteSubject(s: Subject) {
    setSubjects((prev) => prev.filter((x) => x.id !== s.id));
    await deleteSubject(s.id);
    toast.show("Subject deleted.");
  }

  async function handleDeleteSession(id: string) {
    setSessions((prev) => prev.filter((x) => x.id !== id));
    await deleteSession(id);
    toast.show("Session deleted.");
  }

  return (
    <div>
      <ViewHeader
        eyebrow={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""}`}
        title="Study"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => (tab === "subjects" ? (setEditingSubj(null), setSubjModal(true)) : setSessModal(true))}
          >
            <PlusIcon /> {tab === "subjects" ? "Add subject" : "Log session"}
          </Button>
        }
      />

      <div className="mb-7 flex gap-2">
        <Chip active={tab === "subjects"} onClick={() => setTab("subjects")}>
          Subjects
        </Chip>
        <Chip active={tab === "sessions"} onClick={() => setTab("sessions")}>
          Sessions
        </Chip>
      </div>

      {tab === "subjects" ? (
        subjects.length === 0 ? (
          <EmptyState
            icon={<StudyIcon />}
            title="No subjects yet."
            description="Add a subject you're studying — the rest of this page builds around it."
            action={
              <Button variant="primary" className="mt-2" onClick={() => { setEditingSubj(null); setSubjModal(true); }}>
                <PlusIcon /> Add subject
              </Button>
            }
          />
        ) : (
          <Stack>
            {subjects.map((s) => {
              const hours = sessions.filter((x) => x.subject_id === s.id).reduce((a, b) => a + b.minutes, 0) / 60;
              return (
                <div key={s.id} className="flex items-center gap-3.5 py-3.5 group">
                  <div className="flex-1">
                    <div className="text-[14.5px]">{s.name}</div>
                    <div className="text-xs text-[var(--ink-faint)]">
                      {hours > 0 ? `${hours.toFixed(1)} hrs logged` : "No sessions logged yet"}
                      {s.goal_hours ? ` · goal ${s.goal_hours} hrs` : ""}
                    </div>
                    {s.goal_hours > 0 && (
                      <div className="mt-2 h-[3px] max-w-[220px] rounded-full bg-[var(--line)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, (hours / s.goal_hours) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingSubj(s); setSubjModal(true); }} aria-label="Edit" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]">
                      <EditIcon />
                    </button>
                    <button onClick={() => setConfirmDelSubj(s)} aria-label="Delete" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] hover:bg-black/5 hover:text-[var(--ink)]">
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </Stack>
        )
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<StudyIcon />}
          title="No sessions logged."
          description={subjects.length ? "Log a study session to start tracking your hours." : "Add a subject first, then log sessions against it."}
          action={
            subjects.length ? (
              <Button variant="primary" className="mt-2" onClick={() => setSessModal(true)}>
                <PlusIcon /> Log session
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Stack>
          {sessions.map((sess) => {
            const subj = subjects.find((s) => s.id === sess.subject_id);
            return (
              <div key={sess.id} className="flex items-center gap-3.5 py-3.5 group">
                <div className="flex-1">
                  <div className="text-[14.5px]">{subj?.name ?? "Unknown subject"}</div>
                  <div className="text-xs text-[var(--ink-faint)]">
                    {fmtDate(sess.date)} · {(sess.minutes / 60).toFixed(1)} hrs
                    {sess.notes ? ` · ${sess.notes}` : ""}
                  </div>
                </div>
                <button onClick={() => handleDeleteSession(sess.id)} aria-label="Delete" className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] opacity-0 transition-opacity hover:bg-black/5 hover:text-[var(--ink)] group-hover:opacity-100">
                  <TrashIcon />
                </button>
              </div>
            );
          })}
        </Stack>
      )}

      <SubjectModal
        open={subjModal}
        onClose={() => setSubjModal(false)}
        subject={editingSubj}
        onCreated={(s) => setSubjects((prev) => [...prev, s])}
        onUpdated={(s) => setSubjects((prev) => prev.map((x) => (x.id === s.id ? s : x)))}
      />
      <SessionModal
        open={sessModal}
        onClose={() => setSessModal(false)}
        subjects={subjects}
        onCreated={(s) => setSessions((prev) => [s, ...prev])}
      />
      <ConfirmModal
        open={!!confirmDelSubj}
        onClose={() => setConfirmDelSubj(null)}
        title="Delete subject?"
        message={confirmDelSubj ? `"${confirmDelSubj.name}" and its logged sessions will remain in history but this subject will be removed.` : ""}
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelSubj && handleDeleteSubject(confirmDelSubj)}
      />
    </div>
  );
}

function SubjectModal({
  open,
  onClose,
  subject,
  onCreated,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  subject: Subject | null;
  onCreated: (s: Subject) => void;
  onUpdated: (s: Subject) => void;
}) {
  const isEdit = !!subject;
  const [name, setName] = useState(subject?.name ?? "");
  const [goalHours, setGoalHours] = useState(subject?.goal_hours?.toString() ?? "");
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setName(subject?.name ?? "");
      setGoalHours(subject?.goal_hours?.toString() ?? "");
    }
  }, [open, subject]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const gh = parseFloat(goalHours) || 0;
    if (isEdit && subject) {
      await updateSubject(subject.id, name, gh);
      onUpdated({ ...subject, name, goal_hours: gh });
      toast.show("Subject updated.");
    } else {
      await createSubject(name, gh);
      onCreated({ id: crypto.randomUUID(), user_id: "", name, goal_hours: gh });
      toast.show("Subject added.");
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit subject" : "Add subject"}>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="subjName">Subject name</Label>
          <Input id="subjName" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Physics" />
        </Field>
        <Field>
          <Label htmlFor="subjGoal">Weekly hour goal (optional)</Label>
          <Input id="subjGoal" type="number" min="0" step="0.5" value={goalHours} onChange={(e) => setGoalHours(e.target.value)} />
        </Field>
        <div className="mt-5 flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{isEdit ? "Save changes" : "Add subject"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function SessionModal({
  open,
  onClose,
  subjects,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  onCreated: (s: StudySession) => void;
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [minutes, setMinutes] = useState("30");
  const [notes, setNotes] = useState("");
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(minutes);
    if (!subjectId || !mins || mins <= 0) return;
    await createSession({ subject_id: subjectId, date, minutes: mins, notes });
    onCreated({ id: crypto.randomUUID(), user_id: "", subject_id: subjectId, date, minutes: mins, notes: notes || null });
    toast.show("Session logged.");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Log session">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="sessSubject">Subject</Label>
          <select
            id="sessSubject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded border border-[var(--line)] bg-[var(--paper-raised)] px-3 py-2.5 text-[15px] focus:outline-none focus:border-[var(--accent)]"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <div className="flex gap-3">
          <Field>
            <Label htmlFor="sessDate">Date</Label>
            <Input id="sessDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="sessMin">Minutes</Label>
            <Input id="sessMin" type="number" min="1" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </Field>
        </div>
        <Field>
          <Label htmlFor="sessNotes">Notes (optional)</Label>
          <Input id="sessNotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you cover?" />
        </Field>
        <div className="mt-5 flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Log session</Button>
        </div>
      </form>
    </Modal>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>;
}
function StudyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6.5C4 5.7 4.7 5 5.5 5H12v14H5.5A1.5 1.5 0 0 1 4 17.5v-11Z" />
      <path d="M20 6.5c0-.8-.7-1.5-1.5-1.5H12v14h6.5a1.5 1.5 0 0 0 1.5-1.5v-11Z" />
    </svg>
  );
}
function EditIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M4 20l.9-3.6L16.6 4.7a1.5 1.5 0 0 1 2.1 0l.6.6a1.5 1.5 0 0 1 0 2.1L7.6 19.1 4 20Z" /></svg>;
}
function TrashIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.1a1 1 0 0 1-1 .9H7.8a1 1 0 0 1-1-.9L6 7" /></svg>;
}
