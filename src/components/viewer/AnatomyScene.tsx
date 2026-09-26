import { useRef, useEffect, useCallback, useState } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { TextureLoader } from 'three'
import { useAnatomyStore } from '../../store/anatomyStore'
import { REGION_CAMERA } from '../../utils/anatomy3DController'
import { ANATOMY_STRUCTURES } from '../../data/anatomyData'
import type { AnatomicalStructure } from '../../types/anatomy'

// ─── Image coordinate system ──────────────────────────────────────────────────
// The atlas is rendered as a 5.4 × 5.4 unit plane at Z = 0.
// px() converts pixel coords (0–960) → 3D scene units.
export const IMG_W = 5.4
export const IMG_H = 5.4
export const ATLAS_PX = 960

export function imgPx(x: number, y: number, z = 0.04): [number, number, number] {
  return [(x / ATLAS_PX - 0.5) * IMG_W, (0.5 - y / ATLAS_PX) * IMG_H, z]
}

// ─── Hotspot pixel map ────────────────────────────────────────────────────────
// Every structure id that exists here will render an interactive hotspot.
// Structures missing from this map are silently invisible (never crash).
export const HOTSPOT_PX: Record<string, [number, number]> = {
  skull: [480, 72], brain: [520, 115], facial_muscles: [500, 155],
  facial_nerve: [570, 185], cervical_spine: [480, 235], carotid_artery: [530, 255],
  jugular_vein: [440, 255], sternum: [480, 355], ribs: [370, 370],
  clavicle: [590, 290], clavicle_left: [370, 290], thoracic_spine: [480, 390],
  heart: [545, 340], lungs: [530, 310], diaphragm: [480, 455],
  pectoralis_major: [400, 350], intercostal_muscles: [380, 415],
  liver: [545, 480], stomach: [430, 490], small_intestine: [480, 570],
  large_intestine: [395, 545], kidneys: [550, 545], abdominal_muscles: [390, 500],
  lumbar_spine: [480, 600], pelvis: [480, 660], spinal_cord: [490, 430],
  humerus: [310, 420], humerus_left: [655, 420], biceps_brachii: [290, 450],
  triceps_brachii: [270, 460], brachial_artery: [305, 475],
  radius: [268, 570], ulna: [252, 575], radial_artery: [255, 600],
  median_nerve: [280, 530], ulnar_nerve: [260, 520], radial_nerve: [295, 490],
  brachial_plexus: [340, 310], femur: [400, 730], femur_left: [560, 730],
  quadriceps: [385, 760], hamstrings: [375, 790], femoral_artery: [415, 755],
  femoral_vein: [430, 755], sciatic_nerve: [395, 775],
  tibia: [405, 855], tibia_left: [555, 855],
  aorta: [500, 440], superior_vena_cava: [510, 320], iliac_artery: [480, 640],
}

// ─── Colour palette ───────────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  bone: '#f5f0e8', muscle: '#e05050', nerve: '#ffe033',
  vessel: '#dd2222', organ: '#e07878', ligament: '#a8d8f0',
  tendon: '#f0e6d0', skin: '#f5c9a0',
}

const CAT_BADGE: Record<string, string> = {
  bone:     'bg-amber-100/90 text-amber-900 border-amber-300/60',
  muscle:   'bg-red-500/90 text-white border-red-400/60',
  nerve:    'bg-yellow-400/90 text-yellow-900 border-yellow-300/60',
  vessel:   'bg-red-600/90 text-white border-red-500/60',
  organ:    'bg-pink-500/90 text-white border-pink-400/60',
  ligament: 'bg-blue-300/90 text-blue-900 border-blue-200/60',
  tendon:   'bg-amber-200/90 text-amber-900 border-amber-300/60',
  skin:     'bg-orange-200/90 text-orange-900 border-orange-300/60',
}

// ─── Atlas image plane ────────────────────────────────────────────────────────
function BodyAtlas() {
  const texture = useLoader(TextureLoader, '/human-body.webp')
  texture.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[IMG_W, IMG_H]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
    </mesh>
  )
}

// ─── Single hotspot ───────────────────────────────────────────────────────────
function Hotspot({ structure }: { structure: AnatomicalStructure }) {
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const store = useAnatomyStore()
  const {
    selectedStructure, highlightedStructures, tracedStructures,
    isolatedId, showLabels, transparencyMap,
    selectStructure, appMode,
    quizQuestion, checkQuizAnswer, addMessage, startQuiz,
    checkScenarioAnswer, currentScenario, setScenario, recordAttempt,
  } = store

  const isSelected    = selectedStructure?.id === structure.id
  const isHighlighted = highlightedStructures.has(structure.id)
  const isTraced      = tracedStructures.has(structure.id)
  const isActive      = isSelected || isHighlighted || isTraced

  // Use the computed visibility from the store — this is the single gate
  const isVisible = store.isStructureVisible(structure.id, structure.category)

  // Isolation dimming: if isolation is active and this is NOT the isolated structure,
  // show it as a faded ghost rather than hiding it entirely (prevents blank screen)
  const isIsolationTarget = isolatedId === structure.id
  const isDimmedByIsolation = isolatedId !== null && !isIsolationTarget

  // Transparency override
  const transparency = transparencyMap.get(structure.id) ?? 0

  // Ring pulse animation
  useFrame(({ clock }) => {
    if (!ringRef.current) return
    const mat = ringRef.current.material as THREE.MeshBasicMaterial
    const t = clock.elapsedTime
    if (!isVisible && !isDimmedByIsolation) {
      mat.opacity = 0
      return
    }
    const baseOpacity = isDimmedByIsolation ? 0.12 : (0.55 * (1 - transparency * 0.7))
    if (isTraced) {
      ringRef.current.scale.setScalar(1 + 0.22 * Math.sin(t * 4))
      mat.opacity = 0.7 + 0.3 * Math.sin(t * 4)
    } else if (isActive) {
      ringRef.current.scale.setScalar(1 + 0.08 * Math.sin(t * 2.5))
      mat.opacity = isDimmedByIsolation ? 0.9 : 0.9  // always bright if active
    } else if (hovered) {
      ringRef.current.scale.setScalar(1.15)
      mat.opacity = 0.85
    } else {
      ringRef.current.scale.setScalar(1)
      mat.opacity = Math.max(0.05, baseOpacity)
    }
  })

  // If not visible and not just dimmed, render nothing
  if (!isVisible && !isDimmedByIsolation) return null

  const pxCoord = HOTSPOT_PX[structure.id]
  if (!pxCoord) return null

  const pos      = imgPx(pxCoord[0], pxCoord[1])
  const color    = CAT_COLOR[structure.category] ?? '#ffffff'
  const opacMod  = isDimmedByIsolation ? 0.15 : (1 - transparency * 0.6)
  const dotSize  = (isActive ? 0.038 : hovered ? 0.034 : 0.026) * opacMod
  const ringSize = (isActive ? 0.072 : hovered ? 0.065 : 0.052) * opacMod

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()

    // In quiz mode, don't select — just answer
    if (appMode === 'quiz' && quizQuestion) {
      const result = checkQuizAnswer(structure.id)
      // Select so the card shows
      selectStructure(structure)
      if (result === 'correct') {
        addMessage({
          role: 'ai',
          content: `✅ Correct! That's the **${structure.name}**.\n\n${structure.description.slice(0, 120)}...`,
          structureId: structure.id,
        })
        setTimeout(() => startQuiz(), 2000)
      } else if (result === 'hint') {
        const q = useAnatomyStore.getState().quizQuestion
        const idx = (q?.attempts ?? 1) - 1
        addMessage({
          role: 'ai',
          content: `❌ Not quite. Hint ${idx + 1}: ${q?.hints[idx] ?? ''}\n\nAttempts left: ${(q?.maxAttempts ?? 3) - (q?.attempts ?? 0)}`,
        })
      } else {
        const q = useAnatomyStore.getState().quizQuestion
        const ans = ANATOMY_STRUCTURES.find(s => s.id === q?.structureId)
        addMessage({
          role: 'ai',
          content: `The answer was **${ans?.name}**. ${ans?.description.slice(0, 80)}... Next question!`,
          structureId: q?.structureId,
        })
        setTimeout(() => startQuiz(), 2500)
      }
      return
    }

    selectStructure(structure)

    if (appMode === 'clinical' && currentScenario) {
      if (checkScenarioAnswer(structure.id)) {
        addMessage({ role: 'ai', content: `🎯 **Correct!** ${currentScenario.explanation}`, structureId: structure.id })
        recordAttempt(structure.id, true)
        setScenario(null)
      } else {
        addMessage({ role: 'ai', content: `Not quite — re-read the clinical clues and try another structure.` })
        recordAttempt(structure.id, false)
      }
    }
  }, [structure, appMode, quizQuestion, currentScenario])

  const showPermanentLabel = showLabels && appMode !== 'quiz'
  const showHoverLabel     = (hovered || isActive) && appMode !== 'quiz'
  const shouldShowLabel    = showPermanentLabel || showHoverLabel

  return (
    <group position={pos}>
      <mesh
        ref={ringRef}
        onClick={handleClick}
        onPointerOver={e => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHovered(true) }}
        onPointerOut={() => { document.body.style.cursor = 'default'; setHovered(false) }}
      >
        <ringGeometry args={[ringSize * 0.7, ringSize, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      <mesh
        onClick={handleClick}
        onPointerOver={e => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHovered(true) }}
        onPointerOut={() => { document.body.style.cursor = 'default'; setHovered(false) }}
      >
        <circleGeometry args={[dotSize, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={(isActive ? 1.0 : 0.8) * opacMod}
          side={THREE.DoubleSide}
        />
      </mesh>

      {isActive && (
        <mesh>
          <circleGeometry args={[ringSize * 1.5, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.14 * opacMod} side={THREE.DoubleSide} />
        </mesh>
      )}

      {shouldShowLabel && !isDimmedByIsolation && (
        <Html
          position={[ringSize + 0.04, 0, 0]}
          style={{ pointerEvents: 'none' }}
          distanceFactor={6}
        >
          <div
            className={`
              flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
              whitespace-nowrap select-none border shadow-md transition-all duration-150 leading-tight
              ${isActive
                ? 'bg-cyan-500 text-white border-cyan-400/80 shadow-cyan-500/40'
                : (CAT_BADGE[structure.category] ?? 'bg-gray-800/90 text-white border-white/20')
              }
            `}
            style={{ transform: hovered && !isActive ? 'scale(1.08)' : undefined }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: isActive ? 'white' : color }} />
            {structure.name}
          </div>
        </Html>
      )}
    </group>
  )
}

// ─── Pathway trace ────────────────────────────────────────────────────────────
function PathwayTrace({ structure }: { structure: AnatomicalStructure }) {
  const { tracedStructures } = useAnatomyStore()
  if (!tracedStructures.has(structure.id)) return null

  const pxCoord = HOTSPOT_PX[structure.id]
  if (!pxCoord) return null

  const color = structure.category === 'nerve' ? '#ffe033'
    : (structure.color ?? '').startsWith('#2') ? '#5dade2' : '#ff4444'

  const endPos = imgPx(pxCoord[0], pxCoord[1], 0.06)
  const startY = Math.min(endPos[1] + 1.4, 2.4)
  const pts = [
    new THREE.Vector3(endPos[0], startY, 0.06),
    new THREE.Vector3(endPos[0], endPos[1], 0.06),
  ]

  return (
    <group>
      <Line points={pts} color={color} lineWidth={2.5} dashed dashSize={0.09} gapSize={0.05} />
      <TravelingDot
        start={new THREE.Vector3(endPos[0], startY, 0.06)}
        end={new THREE.Vector3(...endPos)}
        color={color}
      />
    </group>
  )
}

function TravelingDot({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.lerpVectors(start, end, Math.sin(clock.elapsedTime * 2) * 0.5 + 0.5)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.022, 8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

// ─── Camera controller ────────────────────────────────────────────────────────
// Single source of camera animation truth.
// focusStructure() → sets selectedStructure + cameraView → this controller fires.
// Region jump buttons → set cameraView only → this controller fires.
// Smooth lerp animation via useFrame — OrbitControls target kept in sync.
function CameraController() {
  const { cameraView, selectedStructure } = useAnatomyStore()
  const { camera } = useThree()

  const animating   = useRef(false)
  const animPos     = useRef(new THREE.Vector3())
  const animLookAt  = useRef(new THREE.Vector3())
  const controlsRef = useRef<any>(null)
  // Track last animated-to target to avoid redundant animations
  const lastAnimKey = useRef<string>('')

  const animateTo = useCallback((tx: number, ty: number, tz: number, lx = 0, ly = 0, key = '') => {
    if (key && key === lastAnimKey.current) return  // already animating to this target
    lastAnimKey.current = key
    animPos.current.set(tx, ty, tz)
    animLookAt.current.set(lx, ly, 0)
    animating.current = true
    console.info(`[Camera] animateTo ${key} pos=(${tx.toFixed(2)},${ty.toFixed(2)},${tz.toFixed(2)})`)
  }, [])

  // Single unified effect — fires whenever cameraView OR selectedStructure changes
  useEffect(() => {
    const view = cameraView
    if (!view) return

    const sel = selectedStructure

    // Pattern: "focus:structureId:timestamp" — always do a structure zoom
    if (view.startsWith('focus:') && sel) {
      const pxCoord = HOTSPOT_PX[sel.id]
      if (pxCoord) {
        const [hx, hy] = imgPx(pxCoord[0], pxCoord[1])
        const absX = Math.abs(hx)
        const absY = Math.abs(hy)
        const edgeFactor = Math.sqrt(absX * absX + absY * absY) / 2.7
        const targetZ = 3.0 + edgeFactor * 1.8
        const camX = hx * 0.28
        const camY = hy * 0.28
        console.info(`[Camera] focus trigger: ${sel.id} → cam=(${camX.toFixed(2)},${camY.toFixed(2)},${targetZ.toFixed(2)})`)
        animateTo(camX, camY, targetZ, hx * 0.12, hy * 0.12, view)
        return
      }
    }

    // Named region presets (Jump To Region, fullReset, etc.)
    // Skip sentinel values
    if (view === '__force_reset__' || view.startsWith('focus:')) return

    const v = REGION_CAMERA[view] ?? REGION_CAMERA.anterior
    console.info(`[Camera] region jump: ${view} → (${v.x},${v.y},${v.z})`)
    animateTo(v.x, v.y, v.z, v.x * 0.1, v.y * 0.1, `view:${view}`)
  }, [cameraView, selectedStructure?.id, animateTo])  // eslint-disable-line

  // Per-frame lerp animation
  useFrame(() => {
    if (!animating.current) return

    camera.position.lerp(animPos.current, 0.10)
    camera.lookAt(animLookAt.current)

    if (controlsRef.current) {
      controlsRef.current.target.lerp(animLookAt.current, 0.10)
    }

    if (camera.position.distanceTo(animPos.current) < 0.008) {
      camera.position.copy(animPos.current)
      camera.lookAt(animLookAt.current)
      if (controlsRef.current) {
        controlsRef.current.target.copy(animLookAt.current)
        controlsRef.current.update()
      }
      animating.current = false
      console.info('[Camera] animation complete')
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate={false}
      mouseButtons={{
        LEFT:   THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT:  THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      minDistance={2}
      maxDistance={14}
      dampingFactor={0.08}
      enableDamping
      screenSpacePanning
      panSpeed={1.4}
      zoomSpeed={1.1}
    />
  )
}

// ─── Scene safety overlay — shown when no structures are visible ──────────────
function EmergencyRestoreOverlay() {
  const { hasVisibleStructures, fullReset } = useAnatomyStore()

  // Check periodically
  const [isBlank, setIsBlank] = useState(false)
  const checkTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    checkTimer.current = setInterval(() => {
      const visible = hasVisibleStructures()
      setIsBlank(!visible)
      if (!visible) {
        console.warn('[Scene] No visible structures detected!')
      }
    }, 1000)
    return () => { if (checkTimer.current) clearInterval(checkTimer.current) }
  }, [hasVisibleStructures])

  if (!isBlank) return null

  return (
    <Html center>
      <div className="bg-gray-900/95 border border-red-500/40 rounded-2xl px-6 py-4 text-center shadow-2xl">
        <p className="text-red-400 text-sm font-semibold mb-2">⚠️ Anatomy model not visible</p>
        <p className="text-gray-400 text-xs mb-3">The viewer has no visible structures.</p>
        <button
          onClick={fullReset}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Restore Anatomy
        </button>
      </div>
    </Html>
  )
}

// ─── Lighting ─────────────────────────────────────────────────────────────────
function Lighting() {
  return (
    <>
      <ambientLight intensity={1.3} />
      <directionalLight position={[0, 0, 5]} intensity={0.4} />
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function AnatomyScene() {
  const { selectStructure } = useAnatomyStore()

  // Expose focusStructure globally for developer testing (Test D in requirements)
  useEffect(() => {
    ;(window as any).focusStructure = (id: string) => {
      console.info(`[Dev] focusStructure("${id}")`)
      useAnatomyStore.getState().focusStructure(id)
    }
    ;(window as any).anatomyStore = () => useAnatomyStore.getState()
    console.info('[AnatomyAI] Dev tools ready: focusStructure("skull"), focusStructure("heart"), etc.')
    return () => {
      delete (window as any).focusStructure
      delete (window as any).anatomyStore
    }
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 44, near: 0.01, far: 100 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0a0e1a' }}
      onPointerMissed={() => selectStructure(null)}
    >
      <Lighting />
      <BodyAtlas />

      {ANATOMY_STRUCTURES.map(s => (
        <Hotspot key={s.id} structure={s} />
      ))}
      {ANATOMY_STRUCTURES.map(s => (
        <PathwayTrace key={`trace-${s.id}`} structure={s} />
      ))}

      <CameraController />
      <EmergencyRestoreOverlay />
    </Canvas>
  )
}
