import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickyNote, X, Plus, GripVertical, Pencil, Check } from 'lucide-react'

interface Note {
  id: string
  text: string
  x: number   // px from left of viewport
  y: number   // px from top of viewport
  color: string
  createdAt: number
}

const NOTE_COLORS = [
  { bg: '#fef08a', border: '#ca8a04', text: '#713f12', name: 'yellow' },
  { bg: '#bfdbfe', border: '#3b82f6', text: '#1e3a5f', name: 'blue'   },
  { bg: '#bbf7d0', border: '#22c55e', text: '#14532d', name: 'green'  },
  { bg: '#fecaca', border: '#ef4444', text: '#7f1d1d', name: 'red'    },
  { bg: '#e9d5ff', border: '#a855f7', text: '#4a1d96', name: 'purple' },
]

const STORAGE_KEY = 'anatomyai_sticky_notes'

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

function StickyNoteCard({
  note,
  onDelete,
  onUpdate,
}: {
  note: Note
  onDelete: (id: string) => void
  onUpdate: (id: string, text: string, x: number, y: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(note.text)
  const [pos, setPos]         = useState({ x: note.x, y: note.y })
  const dragging = useRef(false)
  const offset   = useRef({ ox: 0, oy: 0 })
  const textRef  = useRef<HTMLTextAreaElement>(null)
  const col = NOTE_COLORS.find(c => c.name === note.color) ?? NOTE_COLORS[0]

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('textarea, button')) return
    dragging.current = true
    offset.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y }
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const nx = e.clientX - offset.current.ox
      const ny = e.clientY - offset.current.oy
      setPos({ x: nx, y: ny })
    }
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false
        setPos(p => { onUpdate(note.id, draft, p.x, p.y); return p })
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [note.id, draft, onUpdate])

  const saveEdit = () => {
    setEditing(false)
    onUpdate(note.id, draft, pos.x, pos.y)
  }

  useEffect(() => { if (editing) textRef.current?.focus() }, [editing])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 50,
        width: 200,
        userSelect: 'none',
      }}
    >
      <div
        className="rounded-xl shadow-2xl overflow-hidden"
        style={{ border: `1.5px solid ${col.border}40`, backgroundColor: col.bg }}
        onMouseDown={onMouseDown}
      >
        {/* Drag handle + controls */}
        <div
          className="flex items-center gap-1 px-2 py-1.5 cursor-grab active:cursor-grabbing"
          style={{ backgroundColor: `${col.border}22`, borderBottom: `1px solid ${col.border}30` }}
        >
          <GripVertical size={12} style={{ color: col.text, opacity: 0.4 }} />
          <div className="flex-1" />
          <button
            onClick={() => { setEditing(!editing); setDraft(note.text) }}
            className="w-5 h-5 rounded flex items-center justify-center transition-opacity hover:opacity-80"
            title="Edit"
          >
            {editing
              ? <Check size={11} style={{ color: col.text }} />
              : <Pencil size={11} style={{ color: col.text, opacity: 0.5 }} />
            }
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="w-5 h-5 rounded flex items-center justify-center transition-opacity hover:opacity-80"
            title="Delete note"
          >
            <X size={11} style={{ color: col.text, opacity: 0.5 }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-2.5">
          {editing ? (
            <textarea
              ref={textRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) saveEdit() }}
              rows={4}
              placeholder="Type your noteâ€¦"
              className="w-full resize-none text-xs outline-none rounded bg-transparent"
              style={{ color: col.text, caretColor: col.border }}
            />
          ) : (
            <p
              className="text-xs leading-relaxed whitespace-pre-wrap break-words min-h-[52px] cursor-text"
              style={{ color: col.text }}
              onDoubleClick={() => setEditing(true)}
            >
              {note.text || <span style={{ opacity: 0.4 }}>Double-click to editâ€¦</span>}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// â”€â”€â”€ Sticky Notes Manager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function StickyNotesLayer() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [open, setOpen]   = useState(false)
  const [colorIdx, setColorIdx] = useState(0)

  const persist = (updated: Note[]) => { setNotes(updated); saveNotes(updated) }

  const addNote = () => {
    const col = NOTE_COLORS[colorIdx % NOTE_COLORS.length]
    const note: Note = {
      id: `note_${Date.now()}`,
      text: '',
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 - 80,
      color: col.name,
      createdAt: Date.now(),
    }
    persist([...notes, note])
    setColorIdx(i => i + 1)
    setOpen(false)
  }

  const deleteNote = useCallback((id: string) => {
    persist(notes.filter(n => n.id !== id))
  }, [notes])

  const updateNote = useCallback((id: string, text: string, x: number, y: number) => {
    persist(notes.map(n => n.id === id ? { ...n, text, x, y } : n))
  }, [notes])

  return (
    <>
      {/* Floating add button */}
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className={`
            w-8 h-8 rounded-xl glass border flex items-center justify-center transition-all duration-150
            ${open
              ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
              : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }
          `}
          title="Sticky Notes"
        >
          <StickyNote size={15} />
        </button>

        {/* Colour picker + add */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 p-3 shadow-2xl z-50"
              style={{ background: 'rgba(10,14,26,0.95)', backdropFilter: 'blur(12px)' }}
            >
              <p className="text-xs text-gray-500 mb-2 font-medium">Pick colour</p>
              <div className="flex gap-2 mb-3">
                {NOTE_COLORS.map((c, i) => (
                  <button
                    key={c.name}
                    onClick={() => setColorIdx(i)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c.bg,
                      borderColor: colorIdx % NOTE_COLORS.length === i ? c.border : 'transparent',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={addNote}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg
                  bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-xs font-semibold
                  hover:bg-yellow-400/25 transition-all active:scale-95"
              >
                <Plus size={12} />
                Add Note
              </button>
              {notes.length > 0 && (
                <p className="text-xs text-gray-600 text-center mt-2">
                  {notes.length} note{notes.length !== 1 ? 's' : ''} â€¢ drag to move
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Render all notes as fixed-position overlays */}
      <AnimatePresence>
        {notes.map(note => (
          <StickyNoteCard
            key={note.id}
            note={note}
            onDelete={deleteNote}
            onUpdate={updateNote}
          />
        ))}
      </AnimatePresence>
    </>
  )
}


