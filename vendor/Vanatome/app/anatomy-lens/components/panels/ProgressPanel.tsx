import { motion } from 'framer-motion'
import { BarChart3, Trophy, Target, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { useAnatomyStore } from '../../store/anatomyStore'
import { ANATOMY_STRUCTURES } from '../../data/anatomyData'

const CATEGORY_COLORS: Record<string, string> = {
  bone: '#e8dcc8', muscle: '#e74c3c', nerve: '#f39c12',
  vessel: '#ff4757', ligament: '#85c1e9',
}

function StructureProgressBar({ structureId }: { structureId: string }) {
  const { progress, highlightStructure, clearHighlights, selectStructure } = useAnatomyStore()
  const p = progress.get(structureId)
  const structure = ANATOMY_STRUCTURES.find(s => s.id === structureId)
  if (!p || !structure) return null

  const accuracy = p.attempts > 0 ? Math.round((p.correct / p.attempts) * 100) : 0
  const isWeak = accuracy < 60 && p.attempts > 0
  const isMastered = p.mastered

  return (
    <button
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-150 text-left
        hover:bg-white/4
        ${isWeak ? 'border-red-500/20 bg-red-500/5' :
          isMastered ? 'border-green-500/20 bg-green-500/5' :
          'border-white/6 bg-transparent'}
      `}
      onClick={() => {
        clearHighlights()
        highlightStructure(structureId)
        selectStructure(structure)
      }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: CATEGORY_COLORS[structure.category] || '#666' }}
      />
      <span className="text-xs text-gray-300 flex-1 truncate">{structure.name}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              isWeak ? 'bg-red-400' :
              isMastered ? 'bg-green-400' :
              'bg-cyan-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
        </div>
        <span className={`text-xs font-medium w-8 text-right ${
          isWeak ? 'text-red-400' :
          isMastered ? 'text-green-400' :
          'text-gray-400'
        }`}>
          {accuracy}%
        </span>
        {isMastered && <CheckCircle2 size={11} className="text-green-400" />}
        {isWeak && <AlertTriangle size={11} className="text-red-400" />}
      </div>
    </button>
  )
}

export function ProgressPanel() {
  const { progress, quizScore, getWeakStructures, highlightStructure, clearHighlights } = useAnatomyStore()

  const attempted = Array.from(progress.values()).filter(p => p.attempts > 0)
  const mastered = attempted.filter(p => p.mastered)
  const weak = getWeakStructures()
  const totalAccuracy = attempted.length > 0
    ? Math.round(attempted.reduce((acc, p) => acc + (p.correct / p.attempts) * 100, 0) / attempted.length)
    : 0

  const studiedCount = attempted.length
  const totalCount = ANATOMY_STRUCTURES.length

  // Group by category
  const byCategory: Record<string, typeof attempted> = {}
  for (const entry of attempted) {
    const s = ANATOMY_STRUCTURES.find(s => s.id === entry.structureId)
    if (s) {
      if (!byCategory[s.category]) byCategory[s.category] = []
      byCategory[s.category].push(entry)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <BarChart3 size={15} className="text-cyan-400" />
          <span className="text-sm font-semibold text-white">Learning Progress</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Your anatomy mastery map</p>
      </div>

      <div className="flex-1 px-3 py-3 space-y-4">
        {/* Overview stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: 'Accuracy',
              value: `${totalAccuracy}%`,
              icon: Target,
              color: 'text-cyan-400',
              bg: 'bg-cyan-500/10 border-cyan-500/20',
            },
            {
              label: 'Mastered',
              value: `${mastered.length}/${totalCount}`,
              icon: Trophy,
              color: 'text-yellow-400',
              bg: 'bg-yellow-500/10 border-yellow-500/20',
            },
            {
              label: 'Studied',
              value: `${studiedCount}`,
              icon: TrendingUp,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10 border-blue-500/20',
            },
            {
              label: 'Quiz Score',
              value: `${quizScore.correct}/${quizScore.total}`,
              icon: CheckCircle2,
              color: 'text-green-400',
              bg: 'bg-green-500/10 border-green-500/20',
            },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className={`px-3 py-2.5 rounded-xl border ${stat.bg}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} className={stat.color} />
                  <span className="text-xs text-gray-500">{stat.label}</span>
                </div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
              </div>
            )
          })}
        </div>

        {/* Progress ring */}
        <div className="flex flex-col items-center py-2">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="url(#progressGrad)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - (mastered.length / totalCount))}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {Math.round((mastered.length / totalCount) * 100)}%
              </span>
              <span className="text-xs text-gray-500">mastered</span>
            </div>
          </div>
        </div>

        {/* Weak structures */}
        {weak.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <AlertTriangle size={12} className="text-red-400" />
              <span className="text-xs font-medium text-red-300">Needs Practice ({weak.length})</span>
            </div>
            <div className="space-y-1">
              {weak.map(s => (
                <button
                  key={s.id}
                  onClick={() => { clearHighlights(); highlightStructure(s.id) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg
                    bg-red-500/8 border border-red-500/20 hover:bg-red-500/15 transition-all"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-gray-300 flex-1 text-left">{s.name}</span>
                  <span className="text-xs text-red-400">
                    {Math.round((progress.get(s.id)?.correct || 0) / (progress.get(s.id)?.attempts || 1) * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All attempted structures */}
        {attempted.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
              Detailed Progress
            </p>
            <div className="space-y-1">
              {attempted.map(p => (
                <StructureProgressBar key={p.structureId} structureId={p.structureId} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {attempted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock size={32} className="text-gray-700 mb-3" />
            <p className="text-sm text-gray-600">No activity yet</p>
            <p className="text-xs text-gray-700 mt-1">
              Take a quiz or explore structures to start tracking progress
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


