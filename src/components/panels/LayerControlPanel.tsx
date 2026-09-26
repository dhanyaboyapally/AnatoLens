import { motion } from 'framer-motion'
import { Eye, EyeOff, Layers, RotateCcw, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useAnatomyStore, type VisibilityLayer } from '../../store/anatomyStore'
import { ANATOMY_STRUCTURES } from '../../data/anatomyData'

const LAYERS: { id: VisibilityLayer; label: string; color: string; activeClass: string }[] = [
  { id: 'skin',     label: 'Skin',     color: '#f5c9a0', activeClass: 'bg-orange-400/15 border-orange-400/35' },
  { id: 'muscle',   label: 'Muscle',   color: '#c0392b', activeClass: 'bg-red-500/15    border-red-500/35'    },
  { id: 'organ',    label: 'Organs',   color: '#e07878', activeClass: 'bg-pink-500/15   border-pink-500/35'   },
  { id: 'vessel',   label: 'Vessels',  color: '#e74c3c', activeClass: 'bg-red-600/15    border-red-600/35'    },
  { id: 'nerve',    label: 'Nerves',   color: '#f1c40f', activeClass: 'bg-yellow-400/15 border-yellow-400/35' },
  { id: 'bone',     label: 'Bone',     color: '#e8dcc8', activeClass: 'bg-amber-200/15  border-amber-300/35'  },
  { id: 'ligament', label: 'Ligament', color: '#85c1e9', activeClass: 'bg-blue-300/15   border-blue-300/35'   },
]

// Region views mapped to new camera positions
const VIEW_PRESETS = [
  { id: 'anterior', label: 'Full Body' },
  { id: 'head',     label: 'Head' },
  { id: 'thorax',   label: 'Chest' },
  { id: 'abdomen',  label: 'Abdomen' },
  { id: 'pelvis',   label: 'Pelvis' },
  { id: 'arm',      label: 'Arm' },
  { id: 'leg',      label: 'Legs' },
]

function StructureListItem({ id, isSelected }: { id: string; isSelected: boolean }) {
  const structure = ANATOMY_STRUCTURES.find(s => s.id === id)
  const { selectStructure, highlightStructure, clearHighlights, hideStructure, showStructure } = useAnatomyStore()
  const isHidden = useAnatomyStore(s => s.hiddenStructures.has(id))
  if (!structure) return null

  return (
    <div
      className={`
        group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
        transition-all duration-150
        ${isSelected ? 'bg-cyan-500/15 border border-cyan-500/30' : 'hover:bg-white/4 border border-transparent'}
        ${isHidden ? 'opacity-35' : ''}
      `}
      onClick={() => {
        selectStructure(structure)
        clearHighlights()
        highlightStructure(id)
      }}
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: structure.color }} />
      <span className={`text-xs flex-1 truncate ${isSelected ? 'text-cyan-300' : 'text-gray-400'}`}>
        {structure.name}
      </span>
      <button
        onClick={e => { e.stopPropagation(); isHidden ? showStructure(id) : hideStructure(id) }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
        title={isHidden ? 'Show' : 'Hide'}
      >
        {isHidden
          ? <EyeOff size={11} className="text-gray-600 hover:text-gray-200" />
          : <Eye    size={11} className="text-gray-500 hover:text-gray-200" />}
      </button>
    </div>
  )
}

export function LayerControlPanel() {
  const {
    visibleLayers, toggleLayer,
    showLabels, setShowLabels,
    setCameraView, selectedStructure,
  } = useAnatomyStore()

  const [showStructureList, setShowStructureList] = useState(false)
  const selectedId = selectedStructure?.id

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-cyan-400" />
          <span className="text-sm font-semibold text-white">Anatomy Layers</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Toggle visibility by tissue type</p>
      </div>

      <div className="flex-1 px-3 py-3 space-y-5">

        {/* ── TISSUE LAYERS ── */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
            Tissue Layers
          </p>
          <div className="space-y-1">
            {LAYERS.map(layer => {
              const isOn = visibleLayers.has(layer.id)
              const count = ANATOMY_STRUCTURES.filter(s => s.category === layer.id).length
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border
                    transition-all duration-150 active:scale-[0.98]
                    ${isOn
                      ? `${layer.activeClass}`
                      : 'bg-transparent border-white/6 opacity-40 hover:opacity-60'
                    }
                  `}
                >
                  {/* Colour swatch */}
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0 transition-all"
                    style={{ backgroundColor: isOn ? layer.color : '#374151' }}
                  />
                  <span className={`text-sm font-medium flex-1 text-left ${isOn ? 'text-white' : 'text-gray-600'}`}>
                    {layer.label}
                  </span>
                  <span className="text-xs text-gray-600 tabular-nums">{count}</span>
                  {/* Eye icon — click area is the whole row */}
                  {isOn
                    ? <Eye    size={13} className="text-gray-300 flex-shrink-0" />
                    : <EyeOff size={13} className="text-gray-700 flex-shrink-0" />
                  }
                </button>
              )
            })}
          </div>
        </div>

        {/* ── LABELS TOGGLE ── */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
            Display
          </p>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150
              ${showLabels
                ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300'
                : 'bg-gray-800/50 border-white/8 text-gray-400 hover:border-white/15'
              }
            `}
          >
            <Tag size={13} className={showLabels ? 'text-cyan-400' : 'text-gray-500'} />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">Labels</div>
              <div className="text-xs text-gray-600 mt-0.5 leading-none">
                {showLabels ? 'Always visible' : 'Hover to reveal'}
              </div>
            </div>
            <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${showLabels ? 'bg-cyan-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${showLabels ? 'left-4' : 'left-0.5'}`} />
            </div>
          </button>
          {!showLabels && (
            <p className="text-xs text-gray-600 px-1 mt-1.5 leading-tight">
              💡 Hover a dot on the body to see its name
            </p>
          )}
        </div>

        {/* ── BODY REGION VIEWS ── */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
            Jump To Region
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {VIEW_PRESETS.map(v => (
              <button
                key={v.id}
                onClick={() => setCameraView(v.id)}
                className="px-2 py-2 rounded-xl text-xs font-medium text-gray-400
                  bg-gray-800/60 border border-white/8
                  hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-cyan-500/8
                  transition-all duration-150 active:scale-95"
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── RESET ── */}
        <button
          onClick={() => useAnatomyStore.getState().fullReset()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
            bg-orange-500/8 border border-orange-500/20 text-orange-400 text-sm font-medium
            hover:bg-orange-500/15 hover:border-orange-500/35 transition-all active:scale-95"
        >
          <RotateCcw size={13} />
          Reset Everything
        </button>

        {/* ── ALL STRUCTURES LIST ── */}
        <div>
          <button
            onClick={() => setShowStructureList(!showStructureList)}
            className="w-full flex items-center justify-between px-1 py-1 text-xs font-medium
              text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
          >
            <span>All Structures ({ANATOMY_STRUCTURES.length})</span>
            {showStructureList ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showStructureList && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-1.5 space-y-0.5"
            >
              {ANATOMY_STRUCTURES.map(s => (
                <StructureListItem key={s.id} id={s.id} isSelected={selectedId === s.id} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
