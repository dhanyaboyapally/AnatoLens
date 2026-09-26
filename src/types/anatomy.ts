export type StructureCategory = 'bone' | 'muscle' | 'nerve' | 'vessel' | 'organ' | 'ligament' | 'tendon' | 'skin'

export type BodyRegion =
  | 'head' | 'neck' | 'shoulder'
  | 'arm' | 'elbow' | 'forearm' | 'wrist' | 'hand'
  | 'thorax' | 'abdomen' | 'pelvis'
  | 'thigh' | 'knee' | 'leg' | 'foot'
  | 'spine' | 'full_body'

export interface AnatomicalStructure {
  id: string
  name: string
  latinName: string
  category: StructureCategory
  region: BodyRegion
  description: string
  function: string
  clinicalNote: string
  relatedStructures: string[]
  origin?: string
  insertion?: string
  innervation?: string
  bloodSupply?: string
  pathwayPoints?: [number, number, number][]
  position: [number, number, number]
  scale: [number, number, number]
  rotation: [number, number, number]
  color: string
  highlightColor: string
  layer: number   // 0=skin, 1=superficial, 2=intermediate, 3=deep
  aliases: string[]
}

export interface AIAction {
  type: 'focus' | 'rotate' | 'hide' | 'show' | 'highlight' | 'trace' | 'isolate' | 'reset' | 'zoom' | 'label'
  target?: string
  targets?: string[]
  view?: string
  duration?: number
  intensity?: number
}

export interface AIResponse {
  explanation: string
  actions: AIAction[]
  mode?: 'explain' | 'quiz' | 'teach' | 'clinical'
  followUp?: string[]
}

export interface QuizQuestion {
  structureId: string
  hints: string[]
  attempts: number
  maxAttempts: number
}

export interface ClinicalScenario {
  id: string
  title: string
  presentation: string
  question: string
  targetStructureId: string
  explanation: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface TeachLesson {
  id: string
  title: string
  region: BodyRegion
  steps: TeachStep[]
}

export interface TeachStep {
  structureId: string
  narration: string
  actions: AIAction[]
  duration: number
}

export interface ProgressEntry {
  structureId: string
  attempts: number
  correct: number
  lastSeen: number
  mastered: boolean
}
