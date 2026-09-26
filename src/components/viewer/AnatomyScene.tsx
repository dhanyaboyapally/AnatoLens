import { useEffect, useMemo, useState } from 'react'
import {
  VanatomeViewer,
  useVanatomeController,
  type VanatomeAtlas,
} from '@vixotic/vanatome-react'
import { createOfficialHumanAtlas } from '@vixotic/vanatome-atlas'
import { ANATOMY_STRUCTURES, findStructureByQuery } from '../../data/anatomyData'
import { useAnatomyStore } from '../../store/anatomyStore'
import type { AnatomicalStructure } from '../../types/anatomy'

const atlasLoader = createOfficialHumanAtlas()

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
      controller.focus(selectedAtlasId)
    }
  }, [cameraView, controller, selectedAtlasId])

  useEffect(() => {
    ;(window as Window & { focusStructure?: (id: string) => boolean }).focusStructure = focusStructure
    return () => {
      delete (window as Window & { focusStructure?: (id: string) => boolean }).focusStructure
    }
  }, [focusStructure])

  if (error) return <ViewerMessage>{error}</ViewerMessage>
  if (!atlas) return <ViewerMessage>Loading the 3D anatomy atlas…</ViewerMessage>

  return (
    <VanatomeViewer
      atlas={atlas}
      selectedId={selectedAtlasId}
      isolatedId={isolatedAtlasId}
      hiddenIds={hiddenAtlasIds}
      focusRequestKey={controller.focusRequestKey}
      resetViewKey={controller.resetViewKey}
      onSelect={id => selectStructure(id ? findAppStructure(atlas, id) ?? null : null)}
      onError={() => setError('Unable to load the 3D anatomy model.')}
      onEscape={() => selectStructure(null)}
      className="h-full w-full"
      style={{ background: '#0a0e1a' }}
      ariaLabel="Interactive 3D anatomy viewer"
      loadingFallback={<ViewerMessage>Loading the 3D anatomy model…</ViewerMessage>}
      errorFallback={<ViewerMessage>Unable to load the 3D anatomy model.</ViewerMessage>}
    />
  )
}
