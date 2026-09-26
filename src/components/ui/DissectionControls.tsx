import { motion } from 'framer-motion'
import { Scissors, Eye, EyeOff, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAnatomyStore, type VisibilityLayer, ALL_LAYERS } from '../../store/anatomyStore'
import { focusStructure } from '../../utils/anatomy3DController'
import { ANATOMY_STRUCTURES } from '../../data/anatomyData'

// ── Dissection steps ───────────────────────────────────────────────────────────
// Each step defines which tissue LAYERS to keep visible.
// The dissection controller manipulates visibleLayers — NOT hiddenStructures.
// This means tissue layer toggles in the left panel will never conflict.
const DISSECTION_STEPS: {
  depth: number
  label: string
  description: string
  color: string
  showLayers: VisibilityLayer[]
}[] = [
  {
    depth: 0,
    label: 'Full Body',
    description: 'All layers visible',
    color: '#f5c9a0',
    showLayers: ['skin', 'muscle', 'organ', 'vessel', 'nerve', 'bone', 'ligament'],
  },
  {
    depth: 1,
    label: 'Remove Skin',
    description: 'Reveal muscles & fascia',
    color: '#c0392b',
    showLayers: ['muscle', 'organ', 'vessel', 'nerve', 'bone', 'ligament'],
  },
  {
    depth: 2,
    label: 'Remove Muscles',
    description: 'Reveal organs & vessels',
    color: '#e07878',
    showLayers: ['organ', 'vessel', 'nerve', 'bone', 'ligament'],
  },
  {
    depth: 3,
    label: 'Remove Organs',
    description: 'Reveal vessels & nerves',
    color: '#f1c40f',
    showLayers: ['vessel', 'nerve', 'bone', 'ligament'],
  },
  {
    depth: 4,
    label: 'Vessels Only',
    description: 'Vascular system on skeleton',
    color: '#e74c3c',
    showLayers: ['vessel', 'bone'],
  },
  {
    depth: 5,
    label: 'Nerves Only',
    description: 'Neural pathways on skeleton',
    color: '#ffe033',
    showLayers: ['nerve', 'bone'],
  },
  {
    depth: 6,
    label: 'Skeleton',
    description: 'Bones only',
    color: '#e8dcc8',
    showLayers: ['bone'],
  },
]

export function DissectionControls() {
  const {
    appMode, selectedStructure,
    visibleLayers, toggleLayer,
    restoreAllLayers, resetVisibility,
  } = useAnatomyStore()

  const [activeDepth, setActiveDepth] = useState(0)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)

  if (appMode !== 'dissection') return null

  // When dissection mode is entered, focus the selected structure
  useEffect(() => {
    if (!focused && selectedStructure) {
      console.info(`[Dissection] focusing on: ${selectedStructure.id}`)
      focusStructure(selectedStructure.id)
      setFocused(true)
    }
  }, [selectedStructure, focused])

  // Apply a dissection step — sets visibleLayers to only the specified layers
  const applyStep = (depth: number) => {
    const step = DISSECTION_STEPS[depth]
    const prev = activeDepth
    setActiveDepth(depth)

    // Toggle layers to match the desired set
    ALL_LAYERS.forEach(layer => {
      const shouldBeOn = step.showLayers.includes(layer)
      const isOn = visibleLayers.has(layer)
      if (shouldBeOn !== isOn) toggleLayer(layer)
    })

    const action = depth > prev
      ? `✓ ${DISSECTION_STEPS[prev].label.replace('Remove ', '')} hidden`
      : depth < prev
      ? `✓ Restored to: ${step.label}`
      : `✓ ${step.label} active`

    console.info(`[Dissection] step ${depth}: ${action}`)
    setLastAction(action)
    setTimeout(() => setLastAction(null), 2500)
  }

  const handleReset = () => {
    restoreAllLayers()
    resetVisibility()
    setActiveDepth(0)
    setFocused(false)
    setLastAction('✓ All layers restored')
    setTimeout(() => setLastAction(null), 2000)
    console.info('[Dissection] reset — all layers restored')
  }

  // Gather counts per layer for info display
  const layerCounts: Partial<Record<VisibilityLayer, number>> = {}
  for (const l of ALL_LAYERS) {
    layerCounts[l] = ANATOMY_STRUCTURES.filter(s => s.category === l).length
  }

  const currentStep = DISSECTION_STEPS[activeDepth]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-[220px]"
    >
      <div
        className="rounded-2xl border border-orange-500/25 overflow-hidden shadow-2xl"
        style={{ background: 'rgba(10,14,26,0.94)', backdropFilter: 'blur(14px)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-orange-500/10 border-b border-orange-500/20">
          <Scissors size={14} className="text-orange-400" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-white">Virtual Dissection</span>
            {selectedStructure && (
              <p className="text-xs text-orange-300/80 truncate">
                Focus: {selectedStructure.name}
              </p>
            )}
          </div>
        </div>

        {/* Confirmation toast */}
        <motion.div
          initial={false}
          animate={{ height: lastAction ? 'auto' : 0, opacity: lastAction ? 1 : 0 }}
          className="overflow-hidden"
        >
          {lastAction && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/15 border-b border-green-500/25">
              <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />
              <span className="text-xs text-green-300">{lastAction}</span>
            </div>
          )}
        </motion.div>

        {/* Layer steps */}
        <div className="px-3 py-3 space-y-1">
          {DISSECTION_STEPS.map(step => {
            const isActive = activeDepth === step.depth
            return (
              <button
                key={step.depth}
                onClick={() => applyStep(step.depth)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border
                  transition-all duration-150 active:scale-[0.98] text-left
                  ${isActive
                    ? 'bg-orange-500/20 border-orange-500/50'
                    : 'bg-white/3 border-white/6 hover:border-white/15 hover:bg-white/6'
                  }
                `}
              >
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: step.color }} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold ${isActive ? 'text-orange-300' : 'text-gray-200'}`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-600 truncate">{step.description}</div>
                </div>
                {isActive
                  ? <Eye    size={11} className="text-orange-400 flex-shrink-0" />
                  : <EyeOff size={11} className="text-gray-700 flex-shrink-0" />
                }
              </button>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-1">
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"
              animate={{ width: `${(activeDepth / (DISSECTION_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-gray-700 text-center mt-1">
            Layer {activeDepth + 1} / {DISSECTION_STEPS.length}
          </p>
        </div>

        {/* Active layer info */}
        <div className="px-3 pb-2">
          <p className="text-xs text-gray-600 text-center">
            Showing: {currentStep.showLayers.join(', ')}
          </p>
        </div>

        {/* Reset */}
        <div className="px-3 pb-3">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl
              bg-orange-500/8 border border-orange-500/20 text-xs text-orange-400
              hover:bg-orange-500/15 transition-all"
          >
            <RotateCcw size={11} />
            Restore All Layers
          </button>
        </div>
      </div>
    </motion.div>
  )
}
