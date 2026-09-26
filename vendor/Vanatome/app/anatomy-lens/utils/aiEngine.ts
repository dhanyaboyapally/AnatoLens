import type { AIResponse, AIAction, AnatomicalStructure } from '../types/anatomy'
import { ANATOMY_STRUCTURES, STRUCTURE_MAP, findStructureByQuery } from '../data/anatomyData'

// â”€â”€â”€ Synonym/alias resolver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SYNONYMS: Record<string, string> = {
  // Bones
  'cranium': 'skull', 'skull bone': 'skull', 'calvaria': 'skull',
  'shin bone': 'tibia', 'shin': 'tibia', 'kneecap': 'skull',
  'thigh bone': 'femur', 'collar bone': 'clavicle', 'breast bone': 'sternum',
  'breastbone': 'sternum', 'funny bone': 'ulnar_nerve',
  // Muscles
  'bicep': 'biceps_brachii', 'tricep': 'triceps_brachii',
  'pecs': 'pectoralis_major', 'chest muscle': 'pectoralis_major',
  'quads': 'quadriceps', 'quad': 'quadriceps',
  'hamstring': 'hamstrings', 'calf': 'gastrocnemius',
  'abs': 'abdominal_muscles', 'core': 'abdominal_muscles',
  // Nerves
  'carpal tunnel nerve': 'median_nerve', 'thenar nerve': 'median_nerve',
  'wrist drop nerve': 'radial_nerve', 'claw hand nerve': 'ulnar_nerve',
  'sciatica nerve': 'sciatic_nerve', 'sciatic': 'sciatic_nerve',
  // Vessels
  'wrist pulse': 'radial_artery', 'radial pulse': 'radial_artery',
  'femoral pulse': 'femoral_artery', 'main artery': 'aorta',
  // Organs
  'tummy': 'stomach', 'belly': 'stomach', 'gut': 'small_intestine',
  'bowel': 'large_intestine', 'colon': 'large_intestine',
}

// â”€â”€â”€ Intent classifier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Intent =
  | 'show_structure' | 'trace_structure' | 'explain_structure' | 'what_is_this'
  | 'what_next_to'   | 'blood_supply'    | 'innervation'
  | 'hide_structure' | 'show_hidden'     | 'isolate_structure'
  | 'make_transparent' | 'reset_transparency'
  | 'reset_view'     | 'compare_structures' | 'clinical_significance'
  | 'jump_region'
  | 'unknown'

function classifyIntent(message: string): Intent {
  const m = message.toLowerCase()
  if (/trace|follow|pathway|track|travel|course of/.test(m))    return 'trace_structure'
  if (/transparent|translucent|see.?through|opacity|fade/.test(m)) return 'make_transparent'
  if (/show|find|navigate|go to|where is|locate|display|focus/.test(m)) return 'show_structure'
  if (/what is this|identify|name this/.test(m))                 return 'what_is_this'
  if (/next to|adjacent|beside|near|neighbor|relations|beside/.test(m)) return 'what_next_to'
  if (/blood supply|artery|arteries|vascular/.test(m))           return 'blood_supply'
  if (/innervat|nerve supply|motor to|sensory to/.test(m))       return 'innervation'
  if (/\bhide\b|remove from view|invisible|turn off/.test(m))    return 'hide_structure'
  if (/show again|restore|bring back|unhide/.test(m))            return 'show_hidden'
  if (/isolat|only show|focus only|alone/.test(m))               return 'isolate_structure'
  if (/reset|restore all|show all|undo|clear|back to normal/.test(m)) return 'reset_view'
  if (/compar|difference|versus|vs\./.test(m))                   return 'compare_structures'
  if (/clinical|injur|fracture|damage|compress|syndrome|palsy/.test(m)) return 'clinical_significance'
  if (/explain|what does|function|purpose|why|tell me about/.test(m)) return 'explain_structure'
  if (/jump to|go to region|region|view head|view chest|view abdomen|view pelvis|view arm|view leg/.test(m)) return 'jump_region'
  return 'unknown'
}

// â”€â”€â”€ Structure name extractor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function resolveStructure(
  message: string,
  selected: AnatomicalStructure | null,
  lastContextId: string | null,
): AnatomicalStructure | undefined {
  const m = message.toLowerCase()

  // Pronoun resolution: "it", "this", "that structure" â†’ last known structure
  if (/\bit\b|\bthis\b|\bthat structure\b|\bthe structure\b/.test(m)) {
    const contextId = lastContextId ?? selected?.id
    if (contextId) return STRUCTURE_MAP.get(contextId)
  }

  // Strip command verbs
  const cleaned = m
    .replace(/show me the |show me |trace the |trace |find the |find |where is the |where is |navigate to |navigate |highlight the |highlight |explain the |explain |hide the |hide |isolate the |isolate |make the |make |what is the |what is /g, '')
    .trim()

  // Check synonym map first
  for (const [syn, targetId] of Object.entries(SYNONYMS)) {
    if (cleaned.includes(syn)) {
      const s = STRUCTURE_MAP.get(targetId)
      if (s) return s
    }
  }

  // Direct name / alias / id match across all structures
  const direct = ANATOMY_STRUCTURES.find(s =>
    cleaned.includes(s.name.toLowerCase()) ||
    cleaned.includes(s.id.replace(/_/g, ' ')) ||
    s.aliases.some(a => cleaned.includes(a.toLowerCase()))
  )
  if (direct) return direct

  // Fuzzy fallback
  return findStructureByQuery(cleaned) ?? undefined
}

// â”€â”€â”€ Region name â†’ camera view key â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// This is a LOCAL lookup for text parsing (e.g. "go to head") â€” separate from
// REGION_CAMERA in the controller which is the definitive camera position table.
const REGION_TO_CAMERA_TEXT: Record<string, string> = {
  head: 'head', neck: 'neck', skull: 'head', brain: 'head', face: 'head',
  thorax: 'thorax', chest: 'thorax',
  abdomen: 'abdomen', belly: 'abdomen',
  pelvis: 'pelvis', hip: 'pelvis',
  arm: 'arm', shoulder: 'shoulder',
  forearm: 'forearm', elbow: 'elbow',
  wrist: 'wrist', hand: 'hand',
  thigh: 'thigh', leg: 'leg', knee: 'knee', foot: 'foot',
  spine: 'spine', back: 'spine',
}

// Per-region camera key based on structure.region field â€” mirrors REGION_CAMERA keys
const STRUCTURE_REGION_TO_CAMERA: Record<string, string> = {
  head: 'head', neck: 'neck', shoulder: 'shoulder',
  arm: 'arm', elbow: 'elbow', forearm: 'forearm', wrist: 'wrist', hand: 'hand',
  thorax: 'thorax', abdomen: 'abdomen', pelvis: 'pelvis',
  thigh: 'thigh', knee: 'knee', leg: 'leg', foot: 'foot',
  spine: 'spine', full_body: 'anterior',
}

// â”€â”€â”€ Main response generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function generateAIResponse(
  message: string,
  selectedStructure: AnatomicalStructure | null,
  context?: { mode?: string; lastStructureId?: string | null },
): AIResponse {
  const intent        = classifyIntent(message)
  const lastCtxId     = context?.lastStructureId ?? selectedStructure?.id ?? null
  const target        = resolveStructure(message, selectedStructure, lastCtxId)

  switch (intent) {
    case 'show_structure':      return handleShow(target, message)
    case 'trace_structure':     return handleTrace(target)
    case 'explain_structure':
    case 'what_is_this':        return handleExplain(target, selectedStructure)
    case 'what_next_to':        return handleRelations(target ?? selectedStructure ?? undefined)
    case 'blood_supply':        return handleBloodSupply(target ?? selectedStructure ?? undefined)
    case 'innervation':         return handleInnervation(target ?? selectedStructure ?? undefined)
    case 'hide_structure':      return handleHide(target ?? selectedStructure ?? undefined)
    case 'show_hidden':         return handleShowHidden(target ?? selectedStructure ?? undefined)
    case 'isolate_structure':   return handleIsolate(target ?? selectedStructure ?? undefined)
    case 'make_transparent':    return handleTransparent(target ?? selectedStructure ?? undefined, message)
    case 'reset_transparency':  return handleResetTransparency(target ?? selectedStructure ?? undefined)
    case 'reset_view':          return handleReset()
    case 'clinical_significance': return handleClinical(target ?? selectedStructure ?? undefined)
    case 'compare_structures':  return handleCompare(message)
    case 'jump_region':         return handleJumpRegion(message)
    default:                    return handleGeneral(message, selectedStructure, target)
  }
}

// â”€â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function handleShow(structure: AnatomicalStructure | undefined, _msg: string): AIResponse {
  if (!structure) {
    return {
      explanation: `I couldn't find that structure in the current model. Try: "Show me the skull", "Show me the heart", "Show me the femur", or click any dot on the body.`,
      actions: [],
      followUp: ['Show me the skull', 'Show me the heart', 'Show me the femur', 'Show me the aorta'],
    }
  }

  const emoji: Record<string, string> = {
    bone: 'ðŸ¦´', muscle: 'ðŸ’ª', nerve: 'âš¡', vessel: 'ðŸ©¸', organ: 'â¤ï¸', ligament: 'ðŸ”—',
  }

  // Map structure region â†’ camera view so every region works
  const cameraKey = STRUCTURE_REGION_TO_CAMERA[structure.region] ?? 'anterior'

  const actions: AIAction[] = [
    { type: 'reset' },
    { type: 'rotate', view: cameraKey },
    { type: 'focus', target: structure.id },
    { type: 'highlight', target: structure.id },
  ]

  return {
    explanation: `${emoji[structure.category] ?? 'ðŸ“'} **${structure.name}** (${structure.latinName})\n\n${structure.description}\n\n**Function:** ${structure.function}`,
    actions,
    followUp: [
      `What runs next to the ${structure.name.toLowerCase()}?`,
      `Trace the ${structure.name.toLowerCase()}`,
      `Clinical significance of the ${structure.name.toLowerCase()}`,
      `Make the ${structure.name.toLowerCase()} transparent`,
    ],
  }
}

function handleTrace(structure: AnatomicalStructure | undefined): AIResponse {
  if (!structure) {
    return {
      explanation: `Tell me which structure to trace, e.g. "Trace the median nerve" or "Trace the aorta".`,
      actions: [],
      followUp: ['Trace the median nerve', 'Trace the aorta', 'Trace the sciatic nerve'],
    }
  }

  const courses: Record<string, string> = {
    median_nerve:    'The median nerve descends the anterior forearm, passes through the carpal tunnel under the flexor retinaculum, and supplies the lateral 3Â½ fingers and thenar muscles.',
    ulnar_nerve:     'The ulnar nerve passes behind the medial epicondyle ("funny bone"), descends medially, and enters the hand via Guyon\'s canal to supply the intrinsic muscles.',
    radial_nerve:    'The radial nerve winds around the posterior humerus in the radial groove, then divides into superficial sensory and deep motor (PIN) branches in the forearm.',
    aorta:           'The aorta arises from the left ventricle, arches over the heart, descends through the thorax and abdomen, and bifurcates into the iliac arteries at L4.',
    sciatic_nerve:   'The sciatic nerve exits the pelvis through the greater sciatic foramen, passes deep to gluteus maximus, descends the posterior thigh, and divides into tibial and common peroneal nerves at the popliteal fossa.',
    femoral_artery:  'The femoral artery enters the thigh below the inguinal ligament, passes through the femoral triangle and adductor canal, and continues as the popliteal artery.',
    brachial_artery: 'The brachial artery descends medially in the arm alongside the median nerve, becoming the most prominent pulse in the cubital fossa where it bifurcates.',
    spinal_cord:     'The spinal cord extends from the medulla oblongata to the conus medullaris at L1/L2, with the cauda equina continuing below.',
  }

  const description = courses[structure.id] ??
    `${structure.name} travels from its origin (${structure.origin ?? 'proximal attachment'}) to its insertion (${structure.insertion ?? 'distal attachment'}).`

  const cameraKey = STRUCTURE_REGION_TO_CAMERA[structure.region] ?? 'anterior'

  return {
    explanation: `**Tracing ${structure.name}** âš¡\n\n${description}`,
    actions: [
      { type: 'reset' },
      { type: 'rotate', view: cameraKey },
      { type: 'focus', target: structure.id },
      { type: 'highlight', target: structure.id },
      { type: 'trace', target: structure.id },
    ],
    followUp: [
      `What does ${structure.name.toLowerCase()} supply?`,
      `Clinical significance of ${structure.name.toLowerCase()}`,
      `What runs next to it?`,
    ],
  }
}

function handleExplain(
  structure: AnatomicalStructure | undefined,
  selected: AnatomicalStructure | null,
): AIResponse {
  const t = structure ?? selected
  if (!t) {
    return {
      explanation: `Click any dot on the body to select a structure, then ask me anything about it.`,
      actions: [],
      followUp: ['Show me the skull', 'Show me the heart', 'Show me the median nerve'],
    }
  }

  const cameraKey = STRUCTURE_REGION_TO_CAMERA[t.region] ?? 'anterior'

  return {
    explanation: [
      `**${t.name}** (${t.latinName})`,
      t.description,
      `**Function:** ${t.function}`,
      t.origin      ? `**Origin:** ${t.origin}`          : '',
      t.insertion   ? `**Insertion:** ${t.insertion}`    : '',
      t.innervation ? `**Innervation:** ${t.innervation}` : '',
      t.bloodSupply ? `**Blood supply:** ${t.bloodSupply}` : '',
    ].filter(Boolean).join('\n\n'),
    actions: [
      { type: 'rotate', view: cameraKey },
      { type: 'focus', target: t.id },
      { type: 'highlight', target: t.id },
    ],
    followUp: [
      `Clinical significance of the ${t.name.toLowerCase()}`,
      `What runs next to the ${t.name.toLowerCase()}?`,
      `Make the ${t.name.toLowerCase()} transparent`,
    ],
  }
}

function handleRelations(structure: AnatomicalStructure | undefined): AIResponse {
  if (!structure) {
    return { explanation: `Select a structure first, then ask "What runs next to it?"`, actions: [], followUp: [] }
  }

  const related = structure.relatedStructures
    .map(id => STRUCTURE_MAP.get(id))
    .filter(Boolean) as AnatomicalStructure[]

  const list = related.length
    ? related.map(r => `â€¢ **${r.name}** (${r.category})`).join('\n')
    : 'No recorded relations in the current model.'

  return {
    explanation: `**Adjacent to ${structure.name}:**\n\n${list}`,
    actions: [
      { type: 'focus', target: structure.id },
      { type: 'highlight', target: structure.id },
      ...related.map(r => ({ type: 'highlight' as const, target: r.id })),
    ],
    followUp: related.slice(0, 2).map(r => `Tell me about the ${r.name.toLowerCase()}`),
  }
}

function handleBloodSupply(structure: AnatomicalStructure | undefined): AIResponse {
  if (!structure) {
    return { explanation: `Select a structure first to see its blood supply.`, actions: [], followUp: [] }
  }
  const supply = findStructureByQuery(structure.bloodSupply ?? '')
  return {
    explanation: structure.bloodSupply
      ? `**Blood supply of ${structure.name}:** ${structure.bloodSupply}`
      : `No blood supply data for ${structure.name} in the current model.`,
    actions: [
      { type: 'highlight', target: structure.id },
      ...(supply ? [{ type: 'highlight' as const, target: supply.id }] : []),
    ],
    followUp: supply ? [`Show me the ${supply.name.toLowerCase()}`] : [],
  }
}

function handleInnervation(structure: AnatomicalStructure | undefined): AIResponse {
  if (!structure) {
    return { explanation: `Select a muscle first to see its innervation.`, actions: [], followUp: [] }
  }
  const nerveId = structure.innervation?.includes('median')  ? 'median_nerve'
    : structure.innervation?.includes('ulnar')   ? 'ulnar_nerve'
    : structure.innervation?.includes('radial')  ? 'radial_nerve'
    : structure.innervation?.includes('sciatic') ? 'sciatic_nerve'
    : structure.innervation?.includes('femoral') ? 'femoral_artery'
    : null

  return {
    explanation: structure.innervation
      ? `**Innervation of ${structure.name}:** ${structure.innervation}`
      : `No innervation data for ${structure.name} in the current model.`,
    actions: [
      { type: 'highlight', target: structure.id },
      ...(nerveId ? [{ type: 'highlight' as const, target: nerveId }] : []),
    ],
    followUp: nerveId ? [`Trace the ${nerveId.replace(/_/g, ' ')}`] : [],
  }
}

function handleHide(structure: AnatomicalStructure | undefined): AIResponse {
  if (!structure) {
    return {
      explanation: `Tell me which structure to hide, e.g. "Hide the skin" or "Hide the ribs". Or use the layer toggles on the left panel.`,
      actions: [],
      followUp: ['Hide the skin', 'Hide the muscles', 'Hide the ribs'],
    }
  }
  return {
    explanation: `Hiding **${structure.name}** so you can see the structures beneath it.\n\nSay "Show the ${structure.name.toLowerCase()} again" or press **Reset** to restore it.`,
    actions: [{ type: 'hide', target: structure.id }],
    followUp: [`Show the ${structure.name.toLowerCase()} again`, `What's beneath the ${structure.name.toLowerCase()}?`, 'Reset view'],
  }
}

function handleShowHidden(structure: AnatomicalStructure | undefined): AIResponse {
  if (!structure) {
    return {
      explanation: `Restoring all hidden structures to visible.`,
      actions: [{ type: 'reset' }],
      followUp: [],
    }
  }
  return {
    explanation: `Showing **${structure.name}** again.`,
    actions: [{ type: 'show', target: structure.id }],
    followUp: [],
  }
}

function handleIsolate(structure: AnatomicalStructure | undefined): AIResponse {
  if (!structure) {
    return {
      explanation: `Tell me which structure to isolate, e.g. "Isolate the median nerve".`,
      actions: [],
      followUp: ['Isolate the median nerve', 'Isolate the heart', 'Isolate the sciatic nerve'],
    }
  }
  return {
    explanation: `Isolating **${structure.name}** â€” all other structures are hidden so you can study it clearly.\n\nSay "Reset view" to restore everything.`,
    actions: [{ type: 'isolate', target: structure.id }],
    followUp: [`Trace the ${structure.name.toLowerCase()}`, 'Reset view'],
  }
}

function handleTransparent(structure: AnatomicalStructure | undefined, message: string): AIResponse {
  if (!structure) {
    return {
      explanation: `Tell me which structure to make transparent, e.g. "Make the skull transparent" or "Make the skin see-through".`,
      actions: [],
      followUp: ['Make the skull transparent', 'Make the skin transparent', 'Make the ribs transparent'],
    }
  }

  // Parse opacity level from message
  let opacity = 0.6  // default semi-transparent
  if (/fully|completely|100/.test(message.toLowerCase())) opacity = 0.95
  else if (/slightly|little|25/.test(message.toLowerCase())) opacity = 0.25
  else if (/half|50/.test(message.toLowerCase())) opacity = 0.5

  return {
    explanation: `Making **${structure.name}** transparent so you can see through it to the structures beneath.`,
    actions: [{ type: 'focus', target: structure.id }, { type: 'highlight', target: structure.id }],
    // Transparency is handled by the controller via the transparencyMap, not an AIAction type.
    // We communicate via the structureId in the response and handle in AIChatPanel.
    _transparencyTarget: structure.id,
    _transparencyValue: opacity,
    followUp: [
      `Reset ${structure.name.toLowerCase()} opacity`,
      `Show what's inside the ${structure.name.toLowerCase()}`,
      'Reset view',
    ],
  } as any
}

function handleResetTransparency(structure: AnatomicalStructure | undefined): AIResponse {
  if (!structure) {
    return {
      explanation: `Resetting transparency for all structures.`,
      actions: [{ type: 'reset' }],
      followUp: [],
    }
  }
  return {
    explanation: `Restoring **${structure.name}** to fully opaque.`,
    actions: [],
    _clearTransparencyTarget: structure.id,
    followUp: [],
  } as any
}

function handleReset(): AIResponse {
  return {
    explanation: `Resetting the anatomy model â€” all structures restored, highlights cleared, camera back to full-body view.`,
    actions: [{ type: 'reset' }, { type: 'rotate', view: 'anterior' }],
    followUp: ['Show me the skull', 'Show me the heart', 'Quiz me'],
  }
}

function handleClinical(structure: AnatomicalStructure | undefined): AIResponse {
  if (!structure) {
    return {
      explanation: `Select a structure first for its clinical notes.`,
      actions: [],
      followUp: ['Clinical significance of median nerve', 'Clinical significance of femur'],
    }
  }
  const cameraKey = STRUCTURE_REGION_TO_CAMERA[structure.region] ?? 'anterior'
  return {
    explanation: `**Clinical note â€” ${structure.name}:**\n\n${structure.clinicalNote}`,
    actions: [
      { type: 'rotate', view: cameraKey },
      { type: 'focus', target: structure.id },
      { type: 'highlight', target: structure.id },
    ],
    followUp: [`What runs next to the ${structure.name.toLowerCase()}?`, 'Start a clinical challenge'],
  }
}

function handleCompare(message: string): AIResponse {
  const found = ANATOMY_STRUCTURES.filter(s =>
    message.toLowerCase().includes(s.name.toLowerCase()) ||
    s.aliases.some(a => message.toLowerCase().includes(a.toLowerCase()))
  ).slice(0, 2)

  if (found.length < 2) {
    return {
      explanation: `Mention both structures by name to compare them, e.g. "Compare the median nerve and ulnar nerve".`,
      actions: [],
      followUp: ['Compare median nerve and ulnar nerve', 'Compare radius and ulna'],
    }
  }
  const [a, b] = found
  return {
    explanation: `**${a.name} vs ${b.name}**\n\n**${a.name}:** ${a.description}\n\n**${b.name}:** ${b.description}`,
    actions: [
      { type: 'highlight', target: a.id },
      { type: 'highlight', target: b.id },
    ],
    followUp: [],
  }
}

function handleJumpRegion(message: string): AIResponse {
  const m = message.toLowerCase()
  for (const [keyword, view] of Object.entries(REGION_TO_CAMERA_TEXT)) {
    if (m.includes(keyword)) {
      return {
        explanation: `Navigating to the **${keyword}** region.`,
        actions: [{ type: 'rotate', view }],
        followUp: [],
      }
    }
  }
  return {
    explanation: `Available regions: Head, Neck, Chest/Thorax, Abdomen, Pelvis, Arm, Forearm, Leg. Try "Jump to head" or "View the chest".`,
    actions: [],
    followUp: ['Jump to head', 'View chest', 'View abdomen', 'View arm'],
  }
}

function handleGeneral(
  _message: string,
  selected: AnatomicalStructure | null,
  found: AnatomicalStructure | undefined,
): AIResponse {
  const target = found ?? selected
  if (target) return handleExplain(target, selected)

  return {
    explanation: `I'm AnatomyAI â€” spatially connected to the body on screen.\n\nâ€¢ **"Show me the skull"** â†’ camera navigates, skull highlights\nâ€¢ **"Trace the aorta"** â†’ animated pathway trace\nâ€¢ **"Make the ribs transparent"** â†’ see-through view\nâ€¢ **"Hide the muscles"** â†’ reveal deeper structures\nâ€¢ **"Isolate the heart"** â†’ study it alone\nâ€¢ **"What runs next to it?"** â†’ highlight neighbours\nâ€¢ **"Clinical significance"** â†’ medical context\n\nOr click any dot on the body to select a structure.`,
    actions: [],
    followUp: ['Show me the skull', 'Show me the heart', 'Trace the aorta', 'Show me the sciatic nerve'],
  }
}


