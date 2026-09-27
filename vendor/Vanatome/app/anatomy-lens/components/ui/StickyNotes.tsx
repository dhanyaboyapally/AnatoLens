"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bold, Check, GripVertical, Italic, Pencil, Plus, StickyNote, Strikethrough, Underline, X } from "lucide-react";
import {
  createUserNote,
  listUserNotes,
  updateUserNote,
  type NoteRow,
} from "../../../lib/notes";
import {
  editableHtmlToMarkup,
  markupToEditableHtml,
  parseStickyNoteContent,
  serializeStickyNoteContent,
} from "../../../lib/sticky-note-content";
import { supabase } from "../../../lib/supabase";

type NoteOwner = { id: string; name: string; parentId?: string | null };

const EMPTY_STRUCTURES: readonly NoteOwner[] = [];

type Note = {
  id: string;
  structureId: string;
  structureName: string;
  text: string;
  x: number;
  y: number;
  color: string;
  updatedAt: string;
  completed: boolean;
  isDraft?: boolean;
};

const NOTE_COLORS = [
  { bg: "#fef08a", border: "#ca8a04", text: "#713f12", name: "yellow" },
  { bg: "#bfdbfe", border: "#3b82f6", text: "#1e3a5f", name: "blue" },
  { bg: "#bbf7d0", border: "#22c55e", text: "#14532d", name: "green" },
  { bg: "#fecaca", border: "#ef4444", text: "#7f1d1d", name: "red" },
  { bg: "#e9d5ff", border: "#a855f7", text: "#4a1d96", name: "purple" },
];

function mapNote(row: NoteRow, index: number, structureById: ReadonlyMap<string, NoteOwner>): Note {
  const content = parseStickyNoteContent(row.note);
  return {
    id: row.id,
    structureId: row.organ,
    structureName: structureById.get(row.organ)?.name ?? row.organ,
    text: content.content,
    x: Math.max(12, window.innerWidth / 2 - 100),
    y: 110 + (index % 4) * 18,
    color: NOTE_COLORS[index % NOTE_COLORS.length].name,
    updatedAt: row.updated_at,
    completed: content.completed,
  };
}

function noteMatchesStructure(
  noteId: string,
  selectedId: string,
  structureById: ReadonlyMap<string, NoteOwner>,
) {
  const hasAncestor = (id: string, ancestorId: string) => {
    let parentId = structureById.get(id)?.parentId;
    while (parentId) {
      if (parentId === ancestorId) return true;
      parentId = structureById.get(parentId)?.parentId;
    }
    return false;
  };
  return noteId === selectedId || hasAncestor(noteId, selectedId) || hasAncestor(selectedId, noteId);
}

function StickyNoteCard({
  note,
  onDiscard,
  onDismiss,
  onUpdate,
  onCancel,
  autoEdit = false,
}: {
  note: Note;
  onDiscard: (id: string) => void;
  onDismiss: (id: string) => void;
  onUpdate: (id: string, text: string, x: number, y: number) => void | Promise<void>;
  onCancel: (id: string) => void;
  autoEdit?: boolean;
}) {
  const color = NOTE_COLORS.find((item) => item.name === note.color) ?? NOTE_COLORS[0];
  const [editing, setEditing] = useState(autoEdit);
  const [draft, setDraft] = useState(note.text);
  const [position, setPosition] = useState({ x: note.x, y: note.y });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  const startDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (note.isDraft || (event.target as HTMLElement).closest("button, textarea, [contenteditable='true']")) return;
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
    void onUpdate(note.id, draft, position.x, position.y);
  };

  const saveEdit = async () => {
    const text = editorRef.current
      ? editableHtmlToMarkup(editorRef.current.innerHTML)
      : draft;
    setDraft(text);
    try {
      await onUpdate(note.id, text, position.x, position.y);
      setEditing(false);
    } catch {
      // Keep the editor open so a failed save can be corrected and retried.
    }
  };

  const cancelEdit = () => {
    if (note.isDraft) {
      onDiscard(note.id);
      return;
    }
    setDraft(note.text);
    setEditing(false);
    onCancel(note.id);
  };

  useEffect(() => {
    if (!editing || !editorRef.current) return;
    editorRef.current.innerHTML = markupToEditableHtml(note.text);
    editorRef.current.focus();
  }, [editing, note.text]);

  const applyFormat = (command: "bold" | "italic" | "underline" | "strikeThrough") => {
    editorRef.current?.focus();
    document.execCommand(command);
    if (editorRef.current) {
      setDraft(editableHtmlToMarkup(editorRef.current.innerHTML));
    }
  };

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
        <button
            type="button"
            onClick={() => {
              if (editing) {
                void saveEdit();
              } else {
                setDraft(note.text);
                setEditing(true);
              }
            }}
            aria-label={editing ? "Save note" : "Edit note"}
          >
          {editing ? <Check size={12} style={{ color: color.text }} /> : <Pencil size={12} style={{ color: color.text }} />}
        </button>
        <button
          type="button"
          onClick={() => (editing ? cancelEdit() : onDismiss(note.id))}
          aria-label={editing ? "Cancel note edit" : "Close note"}
        >
          <X size={12} style={{ color: color.text }} />
        </button>
      </div>
      <div className="sticky-note-body">
        {editing ? (
          <>
            <div className="sticky-note-format-toolbar" role="toolbar" aria-label="Format note text">
              <button type="button" aria-label="Bold" title="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("bold")}><Bold size={14} /></button>
              <button type="button" aria-label="Italic" title="Italic" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("italic")}><Italic size={14} /></button>
              <button type="button" aria-label="Underline" title="Underline" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("underline")}><Underline size={14} /></button>
              <button type="button" aria-label="Strikethrough" title="Strikethrough" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("strikeThrough")}><Strikethrough size={14} /></button>
            </div>
            <div
              ref={editorRef}
              className="sticky-note-editor"
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="Sticky note text"
              aria-multiline="true"
              onInput={(event) => setDraft(editableHtmlToMarkup(event.currentTarget.innerHTML))}
            onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void saveEdit();
            }}
              data-placeholder="Write a note…"
              style={{ color: color.text, caretColor: color.border }}
            />
          </>
        ) : (
          <div
            className="sticky-note-rendered-content"
            style={{ color: color.text }}
            onDoubleClick={() => { setDraft(note.text); setEditing(true); }}
            dangerouslySetInnerHTML={{ __html: note.text ? markupToEditableHtml(note.text) : '<span class="sticky-note-placeholder">Double-click to edit…</span>' }}
          />
        )}
      </div>
    </motion.div>
  );
}

export function StickyNotesLayer({
  selectedStructure,
  userId,
  structures = EMPTY_STRUCTURES,
}: {
  selectedStructure?: NoteOwner | null;
  userId?: string | null;
  structures?: readonly NoteOwner[];
}) {
  selectedStructure ??= null;
  userId ??= null;
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesOwnerId, setNotesOwnerId] = useState<string | null>(null);
  const [dismissedNoteIds, setDismissedNoteIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [loadErrorForUserId, setLoadErrorForUserId] = useState<string | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const activeUserId = userId === undefined ? resolvedUserId : userId;
  const structureById = useMemo(
    () => new Map(structures.map((structure) => [structure.id, structure])),
    [structures],
  );

  useEffect(() => {
    if (userId !== undefined || !supabase) return;

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setResolvedUserId(data.user?.id ?? null);
    });
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      (_event, session) => setResolvedUserId(session?.user?.id ?? null),
    );
    return () => {
      active = false;
      authSubscription.subscription.unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    let active = true;
    if (!activeUserId) return;

    void listUserNotes()
      .then((rows) => {
        if (active) {
          setNotes(rows.map((row, index) => mapNote(row, index, structureById)));
          setNotesOwnerId(activeUserId);
          setDismissedNoteIds(new Set());
          setError(null);
          setLoadErrorForUserId(null);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Unable to load notes.");
          setLoadErrorForUserId(activeUserId);
        }
      });

    return () => {
      active = false;
    };
  }, [activeUserId, structureById]);

  const addNote = async () => {
    if (!selectedStructure || !activeUserId) {
      setError("Sign in before creating notes.");
      return;
    }
    const color = NOTE_COLORS[colorIndex % NOTE_COLORS.length];
    setError(null);
    setNotes((current) => [...current, {
      id: `draft_${Date.now()}`,
      structureId: selectedStructure.id,
      structureName: selectedStructure.name,
      text: "",
      x: Math.max(12, window.innerWidth / 2 - 100),
      y: 110,
      color: color.name,
      updatedAt: "",
      completed: false,
      isDraft: true,
    }]);
    setColorIndex((value) => value + 1);
    setOpen(false);
  };

  const discardDraft = useCallback((id: string) => {
    setError(null);
    setNotes((current) => current.filter((note) => note.id !== id));
  }, []);

  const dismissNote = useCallback((id: string) => {
    setDismissedNoteIds((current) => new Set(current).add(id));
    setFocusedNoteId((current) => current === id ? null : current);
  }, []);

  const reopenNote = useCallback((id: string) => {
    setDismissedNoteIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setError(null);
  }, []);

  const updateNote = useCallback(async (id: string, text: string, x: number, y: number) => {
    setError(null);
    const note = notes.find((item) => item.id === id);
    if (!note) return;
    try {
      if (note.isDraft) {
        if (!text.trim()) {
          throw new Error("Write something in the note before saving.");
        }
        const row = await createUserNote(note.structureId, serializeStickyNoteContent(text, note.completed));
        setNotes((current) => current.map((item) => item.id === id
          ? {
            ...mapNote(row, current.indexOf(item), structureById),
            x: note.x,
            y: note.y,
            color: note.color,
            structureName: note.structureName,
          }
          : item));
      } else {
        const row = await updateUserNote(id, serializeStickyNoteContent(text, note.completed));
        setNotes((current) => current.map((item) => item.id === id
          ? { ...item, text, x, y, updatedAt: row.updated_at }
          : item));
      }
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to update note.");
      throw reason;
    }
  }, [notes, structureById]);

  const userNotes = activeUserId && notesOwnerId === activeUserId ? notes : [];
  const loading = Boolean(activeUserId && notesOwnerId !== activeUserId && loadErrorForUserId !== activeUserId);
  const visibleNotes = selectedStructure
    ? userNotes.filter((note) => noteMatchesStructure(note.structureId, selectedStructure.id, structureById))
    : userNotes;
  const floatingNotes = visibleNotes.filter((note) =>
    !dismissedNoteIds.has(note.id) && (selectedStructure || note.id === focusedNoteId),
  );

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
                {selectedStructure ? `${selectedStructure.name} NOTES` : "YOUR SAVED NOTES"}
              </span>
              <p className={`sticky-notes-status ${activeUserId ? "ready" : "needs-auth"}`}>
                {activeUserId ? "ACCOUNT SYNC ACTIVE" : "SIGN IN REQUIRED TO SAVE NOTES"}
              </p>
              {loading && <p className="sticky-notes-empty">Loading saved notes…</p>}
              {activeUserId && (
                <div className="sticky-notes-list" aria-label={selectedStructure ? `Saved notes for ${selectedStructure.name}` : "All saved notes"}>
                  {loading ? (
                    <p className="sticky-notes-empty">Loading saved notes…</p>
                  ) : visibleNotes.length > 0 ? visibleNotes.map((note) => {
                    const color = NOTE_COLORS.find((item) => item.name === note.color) ?? NOTE_COLORS[0];
                    return (
                      <button
                        type="button"
                        className="sticky-notes-list-item"
                        key={note.id}
                        onClick={() => {
                          setFocusedNoteId(note.id);
                          reopenNote(note.id);
                        }}
                        aria-label={`Show note for ${note.structureName}`}
                      >
                        <span className="sticky-notes-list-dot" style={{ backgroundColor: color.border }} />
                        <span>{note.text.trim() || "Empty note — double-click the note to edit"}</span>
                      </button>
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
              <button type="button" className="sticky-notes-add" onClick={() => void addNote()} disabled={!selectedStructure}>
                <Plus size={13} /> ADD NOTE
              </button>
              {error && <p className="sticky-notes-error" role="alert">{error}</p>}
              {visibleNotes.length > 0 && <small>{visibleNotes.length} saved note{visibleNotes.length === 1 ? "" : "s"}</small>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {floatingNotes.map((note) => <StickyNoteCard key={note.id} note={note} autoEdit={note.isDraft} onDiscard={discardDraft} onDismiss={dismissNote} onCancel={cancelEdit} onUpdate={updateNote} />)}
      </AnimatePresence>
    </>
  );
}
