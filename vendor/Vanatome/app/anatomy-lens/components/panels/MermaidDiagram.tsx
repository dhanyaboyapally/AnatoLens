"use client";

import mermaid from "mermaid";
import { useEffect, useId, useState } from "react";

type MermaidDiagramProps = {
  title: string;
  code: string;
};

export function MermaidDiagram({ title, code }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "dark",
    });

    void mermaid
      .render(`anatomy-diagram-${id}`, code)
      .then((result) => {
        if (active) setSvg(result.svg);
      })
      .catch(() => {
        if (active) setError("This diagram could not be rendered.");
      });

    return () => {
      active = false;
    };
  }, [code, id]);

  return (
    <div className="chat-diagram-card" aria-label={title}>
      <div className="chat-rich-card-heading">{title}</div>
      {svg ? (
        <div className="chat-diagram-svg" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : error ? (
        <p className="chat-rich-card-error">{error}</p>
      ) : (
        <p className="chat-rich-card-loading">Preparing diagram…</p>
      )}
    </div>
  );
}
