import { create } from 'zustand'
import type {
  AnatomicalStructure, AIAction, ProgressEntry,
  QuizQuestion, ClinicalScenario, TeachLesson,
} from '../types/anatomy'
import { ANATOMY_STRUCTURES, STRUCTURE_MAP, findStructureByQuery } from '../data/anatomyData'

export type AppMode = 'explore' | 'quiz' | 'teach' | 'clinical' | 'dissection'
export type VisibilityLayer = 'skin' | 'muscle' | 'bone' | 'nerve' | 'vessel' | 'ligament' | 'organ' | 'tendon'

// All toggleable layers â€” never changes at runtime
export const ALL_LAYERS: VisibilityLayer[] = ['skin', 'muscle', 'bone', 'nerve', 'vessel', 'ligament', 'organ']

// â”€â”€â”€ Visibility is computed from FOUR independent sources â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// A hotspot is visible if:
//   1. Its layer is ON  (visibleLayers)
//   2. It is not manually hidden  (manuallyHidden)
//   3. If isolation is active, it IS the isolated structure  (isolatedId)
//   4. Dissection state hasn't hidden it  (dissectionHidden)
//
// These are computed in the Hotspot component â€” the store just tracks the state.
// THIS is the fix for "blank screen" â€” isolate can never hide a layer-level structure
// because the layer toggle only reads visibleLayers, NOT isolatedId.

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: number
  actions?: AIAction[]
  structureId?: string
}

interface AnatomyState {
  // â”€â”€ Mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  appMode: AppMode
  setAppMode: (mode: AppMode) => void

  // â”€â”€ Selection & highlights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  selectedStructure: AnatomicalStructure | null
  highlightedStructures: Set<string>
  tracedStructures: Set<string>
  selectStructure: (s: AnatomicalStructure | null) => void
  highlightStructure: (id: string, exclusive?: boolean) => void
  addHighlight: (id: string) => void
  clearHighlights: () => void
  traceStructure: (id: string) => void
  clearTraces: () => void

  // â”€â”€ Visibility â€” SEPARATED BY DOMAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /** Layer toggles from the left panel */
  visibleLayers: Set<VisibilityLayer>
  /** Manually hidden individual structures (Hide button / AI hide) */
  manuallyHidden: Set<string>
  /** When non-null: all structures EXCEPT this id are dimmed (not fully hidden) */
  isolatedId: string | null
  /** Structures hidden by the dissection controller */
  dissectionHidden: Set<string>
  /** Per-structure transparency override: 0 = opaque, 1 = fully transparent */
  transparencyMap: Map<string, number>

  toggleLayer: (layer: VisibilityLayer) => void
  setLayerVisible: (layer: VisibilityLayer, visible: boolean) => void
  restoreAllLayers: () => void
  hideStructure: (id: string) => void
  showStructure: (id: string) => void
  /** Isolate: dim (not hide) everything except this structure */
  isolateStructure: (id: string) => void
  clearIsolation: () => void
  setDissectionHidden: (ids: Set<string>) => void
  clearDissectionHidden: () => void
  setStructureTransparency: (id: string, value: number) => void
  clearTransparency: (id?: string) => void

  /** Helper: compute final visibility for a given structure id */
  isStructureVisible: (id: string, category: string) => boolean
  /** Returns true if the scene has at least 1 visible hotspot â€” safety check */
  hasVisibleStructures: () => boolean

  // â”€â”€ Camera â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  cameraView: string
  /** Fires a camera animation to a named region OR a structure id */
  setCameraView: (view: string) => void
  cameraTarget: [number, number, number]
  setCameraTarget: (t: [number, number, number]) => void
  /**
   * Primary navigation command â€” resolves structure, updates selectedStructure,
   * highlights it, and triggers the camera.
   * Returns true if the structure was found.
   */
  focusStructure: (idOrName: string) => boolean

  // â”€â”€ Other display â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  showLabels: boolean
  setShowLabels: (show: boolean) => void

  // â”€â”€ Combined reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /** Clear only temporary overlays (highlights, isolation, transparency) */
  resetVisibility: () => void
  /** Full reset â€” everything except chat, notes, progress */
  fullReset: () => void

  // â”€â”€ AI / Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  chatMessages: ChatMessage[]
  isAIThinking: boolean
  conversationContext: { lastStructureId: string | null }
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setAIThinking: (thinking: boolean) => void
  setConversationContext: (ctx: Partial<AnatomyState['conversationContext']>) => void
  executeActions: (actions: AIAction[]) => void

  // â”€â”€ Quiz â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  quizQuestion: QuizQuestion | null
  quizScore: { correct: number; total: number }
  startQuiz: () => void
  endQuiz: () => void
  checkQuizAnswer: (structureId: string) => 'correct' | 'hint' | 'wrong'

  // â”€â”€ Teach â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  currentLesson: TeachLesson | null
  lessonStep: number
  setLesson: (lesson: TeachLesson | null) => void
  nextLessonStep: () => void

  // â”€â”€ Clinical â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  currentScenario: ClinicalScenario | null
  setScenario: (scenario: ClinicalScenario | null) => void
  checkScenarioAnswer: (structureId: string) => boolean

  // â”€â”€ Progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  progress: Map<string, ProgressEntry>
  recordAttempt: (structureId: string, correct: boolean) => void
  getWeakStructures: () => AnatomicalStructure[]

  // â”€â”€ Voice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  isListening: boolean
  setListening: (listening: boolean) => void
  pendingVoiceCommand: string | null
  setPendingVoiceCommand: (cmd: string | null) => void
  consumePendingVoiceCommand: () => string | null

  // â”€â”€ Legacy shim (keeps old callers working) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  hiddenStructures: Set<string>  // alias â†’ manuallyHidden
  isolatedStructures: Set<string> // kept for compat, always derived
}

export const useAnatomyStore = create<AnatomyState>((set, get) => ({
  // â”€â”€ Mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  appMode: 'explore',
  setAppMode: (mode) => {
    set({ appMode: mode })
    if (mode !== 'quiz') set({ quizQuestion: null })
    if (mode !== 'teach') set({ currentLesson: null, lessonStep: 0 })
    if (mode !== 'clinical') set({ currentScenario: null })
  },

  // â”€â”€ Selection & highlights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  selectedStructure: null,
  highlightedStructures: new Set(),
  tracedStructures: new Set(),

  selectStructure: (structure) => {
    set({ selectedStructure: structure })
    if (structure) {
      set(s => ({ conversationContext: { ...s.conversationContext, lastStructureId: structure.id } }))
    }
  },

  highlightStructure: (id, exclusive = false) => set(state => {
    const next = exclusive ? new Set([id]) : new Set(state.highlightedStructures)
    next.add(id)
    return { highlightedStructures: next }
  }),

  addHighlight: (id) => set(state => {
    const next = new Set(state.highlightedStructures)
    next.add(id)
    return { highlightedStructures: next }
  }),

  clearHighlights: () => set({ highlightedStructures: new Set(), tracedStructures: new Set() }),

  traceStructure: (id) => set(state => {
    const next = new Set(state.tracedStructures)
    next.add(id)
    return { tracedStructures: next }
  }),

  clearTraces: () => set({ tracedStructures: new Set() }),

  // â”€â”€ Visibility â€” separated domains â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  visibleLayers: new Set<VisibilityLayer>(ALL_LAYERS),
  manuallyHidden: new Set(),
  isolatedId: null,
  dissectionHidden: new Set(),
  transparencyMap: new Map(),

  // Legacy shims â€” kept as plain properties, synced on every hide/show/isolate action
  hiddenStructures: new Set<string>(),
  isolatedStructures: new Set<string>(),

  toggleLayer: (layer) => set(state => {
    const next = new Set(state.visibleLayers)
    if (next.has(layer)) next.delete(layer)
    else next.add(layer)
    // Safety: never allow ALL layers to be off simultaneously
    if (next.size === 0) {
      console.warn('[AnatomyStore] toggleLayer would make all layers invisible â€” aborting')
      return {}
    }
    return { visibleLayers: next }
  }),

  setLayerVisible: (layer, visible) => set(state => {
    const next = new Set(state.visibleLayers)
    if (visible) next.add(layer)
    else {
      next.delete(layer)
      if (next.size === 0) {
        console.warn('[AnatomyStore] setLayerVisible would make all layers invisible â€” aborting')
        return {}
      }
    }
    return { visibleLayers: next }
  }),

  restoreAllLayers: () => set({ visibleLayers: new Set<VisibilityLayer>(ALL_LAYERS) }),

  hideStructure: (id) => set(state => {
    const next = new Set(state.manuallyHidden)
    next.add(id)
    return { manuallyHidden: next, hiddenStructures: next }
  }),

  showStructure: (id) => set(state => {
    const next = new Set(state.manuallyHidden)
    next.delete(id)
    return { manuallyHidden: next, hiddenStructures: next }
  }),

  isolateStructure: (id) => {
    set({ isolatedId: id, isolatedStructures: new Set([id]) })
    console.info(`[AnatomyStore] isolateStructure: ${id}`)
  },

  clearIsolation: () => set({ isolatedId: null, isolatedStructures: new Set() }),

  setDissectionHidden: (ids) => set({ dissectionHidden: ids }),
  clearDissectionHidden: () => set({ dissectionHidden: new Set() }),

  setStructureTransparency: (id, value) => set(state => {
    const next = new Map(state.transparencyMap)
    if (value <= 0) next.delete(id)
    else next.set(id, Math.min(1, Math.max(0, value)))
    return { transparencyMap: next }
  }),

  clearTransparency: (id) => set(state => {
    if (id) {
      const next = new Map(state.transparencyMap)
      next.delete(id)
      return { transparencyMap: next }
    }
    return { transparencyMap: new Map() }
  }),

  // â”€â”€ Computed visibility (used by Hotspot) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  isStructureVisible: (id: string, category: string) => {
    const s = get()
    if (!s.visibleLayers.has(category as VisibilityLayer)) return false
    if (s.manuallyHidden.has(id)) return false
    if (s.dissectionHidden.has(id)) return false
    // Transparency >= 1 = fully transparent â†’ invisible
    if ((s.transparencyMap.get(id) ?? 0) >= 1) return false
    return true
  },

  hasVisibleStructures: () => {
    const s = get()
    return ANATOMY_STRUCTURES.some(structure =>
      s.isStructureVisible(structure.id, structure.category)
    )
  },

  // â”€â”€ Camera â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  cameraView: 'anterior',
  cameraTarget: [0, 0, 0],
  setCameraTarget: (t) => set({ cameraTarget: t }),

  setCameraView: (view) => {
    console.info(`[AnatomyStore] setCameraView: ${view}`)
    set({ cameraView: view })
  },

  // PRIMARY navigation â€” resolves structure, selects it, highlights it, triggers camera
  focusStructure: (idOrName: string) => {
    const structure = STRUCTURE_MAP.get(idOrName) ?? findStructureByQuery(idOrName)

    if (!structure) {
      console.warn(`[AnatomyStore] focusStructure: "${idOrName}" not found`)
      return false
    }

    console.info(`[AnatomyStore] focusStructure: resolved "${idOrName}" â†’ "${structure.id}" (${structure.region})`)

    // Update selection + context + highlights â€” these changes trigger CameraController
    set({
      selectedStructure: structure,
      conversationContext: { lastStructureId: structure.id },
      highlightedStructures: new Set([structure.id]),
      // Reset cameraView to a sentinel that forces a fresh camera move
      // even if the same structure is clicked twice
      cameraView: `focus:${structure.id}:${Date.now()}`,
    })

    return true
  },

  // â”€â”€ Display â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  showLabels: false,
  setShowLabels: (show) => set({ showLabels: show }),

  // â”€â”€ Resets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  resetVisibility: () => set({
    manuallyHidden: new Set(),
    hiddenStructures: new Set(),
    isolatedId: null,
    isolatedStructures: new Set(),
    dissectionHidden: new Set(),
    highlightedStructures: new Set(),
    tracedStructures: new Set(),
    transparencyMap: new Map(),
  }),

  fullReset: () => {
    console.info('[AnatomyStore] fullReset')
    set({
      manuallyHidden: new Set(),
      hiddenStructures: new Set(),
      isolatedId: null,
      isolatedStructures: new Set(),
      dissectionHidden: new Set(),
      highlightedStructures: new Set(),
      tracedStructures: new Set(),
      transparencyMap: new Map(),
      visibleLayers: new Set<VisibilityLayer>(ALL_LAYERS),
      selectedStructure: null,
      cameraView: `anterior`,     // triggers region jump effect
      cameraTarget: [0, 0, 0],
      appMode: 'explore',
      quizQuestion: null,
      currentLesson: null,
      lessonStep: 0,
      currentScenario: null,
    })
  },

  // â”€â”€ AI / Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  chatMessages: [],
  isAIThinking: false,
  conversationContext: { lastStructureId: null },

  addMessage: (msg) => set(state => ({
    chatMessages: [...state.chatMessages, {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    }]
  })),

  setAIThinking: (thinking) => set({ isAIThinking: thinking }),

  setConversationContext: (ctx) => set(state => ({
    conversationContext: { ...state.conversationContext, ...ctx }
  })),

  executeActions: (actions: AIAction[]) => {
    // Synchronous execution via dynamic import (avoids circular dep at load time)
    import('../utils/anatomy3DController').then(({ executeAIActions }) => {
      executeAIActions(actions)
    })
  },

  // â”€â”€ Quiz â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  quizQuestion: null,
  quizScore: { correct: 0, total: 0 },

  startQuiz: () => {
    const target = ANATOMY_STRUCTURES[Math.floor(Math.random() * ANATOMY_STRUCTURES.length)]
    set(state => ({
      quizQuestion: {
        structureId: target.id,
        hints: [
          `It is a ${target.category}`,
          `Located in the ${target.region}`,
          target.function.slice(0, 80) + '...',
          `Latin name: ${target.latinName}`,
        ],
        attempts: 0,
        maxAttempts: 3,
      },
      quizScore: { ...state.quizScore, total: state.quizScore.total + 1 },
      showLabels: false,
      highlightedStructures: new Set(),
    }))
  },

  endQuiz: () => set({
    quizQuestion: null,
    showLabels: true,
    appMode: 'explore',
    highlightedStructures: new Set(),
  }),

  checkQuizAnswer: (structureId) => {
    const state = get()
    const q = state.quizQuestion
    if (!q) return 'wrong'
    if (structureId === q.structureId) {
      set(prev => ({ quizScore: { ...prev.quizScore, correct: prev.quizScore.correct + 1 } }))
      state.recordAttempt(q.structureId, true)
      return 'correct'
    }
    const newAttempts = q.attempts + 1
    set({ quizQuestion: { ...q, attempts: newAttempts } })
    state.recordAttempt(q.structureId, false)
    return newAttempts >= q.maxAttempts ? 'wrong' : 'hint'
  },

  // â”€â”€ Teach â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  currentLesson: null,
  lessonStep: 0,

  setLesson: (lesson) => set({ currentLesson: lesson, lessonStep: 0 }),

  nextLessonStep: () => {
    const state = get()
    if (!state.currentLesson) return
    const nextStep = state.lessonStep + 1
    if (nextStep >= state.currentLesson.steps.length) {
      set({ currentLesson: null, lessonStep: 0, appMode: 'explore' })
    } else {
      const step = state.currentLesson.steps[nextStep]
      state.clearHighlights()
      state.executeActions(step.actions)
      set({ lessonStep: nextStep })
    }
  },

  // â”€â”€ Clinical â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  currentScenario: null,

  setScenario: (scenario) => {
    set({ currentScenario: scenario })
    if (scenario) get().resetVisibility()
  },

  checkScenarioAnswer: (structureId) => {
    const scenario = get().currentScenario
    return scenario?.targetStructureId === structureId
  },

  // â”€â”€ Progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  progress: new Map(),

  recordAttempt: (structureId, correct) => set(state => {
    const map = new Map(state.progress)
    const existing = map.get(structureId) || {
      structureId, attempts: 0, correct: 0, lastSeen: 0, mastered: false,
    }
    const updatedCorrect = existing.correct + (correct ? 1 : 0)
    map.set(structureId, {
      ...existing,
      attempts: existing.attempts + 1,
      correct: updatedCorrect,
      lastSeen: Date.now(),
      mastered: updatedCorrect >= 3,
    })
    return { progress: map }
  }),

  getWeakStructures: () => {
    const { progress } = get()
    return ANATOMY_STRUCTURES.filter(s => {
      const p = progress.get(s.id)
      return p && p.attempts > 0 && (p.correct / p.attempts) < 0.6
    })
  },

  // â”€â”€ Voice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  isListening: false,
  setListening: (listening) => set({ isListening: listening }),
  pendingVoiceCommand: null,
  setPendingVoiceCommand: (cmd) => set({ pendingVoiceCommand: cmd }),
  consumePendingVoiceCommand: () => {
    const cmd = get().pendingVoiceCommand
    set({ pendingVoiceCommand: null })
    return cmd
  },
}))


