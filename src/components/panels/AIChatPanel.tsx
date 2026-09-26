import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Brain, Sparkles, Mic, MicOff,
  Zap, BookOpen, Stethoscope, HelpCircle,
} from 'lucide-react'
import { useAnatomyStore } from '../../store/anatomyStore'
import { generateAIResponse } from '../../utils/aiEngine'
import { executeAIActions } from '../../utils/anatomy3DController'
import { TEACH_LESSONS, CLINICAL_SCENARIOS } from '../../data/anatomyData'

const QUICK_ACTIONS = [
  { label: 'Show median nerve', icon: Zap, color: 'text-yellow-400' },
  { label: 'Trace ulnar nerve', icon: Zap, color: 'text-yellow-400' },
  { label: 'Teach me carpal tunnel', icon: BookOpen, color: 'text-blue-400' },
  { label: 'Start clinical challenge', icon: Stethoscope, color: 'text-green-400' },
  { label: 'Quiz me', icon: HelpCircle, color: 'text-purple-400' },
  { label: 'Explain the radius', icon: Brain, color: 'text-cyan-400' },
]

function MarkdownText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

function MessageBubble({ message }: { message: any }) {
  const isAI = message.role === 'ai'
  const lines = message.content.split('\n').filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 ${isAI ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
        ${isAI
          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
          : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
        }
      `}>
        {isAI ? <Brain size={14} /> : 'S'}
      </div>

      {/* Bubble */}
      <div className={`
        max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed
        ${isAI
          ? 'bg-gray-800/80 border border-white/8 text-gray-200 rounded-tl-sm'
          : 'bg-gradient-to-br from-cyan-600/30 to-blue-600/20 border border-cyan-500/25 text-gray-100 rounded-tr-sm'
        }
      `}>
        {lines.map((line: string, i: number) => {
          if (line.startsWith('• ')) {
            return (
              <div key={i} className="flex gap-1.5 mt-1">
                <span className="text-cyan-400 mt-0.5 flex-shrink-0">•</span>
                <span className="text-gray-300 text-xs"><MarkdownText text={line.slice(2)} /></span>
              </div>
            )
          }
          return (
            <p key={i} className={`${i > 0 ? 'mt-1.5' : ''} text-xs leading-relaxed`}>
              <MarkdownText text={line} />
            </p>
          )
        })}
      </div>
    </motion.div>
  )
}

function FollowUpChips({ items, onSelect }: { items: string[]; onSelect: (s: string) => void }) {
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2 px-1">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onSelect(item)}
          className="px-2.5 py-1 rounded-full text-xs bg-cyan-500/10 border border-cyan-500/25
            text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/40 transition-all duration-150
            hover:scale-105 active:scale-95"
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function AIChatPanel() {
  const [input, setInput] = useState('')
  const [lastFollowUps, setLastFollowUps] = useState<string[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isExpanded] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    chatMessages, addMessage, isAIThinking, setAIThinking,
    selectedStructure, setAppMode, appMode,
    startQuiz, setLesson, setScenario,
    isListening, setListening,
  } = useAnatomyStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isAIThinking])

  // Consume voice commands posted by TopBar and route through handleSend
  useEffect(() => {
    const unsub = useAnatomyStore.subscribe(state => {
      if (state.pendingVoiceCommand) {
        const cmd = state.consumePendingVoiceCommand()
        if (cmd) handleSend(cmd)
      }
    })
    return unsub
  }, []) // handleSend is stable because of useCallback

  // Initial greeting
  useEffect(() => {
    if (chatMessages.length === 0) {
      addMessage({
        role: 'ai',
        content: `Welcome to **AnatomyAI** 👋\n\nI'm spatially connected to the 3D model on screen. Click any structure to select it, then ask me anything.\n\nTry: "Show me the median nerve" or "Trace the radial artery"`,
      })
      setLastFollowUps([
        'Show me the median nerve',
        'Trace the ulnar nerve',
        'Teach me about the carpal tunnel',
        'Start a clinical challenge',
      ])
    }
  }, [])

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    setLastFollowUps([])

    addMessage({ role: 'user', content: msg })
    setAIThinking(true)

    const lower = msg.toLowerCase()

    // ── Special routing ───────────────────────────────────────────────────────
    if (/quiz me|start quiz|test me/.test(lower)) {
      setTimeout(() => {
        setAIThinking(false)
        setAppMode('quiz')
        startQuiz()
        addMessage({ role: 'ai', content: `🧠 **Quiz Mode Activated!**\n\nLabels are hidden. Click the structure on the 3D model that matches the hints.` })
        const currentQ = useAnatomyStore.getState().quizQuestion
        if (currentQ) {
          addMessage({ role: 'ai', content: `**Identify this structure:**\n\n💡 ${currentQ.hints[0]}\n\nClick on the body when ready!` })
        }
      }, 700)
      return
    }

    if (/teach me|lesson|guided|walk me through/.test(lower)) {
      const lessonMatch = TEACH_LESSONS.find(l =>
        lower.includes(l.title.toLowerCase()) ||
        lower.includes(l.region) ||
        (lower.includes('carpal') && l.id.includes('carpal')) ||
        (lower.includes('nerve') && l.id.includes('nerve')) ||
        (lower.includes('cardiovascular') && l.id.includes('cardiovascular'))
      ) ?? TEACH_LESSONS[0]

      setTimeout(() => {
        setAIThinking(false)
        setAppMode('teach')
        setLesson(lessonMatch)
        const firstStep = lessonMatch.steps[0]
        executeAIActions(firstStep.actions)
        addMessage({
          role: 'ai',
          content: `📚 **Lesson: ${lessonMatch.title}**\n\n${firstStep.narration}\n\n*Use the Next button to progress.*`,
          actions: firstStep.actions,
        })
        setLastFollowUps(['Continue lesson', 'Stop lesson', 'Quiz me after'])
      }, 700)
      return
    }

    if (/clinical|scenario|case|patient|challenge/.test(lower)) {
      const scenario = CLINICAL_SCENARIOS[Math.floor(Math.random() * CLINICAL_SCENARIOS.length)]
      setTimeout(() => {
        setAIThinking(false)
        setAppMode('clinical')
        setScenario(scenario)
        addMessage({
          role: 'ai',
          content: `🏥 **Clinical Challenge: ${scenario.title}**\n\n${scenario.presentation}\n\n**Question:** ${scenario.question}\n\n*Click the relevant structure on the body.*`,
        })
        setLastFollowUps(['Give me a hint', 'Try a different case', 'Exit clinical mode'])
      }, 800)
      return
    }

    // ── Normal AI response ────────────────────────────────────────────────────
    await new Promise(r => setTimeout(r, 500 + Math.random() * 350))

    // Pass conversation context for pronoun resolution
    const lastCtxId = useAnatomyStore.getState().conversationContext.lastStructureId
    const response  = generateAIResponse(msg, selectedStructure, { mode: appMode, lastStructureId: lastCtxId })
    setAIThinking(false)

    addMessage({
      role: 'ai',
      content: response.explanation,
      actions: response.actions,
      structureId: selectedStructure?.id,
    })

    // Execute 3D actions SYNCHRONOUSLY via the controller (not the async store shim)
    if (response.actions.length > 0) {
      console.info('[AIChatPanel] executing actions:', response.actions.map(a => `${a.type}:${a.target ?? a.view}`))
      executeAIActions(response.actions)
    }

    // Handle transparency (extended action not in AIAction type)
    const resp = response as any
    if (resp._transparencyTarget) {
      useAnatomyStore.getState().setStructureTransparency(resp._transparencyTarget, resp._transparencyValue ?? 0.6)
    }
    if (resp._clearTransparencyTarget) {
      useAnatomyStore.getState().clearTransparency(resp._clearTransparencyTarget)
    }

    // Update conversation context
    const actedId = response.actions.find(a => a.type === 'focus')?.target
      ?? response.actions.find(a => a.target)?.target
      ?? selectedStructure?.id
    if (actedId) {
      useAnatomyStore.getState().setConversationContext({ lastStructureId: actedId })
    }

    if (response.followUp?.length) setLastFollowUps(response.followUp)
  }, [input, selectedStructure, appMode])

  // Voice command
  const handleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addMessage({ role: 'ai', content: 'Voice recognition is not supported in this browser. Try Chrome.' })
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setListening(true)
    recognition.start()

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setListening(false)
      handleSend(transcript)
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
  }, [handleSend, setListening, addMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Brain size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">AnatomyAI</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-gray-500">Spatially connected to 3D model</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {appMode !== 'explore' && (
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-medium
              ${appMode === 'quiz' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                appMode === 'teach' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                appMode === 'clinical' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              }
            `}>
              {appMode.charAt(0).toUpperCase() + appMode.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Selected structure context */}
      {selectedStructure && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex-shrink-0 px-3 py-2 mx-3 mt-2 rounded-lg bg-cyan-500/8 border border-cyan-500/20"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs text-cyan-300 font-medium">{selectedStructure.name}</span>
            <span className="text-xs text-gray-500">selected</span>
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {[
              `What is the ${selectedStructure.name}?`,
              `Trace ${selectedStructure.name}`,
              `Clinical significance`,
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="px-2 py-0.5 rounded text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin min-h-0">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
              <Sparkles size={22} className="text-cyan-400" />
            </div>
            <p className="text-gray-500 text-sm text-center px-4">
              Start by asking about any structure, or click on the 3D model
            </p>
          </div>
        )}

        <AnimatePresence>
          {chatMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        <AnimatePresence>
          {isAIThinking && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Brain size={14} className="text-white" />
              </div>
              <div className="bg-gray-800/80 border border-white/8 rounded-xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Follow-up chips */}
        {lastFollowUps.length > 0 && !isAIThinking && (
          <FollowUpChips items={lastFollowUps} onSelect={handleSend} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions when empty */}
      {chatMessages.length <= 1 && (
        <div className="flex-shrink-0 px-3 pb-2">
          <p className="text-xs text-gray-600 mb-2 px-1">Quick actions</p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon
              return (
                <button
                  key={i}
                  onClick={() => handleSend(action.label)}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-gray-800/60
                    border border-white/6 text-xs text-gray-300 hover:border-white/15
                    hover:bg-gray-700/50 transition-all duration-150 text-left"
                >
                  <Icon size={12} className={action.color} />
                  <span className="truncate">{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-3 pb-3 pt-1">
        <div className="flex gap-2 items-end bg-gray-800/60 border border-white/10 rounded-xl px-3 py-2
          focus-within:border-cyan-500/40 transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              appMode === 'quiz' ? 'Click on the 3D model to answer...' :
              appMode === 'clinical' ? 'Click the structure on the model...' :
              'Ask about any structure...'
            }
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600
              outline-none resize-none min-h-[20px] max-h-[80px]"
          />
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={handleVoice}
              className={`
                w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150
                ${isListening
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }
              `}
              title="Voice command"
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isAIThinking}
              className="w-7 h-7 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700
                disabled:opacity-40 flex items-center justify-center transition-all duration-150
                active:scale-95 shadow-lg shadow-cyan-500/20"
            >
              <Send size={13} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
