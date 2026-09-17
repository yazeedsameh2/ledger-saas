"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, EmptyState, Field, Input, Label, Textarea, ViewHeader } from "@/components/ui";
import { Modal, ConfirmModal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createNote, updateNote, deleteNote } from "@/app/actions/notes";
import type { Note } from "@/lib/types";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function NotesClient({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Note | null>(null);
  const toast = useToast();

  const list = useMemo(() => {
    let l = [...notes];
    if (query) l = l.filter((n) => `${n.title ?? ""}${n.body ?? ""}`.toLowerCase().includes(query.toLowerCase()));
    return l.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at));
  }, [notes, query]);

  function openModal(note: Note | null) {
    setEditing(note);
    setModalOpen(true);
  }

  async function handleDelete(note: Note) {
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await deleteNote(note.id);
    toast.show("Note deleted.");
  }

  return (
    <div>
      <ViewHeader
        eyebrow={`${notes.length} notes`}
        title="Notes"
        action={
          <Button variant="primary" size="sm" onClick={() => openModal(null)}>
            <PlusIcon /> New note
          </Button>
        }
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={<NoteIcon />}
          title="No notes yet."
          description="Capture a thought, list, or reminder."
          action={
            <Button variant="primary" className="mt-2" onClick={() => openModal(null)}>
              <PlusIcon /> New note
            </Button>
          }
        />
      ) : (
        <>
          <div className="relative mb-6">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-faint)]" />
            <Input placeholder="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>

          {list.length === 0 ? (
            <EmptyState icon={<SearchIcon />} title="No matches." description="Try a different search term." />
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
              {list.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openModal(n)}
                  className="flex h-full flex-col gap-2 rounded border border-[var(--line)] p-4 text-left transition-colors hover:border-[var(--line-strong)]"
                >
                  <div className="text-[14.5px] font-semibold">
                    {n.pinned && <PinIcon />} {n.title || "Untitled"}
                  </div>
                  <div className="flex-1 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{(n.body ?? "").slice(0, 140)}</div>
                  <div className="text-[11px] text-[var(--ink-faint)]">{fmtDate(n.updated_at)}</div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <NoteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        note={editing}
        onCreated={(n) => setNotes((prev) => [n, ...prev])}
        onUpdated={(n) => setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)))}
        onRequestDelete={(n) => {
          setModalOpen(false);
          setConfirmDelete(n);
        }}
      />

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete note?"
        message={confirmDelete ? `"${confirmDelete.title || "Untitled"}" will be removed.` : ""}
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
}

function NoteModal({
  open,
  onClose,
  note,
  onCreated,
  onUpdated,
  onRequestDelete,
}: {
  open: boolean;
  onClose: () => void;
  note: Note | null;
  onCreated: (n: Note) => void;
  onUpdated: (n: Note) => void;
  onRequestDelete: (n: Note) => void;
}) {
  const isEdit = !!note;
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setTitle(note?.title ?? "");
      setBody(note?.body ?? "");
      setPinned(note?.pinned ?? false);
    }
  }, [open, note]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() && !body.trim()) return;
    const input = { title, body, pinned };
    if (isEdit && note) {
      await updateNote(note.id, input);
      onUpdated({ ...note, title: title || null, body: body || null, pinned, updated_at: new Date().toISOString() });
      toast.show("Note updated.");
    } else {
      await createNote(input);
      onCreated({
        id: crypto.randomUUID(),
        user_id: "",
        title: title || null,
        body: body || null,
        pinned,
        updated_at: new Date().toISOString(),
      });
      toast.show("Note added.");
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit note" : "New note"}>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="noteTitle">Title</Label>
          <Input id="noteTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled" />
        </Field>
        <Field>
          <Label htmlFor="noteBody">Note</Label>
          <Textarea id="noteBody" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[140px]" />
        </Field>
        <Field>
          <label className="flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="w-auto" />
            Pin this note
          </label>
        </Field>
        <div className={`mt-5 flex border-t border-[var(--line)] pt-4 ${isEdit ? "justify-between" : "justify-end"}`}>
          {isEdit && note && (
            <Button type="button" variant="danger" onClick={() => onRequestDelete(note)}>
              <TrashIcon /> Delete
            </Button>
          )}
          <div className="flex gap-2.5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEdit ? "Save changes" : "Add note"}
            </Button>
          </div>
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
function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3.5h9L19 8v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V8h5" />
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
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="inline h-3 w-3 -translate-y-px">
      <path d="M12 2l1.5 5.5L19 9l-4.5 3.5L16 18l-4-3.5L8 18l1.5-5.5L5 9l5.5-1.5Z" />
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
