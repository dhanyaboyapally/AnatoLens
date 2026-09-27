"use client";

import { Play } from "lucide-react";
import type { LearningResource } from "../../../lib/learning-resources";

type LearningResourceCardProps = {
  resources: LearningResource[];
};

export function LearningResourceCard({ resources }: LearningResourceCardProps) {
  if (resources.length === 0) return null;

  return (
    <div className="chat-resource-grid" aria-label="Learning resources">
      {resources.map((resource) => (
        <a
          className="chat-resource-card"
          href={resource.url}
          key={`${resource.type}-${resource.url}`}
          rel="noreferrer"
          target="_blank"
          title={resource.title}
          aria-label={`Open ${resource.type}: ${resource.title}`}
        >
          <div className="chat-resource-thumbnail">
            <img
              src={resource.thumbnailUrl}
              alt={resource.title}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {resource.type === "video" && (
              <span className="chat-resource-play"><Play size={13} fill="currentColor" /></span>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
