"use client";

import Link from "next/link";
import { Anchor, ArrowRight, CheckCircle2, Compass, Gem } from "lucide-react";
import {
  RoadmapData,
  defaultRoadmap,
  computeRoadmapProgress,
  getRoadmapText,
} from "@/lib/roadmap";

/** Compact expedition banner shown on the home page. */
export function TreasureHeroSection({
  locale,
  roadmap = defaultRoadmap,
}: {
  locale: string;
  roadmap?: RoadmapData;
}) {
  const progress = computeRoadmapProgress(roadmap);
  const currentTitle = progress.currentDestination
    ? getRoadmapText(progress.currentDestination.title, locale)
    : null;
  const stops = [...roadmap.destinations].sort((a, b) => a.order - b.order);
  const finalDone = roadmap.finalProject.status === "completed";
  const circumference = 2 * Math.PI * 44;

  return (
    <section className="container section expedition" aria-label="Treasure map expedition">
      <div className="expedition-card">
        <div className="expedition-glow" aria-hidden="true" />
        <div className="expedition-copy">
          <p className="eyebrow">
            <Compass size={14} className="spin-slow" /> Expedition roadmap / 2026
          </p>
          <h2>
            From foundational seeds to the <em>final treasure.</em>
          </h2>
          <p className="expedition-text">
            Every milestone is a destination, every insight a claimed treasure. Follow the voyager toward the crowning
            final project.
          </p>

          <ol className="route" aria-label="Expedition route">
            {stops.map((stop) => (
              <li
                key={stop.id}
                className={`route-stop is-${stop.status}`}
                title={`${getRoadmapText(stop.title, locale)} — ${stop.status}`}
              >
                <span className="route-dot">
                  {stop.status === "completed" ? <CheckCircle2 size={12} /> : stop.status === "current" ? <Anchor size={11} /> : null}
                </span>
              </li>
            ))}
            <li className={`route-stop route-final is-${roadmap.finalProject.status}`} title="Final treasure">
              <span className="route-dot"><Gem size={11} /></span>
            </li>
          </ol>

          {currentTitle && (
            <p className="live-pill">
              <Anchor size={13} /> Anchored at <strong>{currentTitle}</strong>
            </p>
          )}

          <Link href="/treasure-map" className="button button-primary">
            <Compass size={16} /> Explore treasure map <ArrowRight size={16} />
          </Link>
        </div>

        <div className="expedition-progress" aria-label={`Expedition progress ${progress.percentage}%`}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle className="ring-track" cx="50" cy="50" r="44" />
            <circle
              className="ring-value"
              cx="50"
              cy="50"
              r="44"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress.percentage / 100)}
            />
          </svg>
          <div className="ring-label">
            <strong>{progress.percentage}%</strong>
            <span>{finalDone ? "complete" : "charted"}</span>
          </div>
          <dl className="progress-facts">
            <div>
              <dt>Destinations</dt>
              <dd>{progress.completedDestinations}/{progress.totalDestinations}</dd>
            </div>
            <div>
              <dt>Treasures</dt>
              <dd>{progress.collectedTreasures}/{progress.totalTreasures}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
