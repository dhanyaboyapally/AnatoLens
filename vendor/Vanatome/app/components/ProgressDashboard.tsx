"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Target,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AtlasLoaderError,
  createDemoHumanAtlas,
  createOfficialHumanAtlas,
} from "@vixotic/vanatome-atlas";
import type { VanatomeAtlas } from "@vixotic/vanatome-react";
import {
  ATLAS_CATALOG_IS_DEMO,
  ATLAS_CATALOG_URL,
} from "../config/atlas";

const AnatomyScene = dynamic(
  () => import("./AnatomyScene").then((module) => module.AnatomyScene),
  {
    ssr: false,
    loading: () => (
      <div className="progress-scene-loading">
        <div className="scanner-ring" />
        <span>Loading progress model</span>
      </div>
    ),
  },
);

const CHAT_SESSIONS = [
  {
    topic: "Cardiovascular foundations",
    organ: "Heart",
    detail: "Chambers, circulation, and coronary supply",
    date: "Today",
    duration: "18 min",
  },
  {
    topic: "Respiratory overview",
    organ: "Lungs",
    detail: "Gas exchange and pulmonary structure",
    date: "Yesterday",
    duration: "12 min",
  },
  {
    topic: "Upper abdominal anatomy",
    organ: "Liver",
    detail: "Functions, position, and clinical landmarks",
    date: "Sep 24",
    duration: "22 min",
  },
];

const QUIZ_SESSIONS = [
  { organ: "Heart", score: "4 / 5", accuracy: "80%", date: "Today", status: "Review one topic" },
  { organ: "Lungs", score: "5 / 5", accuracy: "100%", date: "Yesterday", status: "Strong result" },
  { organ: "Liver", score: "3 / 5", accuracy: "60%", date: "Sep 24", status: "Keep practicing" },
];

function SessionColumn({
  title,
  eyebrow,
  icon: Icon,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: typeof MessageSquare;
  children: React.ReactNode;
}) {
  return (
    <section className="progress-session-column">
      <div className="progress-column-heading">
        <div className="progress-column-icon"><Icon size={16} /></div>
        <div>
          <span className="progress-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="progress-session-list">{children}</div>
    </section>
  );
}

export function ProgressDashboard() {
  const loader = useMemo(
    () =>
      ATLAS_CATALOG_IS_DEMO
        ? createDemoHumanAtlas({ catalogUrl: ATLAS_CATALOG_URL })
        : createOfficialHumanAtlas({ catalogUrl: ATLAS_CATALOG_URL }),
    [],
  );
  const [atlases, setAtlases] = useState<readonly VanatomeAtlas[]>([]);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void loader
      .loadProfile("full-body", { signal: controller.signal })
      .then((bundle) => setAtlases([bundle.atlas]))
      .catch((reason: unknown) => {
        if (reason instanceof AtlasLoaderError && reason.code === "aborted") return;
        setModelError("Unable to load the progress anatomy model.");
      });
    return () => controller.abort();
  }, [loader]);

  const visibleLayers = useMemo(
    () => [...new Set(atlases.flatMap((atlas) => atlas.structures.map((structure) => structure.layer)))],
    [atlases],
  );

  return (
    <main className="progress-page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="progress-topbar">
        <Link href="/" className="progress-brand" aria-label="Return to AnatomyLens">
          <span className="brand-mark"><img src="/favicon.svg" alt="" /></span>
          <span>
            <strong className="brand-name">AnatomyLens</strong>
            <small className="brand-subtitle">LEARNING PROGRESS</small>
          </span>
        </Link>
        <div className="progress-topbar-status">
          <span className="status-dot" /> DEMO PROGRESS DATA
        </div>
        <Link href="/" className="progress-back-link">
          <ArrowLeft size={15} /> BACK TO LAB
        </Link>
      </header>

      <div className="progress-page-content">
        <header className="progress-page-heading">
          <div>
            <span className="progress-eyebrow">STUDY COMMAND CENTER</span>
            <h1>Your learning progress</h1>
            <p>Review the anatomy topics you have explored and tested.</p>
          </div>
          <div className="progress-stat-strip" aria-label="Progress summary">
            <div><span>ORGANS STUDIED</span><strong>03</strong></div>
            <div><span>QUIZ ACCURACY</span><strong>76%</strong></div>
            <div><span>STUDY TIME</span><strong>52m</strong></div>
          </div>
        </header>

        <section className="progress-model-card" aria-label="Anatomy progress model">
          <div className="progress-card-heading">
            <div>
              <span className="progress-eyebrow">ANATOMY COVERAGE</span>
              <h2>Explore your studied regions</h2>
            </div>
            <span className="progress-model-badge"><Target size={13} /> PLACEHOLDER VIEW</span>
          </div>
          <div className="progress-model-stage">
            {modelError ? (
              <div className="progress-scene-loading"><span>{modelError}</span></div>
            ) : atlases.length > 0 ? (
              <AnatomyScene
                atlases={atlases}
                selectedId={null}
                isolation={null}
                visibleLayers={visibleLayers}
                focusRequestKey={0}
                resetViewKey={0}
                onSelect={() => undefined}
                onStructureContextMenu={() => undefined}
                onEscape={() => undefined}
              />
            ) : null}
            <div className="progress-model-overlay">
              <span>FULL-BODY ATLAS</span>
              <strong>3 regions visited</strong>
            </div>
          </div>
        </section>

        <section className="progress-session-grid" aria-label="Study session history">
          <SessionColumn title="Chat sessions" eyebrow="RECENT LEARNING" icon={MessageSquare}>
            {CHAT_SESSIONS.map((session) => (
              <article className="progress-session-item" key={`${session.organ}-${session.date}`}>
                <div className="progress-session-item-icon"><Brain size={15} /></div>
                <div className="progress-session-item-copy">
                  <strong>{session.topic}</strong>
                  <span>{session.organ} · {session.detail}</span>
                </div>
                <div className="progress-session-meta"><span><CalendarDays size={12} /> {session.date}</span><span><Clock3 size={12} /> {session.duration}</span></div>
              </article>
            ))}
          </SessionColumn>

          <SessionColumn title="Quiz sessions" eyebrow="KNOWLEDGE CHECKS" icon={Trophy}>
            {QUIZ_SESSIONS.map((session) => (
              <article className="progress-session-item" key={`${session.organ}-${session.date}`}>
                <div className="progress-session-item-icon quiz"><CheckCircle2 size={15} /></div>
                <div className="progress-session-item-copy">
                  <strong>{session.organ} quiz</strong>
                  <span>{session.status}</span>
                </div>
                <div className="progress-quiz-score"><strong>{session.score}</strong><span>{session.accuracy} · {session.date}</span></div>
              </article>
            ))}
          </SessionColumn>
        </section>
      </div>
    </main>
  );
}
