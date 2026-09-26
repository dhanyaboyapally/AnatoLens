import { useEffect, useMemo, useState } from 'react'
import {
  VanatomeViewer,
  useVanatomeController,
  type VanatomeAtlas,
} from '@vixotic/vanatome-react'
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { createOfficialHumanAtlas } from '@vixotic/vanatome-atlas'
import { ANATOMY_STRUCTURES, findStructureByQuery } from '../../data/anatomyData'
import { useAnatomyStore } from '../../store/anatomyStore'
import type { AnatomicalStructure } from '../../types/anatomy'

const atlasLoader = createOfficialHumanAtlas()
const INITIAL_CAMERA_POSITION = [0, 0, 5.8] as const
const SYSTEM_COLORS: Record<string, string> = {
  skeletal: '#d8c7a8',
  muscular: '#9e3b3b',
  cardiovascular: '#b63d45',
  nervous: '#d6b642',
  lymphatic: '#6aa878',
  digestive: '#b77a57',
  respiratory: '#cf8f93',
  endocrine: '#b565a7',
  reproductive: '#c56f8a',
  urinary: '#b99478',
  'regional-anatomy': '#c89b7d',
}

function findAtlasId(atlas: VanatomeAtlas, structure: AnatomicalStructure | null) {
  if (!structure) return null

  const match = atlas.structures.find(candidate =>
    candidate.id === structure.id ||
    candidate.name.toLowerCase() === structure.name.toLowerCase()
  )

  return match?.id ?? null
}

function findAppStructure(atlas: VanatomeAtlas, id: string) {
  const atlasStructure = atlas.structures.find(structure => structure.id === id)
  if (!atlasStructure) return undefined

  return findStructureByQuery(atlasStructure.name) ??
    ANATOMY_STRUCTURES.find(structure => structure.id === atlasStructure.id)
}

function ViewerMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex items-center justify-center bg-[#0a0e1a] px-6 text-center">
      <p className="text-sm text-gray-400">{children}</p>
    </div>
  )
}

export function AnatomyScene() {
  const [atlas, setAtlas] = useState<VanatomeAtlas | null>(null)
  const [error, setError] = useState<string | null>(null)
  const controller = useVanatomeController([])
  const { focus, reset } = controller
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([
    ...INITIAL_CAMERA_POSITION,
  ])
  const {
    selectedStructure,
    isolatedId,
    manuallyHidden,
    cameraView,
    selectStructure,
    focusStructure,
  } = useAnatomyStore()

  useEffect(() => {
    let mounted = true

    atlasLoader.loadProfile('full-body')
      .then(({ atlas: loadedAtlas }) => {
        if (mounted) setAtlas(loadedAtlas)
      })
      .catch(() => {
        if (mounted) setError('Unable to load the 3D anatomy atlas.')
      })

    return () => { mounted = false }
  }, [])

  const selectedAtlasId = useMemo(
    () => atlas ? findAtlasId(atlas, selectedStructure) : null,
    [atlas, selectedStructure]
  )

  const visibleLayers = useMemo(
    () => atlas ? [...new Set(atlas.structures.map(structure => structure.layer))] : [],
    [atlas]
  )

  const isolatedAtlasId = useMemo(
    () => atlas && isolatedId
      ? findAtlasId(atlas, ANATOMY_STRUCTURES.find(structure => structure.id === isolatedId) ?? null)
      : null,
    [atlas, isolatedId]
  )

  const hiddenAtlasIds = useMemo(() => {
    if (!atlas) return []

    return [...manuallyHidden].flatMap(id => {
      const atlasId = findAtlasId(
        atlas,
        ANATOMY_STRUCTURES.find(structure => structure.id === id) ?? null
      )
      return atlasId ? [atlasId] : []
    })
  }, [atlas, manuallyHidden])

  useEffect(() => {
    if (selectedAtlasId && cameraView.startsWith('focus:')) {
      focus(selectedAtlasId)
    }
  }, [cameraView, focus, selectedAtlasId])

  useEffect(() => {
    ;(window as Window & { focusStructure?: (id: string) => boolean }).focusStructure = focusStructure
    return () => {
      delete (window as Window & { focusStructure?: (id: string) => boolean }).focusStructure
    }
  }, [focusStructure])

  const adjustCamera = (angleDelta: number, distanceDelta: number) => {
    setCameraPosition(current => {
      const distance = Math.hypot(current[0], current[2])
      const nextDistance = Math.min(8, Math.max(3.6, distance + distanceDelta))
      const nextAngle = Math.atan2(current[0], current[2]) + angleDelta

      return [
        Math.sin(nextAngle) * nextDistance,
        current[1],
        Math.cos(nextAngle) * nextDistance,
      ]
    })
    reset()
  }

  if (error) return <ViewerMessage>{error}</ViewerMessage>
  if (!atlas) return <ViewerMessage>Loading the 3D anatomy atlas…</ViewerMessage>

  return (
    <div className="relative h-full w-full">
      <VanatomeViewer
        atlas={atlas}
        selectedId={selectedAtlasId}
        isolatedId={isolatedAtlasId}
        hiddenIds={hiddenAtlasIds}
        visibleLayers={visibleLayers}
        systemColors={SYSTEM_COLORS}
        displayMode="normal"
        appearance={{
          bodyShellId: null,
          skeletonId: null,
          defaultOpacity: 1,
        }}
        focusRequestKey={controller.focusRequestKey}
        resetViewKey={controller.resetViewKey}
        onSelect={id => selectStructure(id ? findAppStructure(atlas, id) ?? null : null)}
        onError={() => setError('Unable to load the 3D anatomy model.')}
        onEscape={() => selectStructure(null)}
        enablePan
        initialCameraPosition={cameraPosition}
        className="h-full w-full"
        style={{ background: '#0a0e1a' }}
        ariaLabel="Interactive 3D anatomy viewer"
        loadingFallback={<ViewerMessage>Loading the 3D anatomy model…</ViewerMessage>}
        errorFallback={<ViewerMessage>Unable to load the 3D anatomy model.</ViewerMessage>}
      />

      <div className="absolute top-16 right-4 z-20 flex items-center gap-1 rounded-xl glass p-1">
        <button
          onClick={() => adjustCamera(-Math.PI / 6, 0)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Rotate left"
          aria-label="Rotate left"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={() => adjustCamera(Math.PI / 6, 0)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Rotate right"
          aria-label="Rotate right"
        >
          <RotateCw size={15} />
        </button>
        <div className="w-px h-5 bg-white/10" />
        <button
          onClick={() => adjustCamera(0, -0.7)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => adjustCamera(0, 0.7)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut size={15} />
        </button>
      </div>
    </div>
  )
}
