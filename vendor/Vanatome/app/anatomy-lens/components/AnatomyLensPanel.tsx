"use client";

import { useState } from "react";
import { BarChart3, Brain, MessageSquare } from "lucide-react";
import { AIChatPanel } from "./panels/AIChatPanel";
import { ProgressPanel } from "./panels/ProgressPanel";
import { QuizModeOverlay } from "./modes/QuizMode";
import { TeachModeOverlay } from "./modes/TeachMode";
import { ClinicalModeOverlay } from "./modes/ClinicalMode";
import { DissectionControls } from "./ui/DissectionControls";
import { StickyNotesLayer } from "./ui/StickyNotes";
import { useAnatomyStore, type AppMode } from "../store/anatomyStore";

type PanelTab = "assistant" | "progress";

export function AnatomyLensPanel() {
  const [tab, setTab] = useState<PanelTab>("assistant");
  const { appMode, setAppMode } = useAnatomyStore();

  const chooseMode = (mode: AppMode) => {
    setAppMode(appMode === mode ? "explore" : mode);
  };

  return (
    <>
      <aside className="learning-panel" aria-label="AnatomyLens learning tools">
        <div className="learning-panel-header">
          <div>
            <span className="learning-kicker">ANATOMYLENS</span>
            <strong>Learning studio</strong>
          </div>
          <Brain size={20} aria-hidden="true" />
        </div>

        <div className="learning-mode-grid" aria-label="Learning modes">
          <button
            type="button"
            className={appMode === "quiz" ? "active" : ""}
            onClick={() => chooseMode("quiz")}
          >
            Quiz
          </button>
          <button
            type="button"
            className={appMode === "teach" ? "active" : ""}
            onClick={() => chooseMode("teach")}
          >
            Teach
          </button>
          <button
            type="button"
            className={appMode === "clinical" ? "active" : ""}
            onClick={() => chooseMode("clinical")}
          >
            Clinical
          </button>
          <button
            type="button"
            className={appMode === "dissection" ? "active" : ""}
            onClick={() => chooseMode("dissection")}
          >
            Dissect
          </button>
        </div>

        <div className="learning-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "assistant"}
            className={tab === "assistant" ? "active" : ""}
            onClick={() => setTab("assistant")}
          >
            <MessageSquare size={15} />
            AI assistant
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "progress"}
            className={tab === "progress" ? "active" : ""}
            onClick={() => setTab("progress")}
          >
            <BarChart3 size={15} />
            Progress
          </button>
        </div>

        <div className="learning-panel-content">
          {tab === "assistant" ? <AIChatPanel /> : <ProgressPanel />}
        </div>
      </aside>

      <QuizModeOverlay />
      <TeachModeOverlay />
      <ClinicalModeOverlay />
      <DissectionControls />
      <StickyNotesLayer />
    </>
  );
}
