import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, SkipForward, Target, Trophy } from 'lucide-react'
import { useAnatomyStore } from '../../store/anatomyStore'
import { ANATOMY_STRUCTURES } from '../../data/anatomyData'

export function QuizModeOverlay() {
  const {
    appMode, quizQuestion, quizScore,
    startQuiz, endQuiz,
    clearHighlights, resetVisibility,
  } = useAnatomyStore()

  // Only render when quiz mode is active AND there IS a question
  // The AnimatePresence wrapper lets it animate out cleanly
  const isOpen = appMode === 'quiz'

  const targetStructure = quizQuestion
    ? ANATOMY_STRUCTURES.find(s => s.id === quizQuestion.structureId)
    : null

  const accuracy = quizScore.total > 0
    ? Math.round((quizScore.correct / quizScore.total) * 100)
    : 0

  const handleClose = () => {
    // Full quiz teardown: clear state, restore labels/highlights, go back to explore
    clearHighlights()
    resetVisibility()
    endQuiz()             // sets appMode='explore', clears quizQuestion, restores labels
  }

  const handleSkip = () => {
    // Skip only if quiz is still open — prevents double startQuiz calls
    if (appMode === 'quiz') startQuiz()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="quiz-overlay"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[420px] max-w-[90vw]"
        >
          <div className="glass rounded-2xl shadow-2xl overflow-hidden border border-purple-500/20">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-purple-500/10 border-b border-purple-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Target size={16} className="text-purple-300" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Quiz Mode</span>
                  <p className="text-xs text-gray-500">Click the matching structure on the body</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Score */}
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Trophy size={12} className="text-yellow-400" />
                    <span className="text-sm font-bold text-white">{quizScore.correct}/{quizScore.total}</span>
                  </div>
                  <div className="text-xs text-gray-500">{accuracy}% accuracy</div>
                </div>

                {/* Close — full teardown */}
                <button
                  onClick={handleClose}
                  title="Close Quiz"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 hover:border-red-500/40
                    border border-white/10 flex items-center justify-center transition-all"
                >
                  <X size={14} className="text-gray-400 hover:text-red-300" />
                </button>
              </div>
            </div>

            {/* Question content */}
            {quizQuestion && targetStructure ? (
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle size={14} className="text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">Identify this structure:</span>
                </div>

                {/* Progressive hints */}
                <div className="space-y-2">
                  {quizQuestion.hints.slice(0, Math.max(1, quizQuestion.attempts + 1)).map((hint, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`
                        flex gap-2.5 px-3 py-2 rounded-lg
                        ${i === 0
                          ? 'bg-purple-500/12 border border-purple-500/20'
                          : 'bg-gray-800/60 border border-white/6'
                        }
                      `}
                    >
                      <span className={`text-xs font-bold flex-shrink-0 ${i === 0 ? 'text-purple-400' : 'text-gray-500'}`}>
                        {i === 0 ? '💡' : `Hint ${i + 1}:`}
                      </span>
                      <span className="text-xs text-gray-300">{hint}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Attempts + skip */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/6">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: quizQuestion.maxAttempts }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i < quizQuestion.attempts ? 'bg-red-400' : 'bg-gray-700'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">
                      {quizQuestion.maxAttempts - quizQuestion.attempts} left
                    </span>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <SkipForward size={11} />
                    Skip
                  </button>
                </div>
              </div>
            ) : (
              // No question yet — show a waiting state (shouldn't normally be seen)
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-500">Loading question…</p>
              </div>
            )}

            {/* Score bar */}
            {quizScore.total > 0 && (
              <div className="px-4 pb-3">
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                    animate={{ width: `${accuracy}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
