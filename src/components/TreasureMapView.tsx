"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Anchor,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Crown,
  Gem,
  Key,
  Lock,
  Scroll,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  DestinationStatus,
  RoadmapData,
  TreasureItem,
  computeRoadmapProgress,
  getRoadmapText,
  resolveTreasureLink,
} from "@/lib/roadmap";

const FINAL_ID = "__final__";

const statusCopy: Record<DestinationStatus, { label: string; kicker: string }> = {
  completed: { label: "Treasure claimed", kicker: "Claimed" },
  current: { label: "Voyager anchored here", kicker: "Current stop" },
  upcoming: { label: "Uncharted mist", kicker: "Ahead" },
};

export function TreasureMapView({ roadmap, locale }: { roadmap: RoadmapData; locale: string }) {
  const progress = computeRoadmapProgress(roadmap);
  const stops = [...roadmap.destinations].sort((a, b) => a.order - b.order);
  const [selected, setSelected] = useState<string | null>(progress.currentDestination?.id ?? stops[0]?.id ?? null);
  const toggle = (id: string) => setSelected((current) => (current === id ? null : id));

  const finalTitle = getRoadmapText(roadmap.finalProject.title, locale);
  const finalStatus = roadmap.finalProject.status;
  const finalSelected = selected === FINAL_ID;

  return (
    <section className="voyage" aria-label="Interactive treasure map">
      <p className="voyage-hint">Select a destination to see the treasures hidden on its island.</p>

      <ol className="voyage-route">
        {stops.map((stop, index) => {
          const isOpen = selected === stop.id;
          const title = getRoadmapText(stop.title, locale);
          const claimed = stop.treasures.filter((treasure) => treasure.completed).length;
          const total = stop.treasures.length;
          const ratio = total ? Math.round((claimed / total) * 100) : 0;
          const copy = statusCopy[stop.status];
          return (
            <li
              key={stop.id}
              className={`voyage-stop is-${stop.status} ${index % 2 === 0 ? "side-left" : "side-right"}${isOpen ? " is-open" : ""}`}
            >
              <span className="voyage-node" aria-hidden="true">
                {stop.status === "completed" ? <CheckCircle2 size={18} /> : stop.status === "current" ? <Anchor size={18} /> : <Lock size={15} />}
              </span>

              <article className="voyage-card">
                <button
                  type="button"
                  className="voyage-card-head"
                  aria-expanded={isOpen}
                  aria-controls={`panel-${stop.id}`}
                  onClick={() => toggle(stop.id)}
                >
                  <span className="voyage-card-meta">
                    <span className="voyage-order">{String(index + 1).padStart(2, "0")}</span>
                    <span className={`status-badge is-${stop.status}`}>{copy.label}</span>
                  </span>
                  <span className="voyage-title">{title}</span>
                  <span className="voyage-desc">{getRoadmapText(stop.description, locale)}</span>
                  <span className="meter" aria-hidden="true">
                    <span className="meter-fill" style={{ width: `${ratio}%` }} />
                  </span>
                  <span className="voyage-card-foot">
                    <span>{claimed}/{total} treasures</span>
                    <ChevronDown size={16} className="chevron" />
                  </span>
                </button>

                {isOpen && (
                  <div className="voyage-panel" id={`panel-${stop.id}`}>
                    {total ? (
                      <div className="treasure-grid">
                        {stop.treasures.map((treasure) => (
                          <TreasureCard key={treasure.id} treasure={treasure} />
                        ))}
                      </div>
                    ) : (
                      <p className="muted">No treasures charted on this island yet.</p>
                    )}
                  </div>
                )}
              </article>
            </li>
          );
        })}

        <li className="voyage-mist" aria-hidden="true">
          <span>Uncharted mist</span>
        </li>

        <li className={`voyage-stop voyage-final is-${finalStatus}${finalSelected ? " is-open" : ""}`}>
          <span className="voyage-node" aria-hidden="true">
            <Crown size={20} />
          </span>
          <article className="voyage-card">
            <button
              type="button"
              className="voyage-card-head"
              aria-expanded={finalSelected}
              aria-controls="panel-final"
              onClick={() => toggle(FINAL_ID)}
            >
              <span className="voyage-card-meta">
                <span className="voyage-order"><Crown size={13} /> Final treasure</span>
                <span className={`status-badge is-${finalStatus}`}>
                  {finalStatus === "completed" ? "Accomplished" : finalStatus === "current" ? "Active final stage" : "Veiled goal"}
                </span>
              </span>
              <span className="voyage-title">{finalTitle}</span>
              <span className="voyage-card-foot">
                <span>{finalStatus === "completed" ? "Expedition complete" : "The ultimate research project"}</span>
                <ChevronDown size={16} className="chevron" />
              </span>
            </button>
            {finalSelected && (
              <div className="voyage-panel" id="panel-final">
                <p className="voyage-desc">{getRoadmapText(roadmap.finalProject.description, locale)}</p>
                {roadmap.finalProject.reward && (
                  <div className="reward">
                    <Sparkles size={18} />
                    <div>
                      <span>Ultimate reward</span>
                      <p>{roadmap.finalProject.reward}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        </li>
      </ol>
    </section>
  );
}

function TreasureCard({ treasure }: { treasure: TreasureItem }) {
  const Icon =
    treasure.type === "gem" ? Gem : treasure.type === "scroll" ? Scroll : treasure.type === "key" ? Key : Shield;
  const href = resolveTreasureLink(treasure);
  const external = Boolean(href && /^https?:\/\//.test(href));

  const inner = (
    <>
      <span className="treasure-icon"><Icon size={16} /></span>
      <span className="treasure-info">
        <strong>{treasure.title}</strong>
        <small>{treasure.completed ? (href ? "Claimed · read note" : "Claimed") : "In study"}</small>
      </span>
      {href ? (
        <ArrowUpRight size={16} className="treasure-go" />
      ) : treasure.completed ? (
        <CheckCircle2 size={16} className="treasure-done" />
      ) : (
        <span className="treasure-todo" aria-hidden="true" />
      )}
    </>
  );
  const className = `treasure-card${treasure.completed ? " is-collected" : ""}${href ? " is-link" : ""}`;

  if (!href) return <div className={className}>{inner}</div>;
  if (external) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return (
    <Link className={className} href={href}>
      {inner}
    </Link>
  );
}
