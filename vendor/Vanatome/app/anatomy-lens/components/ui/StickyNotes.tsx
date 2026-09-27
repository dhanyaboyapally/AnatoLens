"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bold, Check, CheckCircle2, GripVertical, Highlighter, Italic, Pencil, Plus, StickyNote, Strikethrough, Underline, X } from "lucide-react";
import {
  createUserNote,
  listUserNotes,
  updateUserNote,
  type NoteRow,
} from "../../../lib/notes";
import { supabase } from "../../../lib/supabase";
import { editableHtmlToMarkup, markupToEditableHtml, parseStickyNoteContent, serializeStickyNoteContent } from "../../../lib/sticky-note-content";

type NoteOwner = { id: string; name: string };

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

export function FormattedNoteText({ text }: { text: string }) {
  return <span dangerouslySetInnerHTML={{ __html: markupToEditableHtml(text) }} />;
}

function RichNoteEditor({
  initialText,
  color,
  onChange,
  onSave,
}: {
  initialText: string;
  color: string;
  onChange: (text: string) => void;
  onSave: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [initialHtml] = useState(() => markupToEditableHtml(initialText));

  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  const runFormat = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) onChange(editableHtmlToMarkup(editorRef.current.innerHTML));
  };

  return (
    <>
      <div className="sticky-note-format-toolbar" role="toolbar" aria-label="Note formatting">
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runFormat("bold")} aria-label="Bold" title="Bold"><Bold size={13} /></button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runFormat("italic")} aria-label="Italic" title="Italic"><Italic size={13} /></button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runFormat("underline")} aria-label="Underline" title="Underline"><Underline size={13} /></button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runFormat("hiliteColor", "#fde047")} aria-label="Highlight" title="Highlight"><Highlighter size={13} /></button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runFormat("strikeThrough")} aria-label="Strikethrough" title="Strikethrough"><Strikethrough size={13} /></button>
      </div>
      <div
        ref={editorRef}
        className="sticky-note-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Sticky note text"
        aria-multiline="true"
        data-placeholder="Write a note…"
        dangerouslySetInnerHTML={{ __html: initialHtml }}
        onInput={(event) => onChange(editableHtmlToMarkup(event.currentTarget.innerHTML))}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.metaKey) {
            event.preventDefault();
            onSave();
          }
        }}
        style={{ color, caretColor: color }}
      />
    </>
  );
}

const NOTE_COLORS = [
  { bg: "#fef08a", border: "#ca8a04", text: "#713f12", name: "yellow" },
  { bg: "#bfdbfe", border: "#3b82f6", text: "#1e3a5f", name: "blue" },
  { bg: "#bbf7d0", border: "#22c55e", text: "#14532d", name: "green" },
  { bg: "#fecaca", border: "#ef4444", text: "#7f1d1d", name: "red" },
  { bg: "#e9d5ff", border: "#a855f7", text: "#4a1d96", name: "purple" },
];

function mapNote(row: NoteRow, index: number): Note {
  const content = parseStickyNoteContent(row.note);
  return {
    id: row.id,
    structureId: row.organ,
    structureName: row.organ,
    text: content.content,
    x: Math.max(12, window.innerWidth / 2 - 100),
    y: 110 + (index % 4) * 18,
    color: NOTE_COLORS[index % NOTE_COLORS.length].name,
    updatedAt: row.updated_at,
    completed: content.completed,
  };
}

function StickyNoteCard({
  note,
  onDiscard,
  onDismiss,
  onUpdate,
  autoEdit = false,
}: {
  note: Note;
  onDiscard: (id: string) => void;
  onDismiss: (id: string) => void;
  onUpdate: (id: string, text: string, x: number, y: number, completed: boolean) => void | Promise<void>;
  autoEdit?: boolean;
}) {
  const color = NOTE_COLORS.find((item) => item.name === note.color) ?? NOTE_COLORS[0];
  const [editing, setEditing] = useState(autoEdit);
  // The live editor content is tracked in a ref (not state) so that typing never
  // triggers a re-render of this component. Re-rendering while `dangerouslySetInnerHTML`
  // drives the contenteditable node would otherwise reset its DOM content mid-keystroke.
  const draftRef = useRef(note.text);
  // Only used to seed `RichNoteEditor`'s initial content when (re)entering edit mode;
  // read at render time, so it must be state rather than a ref.
  const [editSeed, setEditSeed] = useState(note.text);
  const [position, setPosition] = useState({ x: note.x, y: note.y });
  const [completed, setCompleted] = useState(note.completed);
  const saving = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const startDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (note.isDraft || (event.target as HTMLElement).closest("button, textarea, [contenteditable], .sticky-note-body")) return;
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
    void persist(draftRef.current, completed);
  };

  const persist = async (text: string, nextCompleted: boolean) => {
    if (saving.current) return false;
    saving.current = true;
    setSaveError(null);
    try {
      await onUpdate(note.id, text, position.x, position.y, nextCompleted);
      setCompleted(nextCompleted);
      return true;
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Unable to save note.");
      return false;
    } finally {
      saving.current = false;
    }
  };

  const saveEdit = async () => {
    if (await persist(draftRef.current, true)) setEditing(false);
  };

  const toggleCompleted = async () => {
    await persist(note.text, !completed);
  };

  const closeNote = () => {
    if (note.isDraft) onDiscard(note.id);
    else onDismiss(note.id);
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
        {!editing && (
          <button
            type="button"
            onClick={() => void toggleCompleted()}
            aria-label={completed ? "Mark note incomplete" : "Mark note complete"}
            title={completed ? "Mark incomplete" : "Mark complete"}
          >
            <CheckCircle2 size={13} style={{ color: color.text, fill: completed ? `${color.border}40` : "none" }} />
          </button>
        )}
        <button
            type="button"
            onClick={() => {
              if (editing) {
                void saveEdit();
              } else {
                draftRef.current = note.text;
                setEditSeed(note.text);
                setEditing(true);
              }
            }}
            aria-label={editing ? "Save note" : "Edit note"}
          >
          {editing ? <Check size={12} style={{ color: color.text }} /> : <Pencil size={12} style={{ color: color.text }} />}
        </button>
        <button
          type="button"
          onClick={closeNote}
          aria-label="Close note"
        >
          <X size={12} style={{ color: color.text }} />
        </button>
      </div>
      {saveError && <p className="sticky-notes-error" role="alert">{saveError}</p>}
      <div className="sticky-note-body">
        {editing ? (
          <RichNoteEditor
            initialText={editSeed}
            color={color.text}
            onChange={(text) => { draftRef.current = text; }}
            onSave={() => void saveEdit()}
          />
        ) : (
          <p className={completed ? "completed" : ""} style={{ color: color.text }} onDoubleClick={() => { draftRef.current = note.text; setEditSeed(note.text); setEditing(true); }}>
            {note.text ? <FormattedNoteText text={note.text} /> : <span className="sticky-note-placeholder">Double-click to edit…</span>}
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
  const [dismissedNoteIds, setDismissedNoteIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [open, setOpen] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState(userId);
  const [portalRoot] = useState<HTMLElement | null>(
    () => typeof document === "undefined" ? null : document.body,
  );
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
      setDismissedNoteIds(new Set());
      setError(null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    void listUserNotes()
      .then((rows) => {
        if (active) {
          setNotes(rows.map(mapNote));
          setDismissedNoteIds(new Set());
        }
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
  }, []);

  const reopenNote = useCallback((id: string) => {
    setDismissedNoteIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const updateNote = useCallback(async (id: string, text: string, x: number, y: number, completed: boolean) => {
    setError(null);
    const note = notes.find((item) => item.id === id);
    if (!note) return;
    try {
      if (note.isDraft) {
        if (!text.trim()) {
          throw new Error("Write something in the note before saving.");
        }
        const row = await createUserNote(note.structureId, serializeStickyNoteContent(text, completed));
        setNotes((current) => current.map((item) => item.id === id
          ? {
            ...mapNote(row, current.indexOf(item)),
            x: note.x,
            y: note.y,
            color: note.color,
            structureName: note.structureName,
            completed,
          }
          : item));
      } else {
        const row = await updateUserNote(id, serializeStickyNoteContent(text, completed));
        const savedContent = parseStickyNoteContent(row.note);
        setNotes((current) => current.map((item) => item.id === id
          ? {
            ...item,
            text: savedContent.content,
            completed: savedContent.completed,
            x,
            y,
            updatedAt: row.updated_at,
          }
          : item));
      }
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to update note.");
      throw reason;
    }
  }, [notes]);

  const visibleNotes = selectedStructure
    ? notes.filter((note) => note.structureId === selectedStructure.id)
    : [];
  const floatingNotes = visibleNotes.filter((note) => !dismissedNoteIds.has(note.id));

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
              <p className={`sticky-notes-status ${activeUserId ? "ready" : "needs-auth"}`}>
                {activeUserId ? "ACCOUNT SYNC ACTIVE" : "SIGN IN REQUIRED TO SAVE NOTES"}
              </p>
              {loading && <p className="sticky-notes-empty">Loading saved notes…</p>}
              {selectedStructure && (
                <div className="sticky-notes-list" aria-label={`Saved notes for ${selectedStructure.name}`}>
                  {visibleNotes.length > 0 ? visibleNotes.map((note) => {
                    const color = NOTE_COLORS.find((item) => item.name === note.color) ?? NOTE_COLORS[0];
                    return (
                      <button
                        type="button"
                        className="sticky-notes-list-item"
                        key={note.id}
                        onClick={() => reopenNote(note.id)}
                        aria-label={`Show note for ${note.structureName}`}
                      >
                        <span className="sticky-notes-list-dot" style={{ backgroundColor: color.border }} />
                        <span><FormattedNoteText text={note.text.trim() || "Empty note — double-click the note to edit"} /></span>
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
              {visibleNotes.length > 0 && <small>{visibleNotes.length} note{visibleNotes.length === 1 ? "" : "s"} for this structure</small>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {portalRoot && createPortal(
        <AnimatePresence>
          {floatingNotes.map((note) => <StickyNoteCard key={note.id} note={note} autoEdit={note.isDraft} onDiscard={discardDraft} onDismiss={dismissNote} onUpdate={updateNote} />)}
        </AnimatePresence>,
        portalRoot,
      )}
    </>
  );
}
