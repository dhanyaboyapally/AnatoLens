"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, GripVertical, Pencil, Plus, StickyNote, X } from "lucide-react";
import {
  createUserNote,
  deleteUserNote,
  listUserNotes,
  updateUserNote,
  type NoteRow,
} from "../../../lib/notes";
import { supabase } from "../../../lib/supabase";

type NoteOwner = { id: string; name: string };

type Note = {
  id: string;
  structureId: string;
  structureName: string;
  text: string;
  x: number;
  y: number;
  color: string;
};

const NOTE_COLORS = [
  { bg: "#fef08a", border: "#ca8a04", text: "#713f12", name: "yellow" },
  { bg: "#bfdbfe", border: "#3b82f6", text: "#1e3a5f", name: "blue" },
  { bg: "#bbf7d0", border: "#22c55e", text: "#14532d", name: "green" },
  { bg: "#fecaca", border: "#ef4444", text: "#7f1d1d", name: "red" },
  { bg: "#e9d5ff", border: "#a855f7", text: "#4a1d96", name: "purple" },
];

function mapNote(row: NoteRow, index: number): Note {
  return {
    id: row.id,
    structureId: row.organ,
    structureName: row.organ,
    text: row.note,
    x: Math.max(12, window.innerWidth / 2 - 100),
    y: 110 + (index % 4) * 18,
    color: NOTE_COLORS[index % NOTE_COLORS.length].name,
  };
}

function StickyNoteCard({
  note,
  onDelete,
  onUpdate,
}: {
  note: Note;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string, x: number, y: number) => void;
}) {
  const color = NOTE_COLORS.find((item) => item.name === note.color) ?? NOTE_COLORS[0];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const [position, setPosition] = useState({ x: note.x, y: note.y });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const textRef = useRef<HTMLTextAreaElement>(null);

  const startDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, textarea")) return;
    dragging.current = true;
    offset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveNote = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setPosition({
      x: Math.max(8, event.clientX - offset.current.x),
      y: Math.max(8, event.clientY - offset.current.y),
    });
  };

  const finishDragging = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onUpdate(note.id, draft, position.x, position.y);
  };

  const saveEdit = () => {
    setEditing(false);
    onUpdate(note.id, draft, position.x, position.y);
  };

  useEffect(() => {
    if (editing) textRef.current?.focus();
  }, [editing]);

  return (
    <motion.div
      className="sticky-note-card"
      initial={{ opacity: 0, scale: 0.85, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -8 }}
      style={{ left: position.x, top: position.y, backgroundColor: color.bg, borderColor: color.border }}
      onPointerDown={startDragging}
      onPointerMove={moveNote}
      onPointerUp={finishDragging}
      onPointerCancel={finishDragging}
    >
      <div className="sticky-note-header" style={{ backgroundColor: `${color.border}22`, borderColor: `${color.border}30` }}>
        <GripVertical size={13} style={{ color: color.text, opacity: 0.55 }} />
        <span style={{ color: color.text }}>{note.structureName}</span>
        <button type="button" onClick={() => setEditing((value) => !value)} aria-label="Edit note">
          {editing ? <Check size={12} style={{ color: color.text }} /> : <Pencil size={12} style={{ color: color.text }} />}
        </button>
        <button type="button" onClick={() => onDelete(note.id)} aria-label="Delete note">
          <X size={12} style={{ color: color.text }} />
        </button>
      </div>
      <div className="sticky-note-body">
        {editing ? (
          <textarea
            ref={textRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={saveEdit}
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.metaKey) saveEdit();
            }}
            rows={4}
            placeholder="Write a note…"
            style={{ color: color.text, caretColor: color.border }}
          />
        ) : (
          <p style={{ color: color.text }} onDoubleClick={() => setEditing(true)}>
            {note.text || <span className="sticky-note-placeholder">Double-click to edit…</span>}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function StickyNotesLayer({
  selectedStructure,
  userId,
}: {
  selectedStructure?: NoteOwner | null;
  userId?: string | null;
}) {
  selectedStructure ??= null;
  userId ??= null;
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState(userId);
  const activeUserId = userId ?? resolvedUserId;

  useEffect(() => {
    setResolvedUserId(userId);
    if (userId || !supabase) return;

    void supabase.auth.getUser().then(({ data }) => {
      setResolvedUserId(data.user?.id ?? null);
    });
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      (_event, session) => setResolvedUserId(session?.user?.id ?? null),
    );
    return () => authSubscription.subscription.unsubscribe();
  }, [userId]);

  useEffect(() => {
    let active = true;
    if (!activeUserId) {
      setNotes([]);
      setError(null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    void listUserNotes()
      .then((rows) => {
        if (active) setNotes(rows.map(mapNote));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load notes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeUserId]);

  const addNote = async () => {
    if (!selectedStructure || !activeUserId) {
      setError("Sign in before creating notes.");
      return;
    }
    const color = NOTE_COLORS[colorIndex % NOTE_COLORS.length];
    setSaving(true);
    setError(null);
    try {
      const row = await createUserNote(selectedStructure.id, "");
      setNotes((current) => [...current, { ...mapNote(row, current.length), color: color.name, structureName: selectedStructure.name }]);
      setColorIndex((value) => value + 1);
      setOpen(false);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to create note.");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = useCallback(async (id: string) => {
    setError(null);
    try {
      await deleteUserNote(id);
      setNotes((current) => current.filter((note) => note.id !== id));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to delete note.");
    }
  }, []);

  const updateNote = useCallback(async (id: string, text: string, x: number, y: number) => {
    setError(null);
    try {
      await updateUserNote(id, text);
      setNotes((current) => current.map((note) => note.id === id ? { ...note, text, x, y } : note));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to update note.");
    }
  }, []);

  const visibleNotes = selectedStructure
    ? notes.filter((note) => note.structureId === selectedStructure.id)
    : [];

  return (
    <>
      <div className="sticky-notes-control">
        <button
          type="button"
          className={`icon-button sticky-notes-button ${open ? "active" : ""}`}
          onClick={() => setOpen((value) => !value)}
          aria-label={selectedStructure ? `Notes for ${selectedStructure.name}` : "Sign in and select a structure before taking notes"}
          title={selectedStructure ? `Notes for ${selectedStructure.name}` : "Sign in and select a structure before taking notes"}
        >
          <StickyNote size={17} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div className="sticky-notes-menu" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              <span className="sticky-notes-menu-label">
                {selectedStructure ? `${selectedStructure.name} NOTES` : "SIGN IN AND SELECT AN ORGAN"}
              </span>
              {loading && <p className="sticky-notes-empty">Loading saved notes…</p>}
              {selectedStructure && (
                <div className="sticky-notes-list" aria-label={`Saved notes for ${selectedStructure.name}`}>
                  {visibleNotes.length > 0 ? visibleNotes.map((note) => {
                    const color = NOTE_COLORS.find((item) => item.name === note.color) ?? NOTE_COLORS[0];
                    return (
                      <div className="sticky-notes-list-item" key={note.id}>
                        <span className="sticky-notes-list-dot" style={{ backgroundColor: color.border }} />
                        <span>{note.text.trim() || "Empty note — double-click the note to edit"}</span>
                      </div>
                    );
                  }) : (
                    <p className="sticky-notes-empty">No saved notes for this structure yet.</p>
                  )}
                </div>
              )}
              <div className="sticky-notes-colors">
                {NOTE_COLORS.map((color, index) => (
                  <button key={color.name} type="button" aria-label={`Use ${color.name} note`} onClick={() => setColorIndex(index)} style={{ backgroundColor: color.bg, borderColor: colorIndex % NOTE_COLORS.length === index ? color.border : "transparent" }} />
                ))}
              </div>
              <button type="button" className="sticky-notes-add" onClick={() => void addNote()} disabled={!selectedStructure || !activeUserId || saving}>
                <Plus size={13} /> {saving ? "SAVING…" : "ADD NOTE"}
              </button>
              {error && <p className="sticky-notes-error" role="alert">{error}</p>}
              {visibleNotes.length > 0 && <small>{visibleNotes.length} note{visibleNotes.length === 1 ? "" : "s"} for this structure</small>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {visibleNotes.map((note) => <StickyNoteCard key={note.id} note={note} onDelete={deleteNote} onUpdate={updateNote} />)}
      </AnimatePresence>
    </>
  );
}
