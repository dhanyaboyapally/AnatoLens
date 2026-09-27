import { motion, AnimatePresence } from 'framer-motion'
import { Stethoscope, X, ChevronRight, AlertCircle, Shuffle } from 'lucide-react'
import { useState } from 'react'
import { useAnatomyStore } from '../../store/anatomyStore'
import { CLINICAL_SCENARIOS } from '../../data/anatomyData'

const DIFFICULTY_STYLES = {
  beginner: 'bg-green-500/15 text-green-300 border-green-500/30',
  intermediate: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  advanced: 'bg-red-500/15 text-red-300 border-red-500/30',
}

export function ClinicalModeOverlay() {
  const { appMode, currentScenario, setScenario, setAppMode } = useAnatomyStore()
  const [showHint, setShowHint] = useState(false)

  if (appMode !== 'clinical' || !currentScenario) return null

  const handleNewScenario = () => {
    const others = CLINICAL_SCENARIOS.filter(s => s.id !== currentScenario.id)
    const next = others[Math.floor(Math.random() * others.length)]
    setScenario(next)
    setShowHint(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute top-4 right-4 z-20 w-[340px] max-w-[90vw]"
      >
        <div className="glass rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-green-500/8 border-b border-green-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <Stethoscope size={16} className="text-green-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Clinical Challenge</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs border ${DIFFICULTY_STYLES[currentScenario.difficulty]}`}>
                    {currentScenario.difficulty}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{currentScenario.title}</p>
              </div>
            </div>
            <button
              onClick={() => { setScenario(null); setAppMode('explore') }}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Scenario */}
          <div className="px-4 py-3">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-300 leading-relaxed">
                {currentScenario.presentation}
              </p>
            </div>

            <div className="px-3 py-2 rounded-lg bg-green-500/8 border border-green-500/20 mb-3">
              <p className="text-xs font-medium text-green-300">
                â“ {currentScenario.question}
              </p>
            </div>

            {/* Hint toggle */}
            {!showHint ? (
              <button
                onClick={() => setShowHint(true)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                <ChevronRight size={11} />
                Show anatomical hint
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-3 py-2 rounded-lg bg-yellow-500/8 border border-yellow-500/20"
              >
                <p className="text-xs text-yellow-300">
                  ðŸ’¡ Think about what structure is located in that region. Consider the nerve/vessel supply.
                </p>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-4 pb-4">
            <button
              onClick={handleNewScenario}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                bg-gray-800/60 border border-white/8 text-xs text-gray-400
                hover:border-white/15 hover:text-gray-200 transition-all"
            >
              <Shuffle size={12} />
              New Case
            </button>
            <button
              onClick={() => { setScenario(null); setAppMode('explore') }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                bg-green-500/10 border border-green-500/25 text-xs text-green-300
                hover:bg-green-500/20 transition-all"
            >
              Exit
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// â”€â”€â”€ Scenario Picker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ScenarioPicker({ onClose }: { onClose: () => void }) {
  const { setScenario, setAppMode, addMessage } = useAnatomyStore()

  const startScenario = (scenario: typeof CLINICAL_SCENARIOS[0]) => {
    setAppMode('clinical')
    setScenario(scenario)
    addMessage({
      role: 'ai',
      content: `ðŸ¥ **Clinical Challenge: ${scenario.title}**\n\n${scenario.presentation}\n\n**Question:** ${scenario.question}\n\nClick the relevant structure on the 3D model.`,
    })
    onClose()
  }

  return (
    <div className="space-y-2">
      {CLINICAL_SCENARIOS.map(scenario => (
        <button
          key={scenario.id}
          onClick={() => startScenario(scenario)}
          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl bg-gray-800/60
            border border-white/8 hover:border-green-500/30 hover:bg-green-500/5
            transition-all duration-150 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/25 flex items-center
            justify-center flex-shrink-0">
            <Stethoscope size={14} className="text-green-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
                {scenario.title}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-xs border flex-shrink-0 ${DIFFICULTY_STYLES[scenario.difficulty]}`}>
                {scenario.difficulty}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {scenario.presentation.slice(0, 70)}...
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}


