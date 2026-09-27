import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronRight, X } from 'lucide-react'
import { useAnatomyStore } from '../../store/anatomyStore'
import { TEACH_LESSONS } from '../../data/anatomyData'

export function TeachModeOverlay() {
  const {
    appMode, currentLesson, lessonStep, nextLessonStep,
    setAppMode, setLesson, clearHighlights,
  } = useAnatomyStore()

  if (appMode !== 'teach' || !currentLesson) return null

  const step = currentLesson.steps[lessonStep]
  const isLast = lessonStep === currentLesson.steps.length - 1

  const handleNext = () => {
    clearHighlights()
    if (isLast) {
      setLesson(null)
      setAppMode('explore')
    } else {
      nextLessonStep()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[480px] max-w-[90vw]"
      >
        <div className="glass rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-500/10 border-b border-blue-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <BookOpen size={16} className="text-blue-300" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white">{currentLesson.title}</span>
                <p className="text-xs text-gray-500">
                  Step {lessonStep + 1} of {currentLesson.steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setLesson(null); setAppMode('explore') }}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-800">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              animate={{ width: `${((lessonStep + 1) / currentLesson.steps.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Step content */}
          <div className="px-4 py-4">
            <motion.p
              key={lessonStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-gray-200 leading-relaxed"
            >
              {step.narration}
            </motion.p>
          </div>

          {/* Step dots + navigation */}
          <div className="flex items-center justify-between px-4 pb-4">
            <div className="flex gap-1.5">
              {currentLesson.steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === lessonStep ? 'w-5 bg-blue-400' :
                    i < lessonStep ? 'w-1.5 bg-blue-600' :
                    'w-1.5 bg-gray-700'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400
                text-white text-sm font-medium transition-all duration-150 active:scale-95
                shadow-lg shadow-blue-500/25"
            >
              {isLast ? (
                <>Finish lesson</>
              ) : (
                <>
                  Next
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// â”€â”€â”€ Lesson Picker (used in sidebar or modal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function LessonPicker({ onClose }: { onClose: () => void }) {
  const { setLesson, setAppMode, executeActions, clearHighlights, addMessage } = useAnatomyStore()

  const startLesson = (lesson: typeof TEACH_LESSONS[0]) => {
    setAppMode('teach')
    setLesson(lesson)
    clearHighlights()
    const firstStep = lesson.steps[0]
    executeActions(firstStep.actions)
    addMessage({
      role: 'ai',
      content: `ðŸ“š **Starting lesson: ${lesson.title}**\n\n${firstStep.narration}`,
      actions: firstStep.actions,
    })
    onClose()
  }

  return (
    <div className="space-y-2">
      {TEACH_LESSONS.map(lesson => (
        <button
          key={lesson.id}
          onClick={() => startLesson(lesson)}
          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl bg-gray-800/60
            border border-white/8 hover:border-blue-500/30 hover:bg-blue-500/5
            transition-all duration-150 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center
            justify-center flex-shrink-0 group-hover:bg-blue-500/25 transition-colors">
            <BookOpen size={14} className="text-blue-300" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
              {lesson.title}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {lesson.steps.length} steps Â· {lesson.region}
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-600 group-hover:text-blue-400 ml-auto flex-shrink-0 mt-1 transition-colors" />
        </button>
      ))}
    </div>
  )
}


