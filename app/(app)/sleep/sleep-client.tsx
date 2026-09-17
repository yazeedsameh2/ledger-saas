"use client";

import { useState, useTransition } from "react";
import { Button, EmptyState, Field, Input, Label, Stack, ViewHeader } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createSleepEntry, deleteSleepEntry } from "@/app/actions/sleep";
import type { SleepEntry } from "@/lib/types";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function duration(bedtime: string, wake: string) {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return mins;
}

export function SleepClient({ initialEntries }: { initialEntries: SleepEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [modalOpen, setModalOpen] = useState(false);
  const [, startTransition] = useTransition();
  const toast = useToast();

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const avg = entries.length ? entries.reduce((a, b) => a + duration(b.bedtime, b.wake_time), 0) / entries.length : 0;

  async function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    startTransition(async () => deleteSleepEntry(id));
    toast.show("Sleep entry deleted.");
  }

  return (
    <div>
      <ViewHeader
        eyebrow={`${entries.length} entries`}
        title="Sleep"
        action={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            <PlusIcon /> Log sleep
          </Button>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={<SleepIcon />}
          title="No sleep logged yet."
          description="Track your bedtime and wake time to see patterns build over time."
          action={
            <Button variant="primary" className="mt-2" onClick={() => setModalOpen(true)}>
              <PlusIcon /> Log sleep
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex items-end justify-between border-t border-[var(--line)] py-5">
            <span className="text-[13.5px] text-[var(--ink-soft)]">Average duration</span>
            <span className="font-mono text-[26px]">
              {(avg / 60).toFixed(1)}
              <small className="text-sm text-[var(--ink-faint)]"> hrs</small>
            </span>
          </div>

          <div className="mb-3.5 mt-9 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">History</div>
          <Stack>
            {sorted.map((e) => (
              <div key={e.id} className="flex items-center gap-3.5 py-3.5 group">
                <div className="flex-1">
                  <div className="text-[14.5px]">{fmtDate(e.date)}</div>
                  <div className="text-xs text-[var(--ink-faint)]">
                    {e.bedtime} → {e.wake_time} · {(duration(e.bedtime, e.wake_time) / 60).toFixed(1)} hrs
                    {e.notes ? ` · ${e.notes}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(e.id)}
                  aria-label="Delete"
                  className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] opacity-0 transition-opacity hover:bg-black/5 hover:text-[var(--ink)] group-hover:opacity-100"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </Stack>
        </>
      )}

      <SleepModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={(e) => setEntries((prev) => [e, ...prev])} />
    </div>
  );
}

function SleepModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (e: SleepEntry) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bedtime, setBedtime] = useState("23:00");
  const [wake, setWake] = useState("07:00");
  const [notes, setNotes] = useState("");
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createSleepEntry({ date, bedtime, wake_time: wake, notes });
    onCreated({ id: crypto.randomUUID(), user_id: "", date, bedtime, wake_time: wake, notes: notes || null });
    toast.show("Sleep logged.");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Log sleep">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="sleepDate">Date (wake date)</Label>
          <Input id="sleepDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="flex gap-3">
          <Field>
            <Label htmlFor="bedtime">Bedtime</Label>
            <Input id="bedtime" type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="wake">Wake time</Label>
            <Input id="wake" type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
          </Field>
        </div>
        <Field>
          <Label htmlFor="sleepNotes">Notes (optional)</Label>
          <Input id="sleepNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="mt-5 flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save
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
function SleepIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
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
