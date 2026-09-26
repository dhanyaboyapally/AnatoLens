"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Brain, Send, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { AnatomyStructure } from "../../../data/anatomy";

type ChatStructure = Pick<
  AnatomyStructure,
  "id" | "name" | "system" | "layer" | "parentId" | "summary" | "function" | "fact"
>;

type AIChatPanelProps = {
  selectedStructure: AnatomyStructure | null;
  availableStructures: AnatomyStructure[];
  visibleSystems: readonly string[];
  mode?: string;
  onFocusStructure: (id: string) => boolean;
};

const QUICK_ACTIONS = [
  "What does the selected structure do?",
  "Teach me the heart's left ventricle",
  "What is located behind the stomach?",
];

function messageText(message: { parts: Array<{ type: string; text?: string }> }) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
}

function MarkdownText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function MessageBubble({ message }: { message: { role: string; parts: Array<{ type: string; text?: string }> } }) {
  const isAI = message.role === "assistant";
  const content = messageText(message);

  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-2.5 ${isAI ? "" : "flex-row-reverse"}`}
    >
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          isAI
            ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
            : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
        }`}
      >
        {isAI ? <Brain size={14} /> : "S"}
      </div>
      <div
        className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
          isAI
            ? "bg-gray-800/80 border border-white/8 text-gray-200 rounded-tl-sm"
            : "bg-gradient-to-br from-cyan-600/30 to-blue-600/20 border border-cyan-500/25 text-gray-100 rounded-tr-sm"
        }`}
      >
        <MarkdownText text={content} />
      </div>
    </motion.div>
  );
}

export function AIChatPanel({
  selectedStructure,
  availableStructures,
  visibleSystems,
  mode = "chat",
  onFocusStructure,
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const catalog = useMemo<ChatStructure[]>(
    () => availableStructures.map(({ id, name, system, layer, parentId, summary, function: structureFunction, fact }) => ({
      id,
      name,
      system,
      layer,
      parentId,
      summary,
      function: structureFunction,
      fact,
    })),
    [availableStructures],
  );
  const selectedContext = useMemo(
    () => catalog.find((structure) => structure.id === selectedStructure?.id) ?? null,
    [catalog, selectedStructure?.id],
  );
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: ({ message }) => {
      for (const part of message.parts) {
        const toolPart = part as {
          type?: string;
          state?: string;
          output?: { found?: boolean; structureId?: string };
        };
        if (
          toolPart.type === "tool-focusStructure" &&
          toolPart.state === "output-available" &&
          toolPart.output?.found &&
          toolPart.output.structureId
        ) {
          onFocusStructure(toolPart.output.structureId);
        }
      }
    },
  });
  const isThinking = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = useCallback(async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || isThinking) return;

    setInput("");
    await sendMessage(
      { text: message },
      {
        body: {
          selectedStructure: selectedContext,
          visibleSystems,
          mode,
          structureCatalog: catalog,
        },
      },
    );
  }, [catalog, input, isThinking, mode, selectedContext, sendMessage, visibleSystems]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/8 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Brain size={16} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white">AnatomyAI</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xs text-gray-500">Your anatomy tutor</p>
        </div>
      </div>

      {selectedContext && (
        <div className="flex-shrink-0 px-3 py-2 mx-3 mt-2 rounded-lg bg-cyan-500/8 border border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs text-cyan-300 font-medium">{selectedContext.name}</span>
            <span className="text-xs text-gray-500">selected</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
              <Sparkles size={22} className="text-cyan-400" />
            </div>
            <p className="text-gray-500 text-sm text-center px-4">
              Select a structure or ask me to teach you about any part of the body.
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {isThinking && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Brain size={14} className="text-white" />
            </div>
            <div className="bg-gray-800/80 border border-white/8 rounded-xl rounded-tl-sm px-4 py-3 text-xs text-cyan-300">
              Thinking about the anatomy...
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            {error.message || "The anatomy tutor is unavailable right now."}
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length === 0 && (
        <div className="flex-shrink-0 px-3 pb-2">
          <p className="text-xs text-gray-600 mb-2 px-1">Try asking</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => void handleSend(action)}
                className="px-2.5 py-1.5 rounded-full text-xs bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-shrink-0 px-3 pb-3 pt-1">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
          className="flex gap-2 items-center bg-gray-800/60 border border-white/10 rounded-xl px-3 py-2 focus-within:border-cyan-500/40 transition-colors"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask your anatomy tutor..."
            disabled={isThinking}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none min-w-0"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="w-7 h-7 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 disabled:opacity-40 flex items-center justify-center transition-all"
            aria-label="Send message"
          >
            <Send size={13} className="text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
