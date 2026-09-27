import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Eye, EyeOff, Target, Zap, Stethoscope, Info,
  ChevronDown, ChevronUp, Layers, SlidersHorizontal,
} from 'lucide-react'
import { useState } from 'react'
import { useAnatomyStore } from '../../store/anatomyStore'
import { generateAIResponse } from '../../utils/aiEngine'

const CATEGORY_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  bone:     { label: 'Bone',     color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30'  },
  muscle:   { label: 'Muscle',   color: 'text-red-300',   bg: 'bg-red-500/15   border-red-500/30'    },
  nerve:    { label: 'Nerve',    color: 'text-yellow-300',bg: 'bg-yellow-500/15 border-yellow-500/30' },
  vessel:   { label: 'Vessel',   color: 'text-red-400',   bg: 'bg-red-600/15   border-red-600/30'    },
  ligament: { label: 'Ligament', color: 'text-blue-300',  bg: 'bg-blue-500/15  border-blue-500/30'   },
  tendon:   { label: 'Tendon',   color: 'text-blue-300',  bg: 'bg-blue-500/15  border-blue-500/30'   },
  organ:    { label: 'Organ',    color: 'text-pink-300',  bg: 'bg-pink-500/15  border-pink-500/30'   },
}

export function StructureInfoCard() {
  const {
    selectedStructure, selectStructure,
    highlightStructure, traceStructure,
    hideStructure, showStructure, isolateStructure, resetVisibility,
    hiddenStructures, clearHighlights,
    transparencyMap, setStructureTransparency, clearTransparency,
    addMessage, executeActions,
  } = useAnatomyStore()

  const [showDetails, setShowDetails]       = useState(false)
  const [showTransparency, setShowTransparency] = useState(false)

  if (!selectedStructure) return null
  const s = selectedStructure
  const badge      = CATEGORY_BADGE[s.category]
  const isHidden   = hiddenStructures.has(s.id)
  const currentTransparency = transparencyMap.get(s.id) ?? 0
  const isTransparent = currentTransparency > 0

  const handleAskAI = (question: string) => {
    addMessage({ role: 'user', content: question })
    const lastCtxId = useAnatomyStore.getState().conversationContext.lastStructureId
    const response = generateAIResponse(question, s, { lastStructureId: lastCtxId })
    addMessage({ role: 'ai', content: response.explanation, actions: response.actions, structureId: s.id })
    if (response.actions.length > 0) executeActions(response.actions)
    // Handle transparency from AI
    const r = response as any
    if (r._transparencyTarget) setStructureTransparency(r._transparencyTarget, r._transparencyValue ?? 0.6)
    if (r._clearTransparencyTarget) clearTransparency(r._clearTransparencyTarget)
    // Update conversation context
    useAnatomyStore.getState().setConversationContext({ lastStructureId: s.id })
  }

  return (
    <AnimatePresence>
      <motion.div
        key={s.id}
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-4 left-4 z-20 w-[320px]"
      >
        <div className="glass-dark rounded-2xl shadow-2xl overflow-hidden border border-white/8">
          {/* Category colour bar */}
          <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${s.color}, transparent)` }} />

          <div className="px-4 py-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white">{s.name}</h3>
                  {badge && (
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${badge.bg} ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                  {isTransparent && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                      {Math.round(currentTransparency * 100)}% transparent
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 italic">{s.latinName}</p>
              </div>
              <button
                onClick={() => selectStructure(null)}
                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <X size={12} className="text-gray-400" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-300 leading-relaxed mb-3">{s.description}</p>

            {/* Expandable anatomy details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-2"
            >
              {showDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {showDetails ? 'Less detail' : 'Anatomy detail'}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 mb-3"
                >
                  {s.origin && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-gray-800/60 border border-white/6">
                      <span className="text-xs text-gray-500">Origin: </span>
                      <span className="text-xs text-gray-300">{s.origin}</span>
                    </div>
                  )}
                  {s.insertion && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-gray-800/60 border border-white/6">
                      <span className="text-xs text-gray-500">Insertion: </span>
                      <span className="text-xs text-gray-300">{s.insertion}</span>
                    </div>
                  )}
                  {s.innervation && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-gray-800/60 border border-white/6">
                      <span className="text-xs text-yellow-500">Innervation: </span>
                      <span className="text-xs text-gray-300">{s.innervation}</span>
                    </div>
                  )}
                  {s.bloodSupply && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-gray-800/60 border border-white/6">
                      <span className="text-xs text-red-400">Blood supply: </span>
                      <span className="text-xs text-gray-300">{s.bloodSupply}</span>
                    </div>
                  )}
                  <div className="px-2.5 py-1.5 rounded-lg bg-orange-500/8 border border-orange-500/20">
                    <div className="flex items-start gap-1.5">
                      <Info size={11} className="text-orange-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-orange-200">{s.clinicalNote}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transparency slider */}
            <button
              onClick={() => setShowTransparency(!showTransparency)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-2"
            >
              <SlidersHorizontal size={11} />
              {showTransparency ? 'Hide transparency' : 'Transparency'}
            </button>

            <AnimatePresence>
              {showTransparency && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 px-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-8">Opaque</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(currentTransparency * 100)}
                      onChange={e => {
                        const v = parseInt(e.target.value) / 100
                        if (v === 0) clearTransparency(s.id)
                        else setStructureTransparency(s.id, v)
                      }}
                      className="flex-1 h-1.5 accent-cyan-500 cursor-pointer"
                    />
                    <span className="text-xs text-gray-600 w-10 text-right">Clear</span>
                  </div>
                  <p className="text-xs text-gray-600 text-center mt-1">
                    {Math.round(currentTransparency * 100)}% transparent
                  </p>
                  {isTransparent && (
                    <button
                      onClick={() => clearTransparency(s.id)}
                      className="mt-1.5 w-full text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Restore full opacity
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons â€” 2Ã—3 grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* Trace */}
              <button
                onClick={() => { clearHighlights(); highlightStructure(s.id); traceStructure(s.id) }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all duration-150 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20"
              >
                <Zap size={12} className="text-yellow-400" />
                <span className="text-gray-200">Trace</span>
              </button>

              {/* Hide / Show */}
              <button
                onClick={() => isHidden ? showStructure(s.id) : hideStructure(s.id)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all duration-150 bg-gray-800/60 border-white/8 hover:border-white/15"
              >
                {isHidden
                  ? <Eye    size={12} className="text-green-400" />
                  : <EyeOff size={12} className="text-gray-400" />
                }
                <span className="text-gray-200">{isHidden ? 'Show' : 'Hide'}</span>
              </button>

              {/* Isolate */}
              <button
                onClick={() => isolateStructure(s.id)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all duration-150 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20"
              >
                <Layers size={12} className="text-violet-400" />
                <span className="text-gray-200">Isolate</span>
              </button>

              {/* Restore (shown after hide/isolate) */}
              <button
                onClick={() => resetVisibility()}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all duration-150 bg-orange-500/8 border-orange-500/20 hover:bg-orange-500/15"
              >
                <Eye size={12} className="text-orange-400" />
                <span className="text-gray-200">Restore All</span>
              </button>

              {/* Relations */}
              <button
                onClick={() => handleAskAI(`What runs next to the ${s.name}?`)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all duration-150 bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20"
              >
                <Target size={12} className="text-cyan-400" />
                <span className="text-gray-200">Relations</span>
              </button>

              {/* Clinical */}
              <button
                onClick={() => handleAskAI(`Clinical significance of ${s.name}`)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all duration-150 bg-green-500/10 border-green-500/20 hover:bg-green-500/20"
              >
                <Stethoscope size={12} className="text-green-400" />
                <span className="text-gray-200">Clinical</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}


