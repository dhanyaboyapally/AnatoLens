/**
 * anatomy3DController â€” central dispatcher for all 3D scene actions.
 *
 * Priority order per requirements:
 * 1. focusStructure() â€” direct camera navigation (always works without AI)
 * 2. executeAIActions() â€” AI response â†’ 3D actions pipeline
 * 3. Layer / visibility helpers
 */

import { useAnatomyStore } from '../store/anatomyStore'
import { STRUCTURE_MAP, findStructureByQuery } from '../data/anatomyData'
import type { VisibilityLayer } from '../store/anatomyStore'
import type { AIAction } from '../types/anatomy'

// â”€â”€â”€ Region camera presets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// These are the ONLY camera positions used. CameraController in AnatomyScene reads them.
export const REGION_CAMERA: Record<string, { x: number; y: number; z: number }> = {
  anterior:  { x: 0,    y: 0,    z: 7   },
  head:      { x: 0,    y: 2.1,  z: 3.2 },
  neck:      { x: 0,    y: 1.6,  z: 3.8 },
  thorax:    { x: 0,    y: 0.75, z: 3.8 },
  abdomen:   { x: 0,    y: -0.2, z: 3.8 },
  pelvis:    { x: 0,    y: -1.1, z: 3.8 },
  spine:     { x: 0.3,  y: 0.3,  z: 4.5 },
  arm:       { x: -1.8, y: 0.6,  z: 3.8 },
  forearm:   { x: -1.8, y: -0.1, z: 3.5 },
  hand:      { x: -1.9, y: -0.9, z: 3.0 },
  leg:       { x: 0,    y: -1.8, z: 4.5 },
  thigh:     { x: 0,    y: -1.3, z: 4.0 },
  shoulder:  { x: -0.8, y: 1.5,  z: 3.8 },
  elbow:     { x: -1.8, y: 0.2,  z: 3.5 },
  wrist:     { x: -1.9, y: -0.7, z: 3.0 },
  knee:      { x: 0,    y: -1.0, z: 4.0 },
  foot:      { x: 0,    y: -2.2, z: 3.5 },
  // Aliases
  posterior: { x: 0,    y: 0,    z: 7   },
  lateral:   { x: 0,    y: 0,    z: 7   },
  palmar:    { x: 1.6,  y: -0.5, z: 3.5 },
  dorsal:    { x: 0,    y: 0,    z: 7   },
  superior:  { x: 0,    y: 2.1,  z: 3.2 },
  inferior:  { x: 0,    y: -1.8, z: 4.5 },
  full_body: { x: 0,    y: 0,    z: 7   },
}

// Structure region â†’ camera key mapping
export const REGION_TO_CAMERA_KEY: Record<string, string> = {
  head: 'head', neck: 'neck', shoulder: 'shoulder', arm: 'arm', elbow: 'elbow',
  forearm: 'forearm', wrist: 'wrist', hand: 'hand', thorax: 'thorax',
  abdomen: 'abdomen', pelvis: 'pelvis', spine: 'spine', thigh: 'thigh',
  knee: 'knee', leg: 'leg', foot: 'foot', full_body: 'anterior',
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PRIMARY: focusStructure
// This is the ONLY way to navigate the camera to a structure.
// All other paths (AI, buttons, voice) call this.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function focusStructure(idOrName: string): boolean {
  const bridge = typeof window !== 'undefined'
    ? (window as Window & {
        focusVanatomeStructure?: (idOrName: string) => boolean
      }).focusVanatomeStructure
    : undefined

  if (bridge) return bridge(idOrName)
  return useAnatomyStore.getState().focusStructure(idOrName)
}

// â”€â”€â”€ Other scene actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function highlightStructure(id: string, exclusive = false) {
  useAnatomyStore.getState().highlightStructure(id, exclusive)
}

export function clearHighlights() {
  useAnatomyStore.getState().clearHighlights()
}

export function hideStructure(id: string) {
  useAnatomyStore.getState().hideStructure(id)
}

export function showStructure(id: string) {
  useAnatomyStore.getState().showStructure(id)
}

export function isolateStructure(id: string) {
  useAnatomyStore.getState().isolateStructure(id)
}

export function clearIsolation() {
  useAnatomyStore.getState().clearIsolation()
}

export function setTransparency(id: string, value: number) {
  useAnatomyStore.getState().setStructureTransparency(id, value)
}

export function traceStructure(id: string) {
  useAnatomyStore.getState().traceStructure(id)
}

export function showLayer(layer: VisibilityLayer) {
  const { visibleLayers, toggleLayer } = useAnatomyStore.getState()
  if (!visibleLayers.has(layer)) toggleLayer(layer)
}

export function hideLayer(layer: VisibilityLayer) {
  const { visibleLayers, toggleLayer } = useAnatomyStore.getState()
  if (visibleLayers.has(layer)) toggleLayer(layer)
}

export function focusRegion(regionId: string) {
  const key = REGION_TO_CAMERA_KEY[regionId] ?? regionId
  useAnatomyStore.getState().setCameraView(key)
}

export function resetView() {
  useAnatomyStore.getState().fullReset()
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// executeAIActions â€” SYNCHRONOUS dispatcher for AI response actions array
// Called by AIChatPanel after receiving a response from aiEngine.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function executeAIActions(actions: AIAction[]) {
  const store = useAnatomyStore.getState()

  console.info(`[executeAIActions] executing ${actions.length} actions:`, actions.map(a => a.type))

  for (const action of actions) {
    switch (action.type) {
      case 'focus': {
        if (action.target) {
          const found = focusStructure(action.target)
          console.info(`[executeAIActions] focus "${action.target}" â†’ found=${found}`)
        }
        break
      }
      case 'highlight': {
        if (action.target) {
          store.highlightStructure(action.target)
          console.info(`[executeAIActions] highlight "${action.target}"`)
        }
        if (action.targets) action.targets.forEach(t => store.highlightStructure(t))
        break
      }
      case 'trace': {
        if (action.target) {
          store.traceStructure(action.target)
          console.info(`[executeAIActions] trace "${action.target}"`)
        }
        break
      }
      case 'hide': {
        if (action.target) store.hideStructure(action.target)
        break
      }
      case 'show': {
        if (action.target) store.showStructure(action.target)
        break
      }
      case 'isolate': {
        if (action.target) store.isolateStructure(action.target)
        break
      }
      case 'reset': {
        store.resetVisibility()
        break
      }
      case 'rotate': {
        if (action.view) {
          store.setCameraView(action.view)
          console.info(`[executeAIActions] rotate/setCameraView "${action.view}"`)
        }
        break
      }
      case 'zoom': {
        if (action.target) {
          focusStructure(action.target)
        }
        break
      }
      case 'label': {
        store.setShowLabels(true)
        break
      }
    }
  }
}
