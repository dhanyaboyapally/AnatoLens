import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, BarChart3, ChevronLeft, ChevronRight,
  PanelLeftOpen, PanelRightOpen
} from 'lucide-react'
import { AnatomyScene } from './components/viewer/AnatomyScene'
import { AIChatPanel } from './components/panels/AIChatPanel'
import { LayerControlPanel } from './components/panels/LayerControlPanel'
import { ProgressPanel } from './components/panels/ProgressPanel'
import { StructureInfoCard } from './components/ui/StructureInfoCard'
import { TopBar } from './components/ui/TopBar'
import { QuizModeOverlay } from './components/modes/QuizMode'
import { TeachModeOverlay } from './components/modes/TeachMode'
import { ClinicalModeOverlay } from './components/modes/ClinicalMode'
import { DissectionControls } from './components/ui/DissectionControls'
import { useAnatomyStore } from './store/anatomyStore'

type RightTab = 'ai' | 'progress'

function SidePanel({
  side,
  isOpen,
  width,
  children,
}: {
  side: 'left' | 'right'
  isOpen: boolean
  width: number
  children: React.ReactNode
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="flex-shrink-0 h-full overflow-hidden relative"
          style={{ width }}
        >
          <div
            className="h-full glass-dark overflow-hidden"
            style={{
              borderRight: side === 'left' ? '1px solid rgba(255,255,255,0.06)' : undefined,
              borderLeft: side === 'right' ? '1px solid rgba(255,255,255,0.06)' : undefined,
            }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [rightTab, setRightTab] = useState<RightTab>('ai')
  const { appMode } = useAnatomyStore()

  const LEFT_WIDTH = 240
  const RIGHT_WIDTH = 320

  const rightTabs = [
    { id: 'ai', label: 'AI Assistant', icon: MessageSquare },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
  ]

  return (
    <div className="w-screen h-screen bg-[#070b16] flex overflow-hidden">
      {/* Left panel */}
      <div className="relative flex-shrink-0 h-full">
        <SidePanel side="left" isOpen={leftOpen} width={LEFT_WIDTH}>
          <div className="h-full">
            <LayerControlPanel />
          </div>
        </SidePanel>

        {/* Left toggle */}
        <div className={`
          absolute top-1/2 -translate-y-1/2 z-10
          ${leftOpen ? 'right-0 translate-x-full' : 'left-0'}
        `}>
          <button
            onClick={() => setLeftOpen(!leftOpen)}
            className={`
              w-8 h-10 flex items-center justify-center transition-all duration-150
              bg-gray-900/90 border border-white/10 text-gray-500 hover:text-gray-300
              ${leftOpen ? 'rounded-r-xl border-l-0' : 'rounded-xl'}
            `}
          >
            {leftOpen
              ? <ChevronLeft size={14} />
              : <PanelLeftOpen size={14} />
            }
          </button>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 relative overflow-hidden">
        <AnatomyScene />

        {/* Overlays */}
        <TopBar />
        <StructureInfoCard />
        <QuizModeOverlay />
        <TeachModeOverlay />
        <ClinicalModeOverlay />
        <DissectionControls />

        {/* Mode badge */}
        {appMode !== 'explore' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                px-4 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm
                ${appMode === 'quiz' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' :
                  appMode === 'teach' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' :
                  appMode === 'clinical' ? 'bg-green-500/20 border-green-500/40 text-green-300' :
                  'bg-orange-500/20 border-orange-500/40 text-orange-300'
                }
              `}
            >
              {appMode === 'quiz' ? '🧠 Quiz Mode — Click to identify' :
               appMode === 'teach' ? '📚 Teach Me Mode' :
               appMode === 'clinical' ? '🏥 Clinical Challenge' :
               '✂️ Virtual Dissection'}
            </motion.div>
          </div>
        )}

        {/* Corner hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span className="text-xs text-gray-700 select-none">
            Drag to rotate · Scroll to zoom · Click to select
          </span>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex-shrink-0 h-full">
        {/* Right toggle */}
        <div className={`
          absolute top-1/2 -translate-y-1/2 z-10
          ${rightOpen ? 'left-0 -translate-x-full' : 'right-0'}
        `}>
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className={`
              w-8 h-10 flex items-center justify-center transition-all duration-150
              bg-gray-900/90 border border-white/10 text-gray-500 hover:text-gray-300
              ${rightOpen ? 'rounded-l-xl border-r-0' : 'rounded-xl'}
            `}
          >
            {rightOpen
              ? <ChevronRight size={14} />
              : <PanelRightOpen size={14} />
            }
          </button>
        </div>

        <SidePanel side="right" isOpen={rightOpen} width={RIGHT_WIDTH}>
          <div className="h-full flex flex-col">
            {/* Tab switcher */}
            <div className="flex-shrink-0 flex border-b border-white/6">
              {rightTabs.map(tab => {
                const Icon = tab.icon
                const isActive = rightTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setRightTab(tab.id as RightTab)}
                    className={`
                      flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                      border-b-2 transition-all duration-150
                      ${isActive
                        ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {rightTab === 'ai' && (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    <AIChatPanel />
                  </motion.div>
                )}
                {rightTab === 'progress' && (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    <ProgressPanel />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </SidePanel>
      </div>
    </div>
  )
}
