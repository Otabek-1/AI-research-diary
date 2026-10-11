"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Anchor, ArrowLeft, Compass } from "lucide-react";
import {
  RoadmapData,
  defaultRoadmap,
  computeRoadmapProgress,
  getRoadmapText,
} from "@/lib/roadmap";
import { loadPublicContent } from "@/lib/public-content";
import { TreasureMapView } from "@/components/TreasureMapView";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export default function TreasureMapPage() {
  const locale = "en";
  const [roadmap, setRoadmap] = useState<RoadmapData>(defaultRoadmap);
  const [isDriveSynced, setIsDriveSynced] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadPublicContent(controller.signal)
      .then((content) => {
        if (content.roadmap) {
          setRoadmap(content.roadmap);
          setIsDriveSynced(true);
        }
      })
      .catch(() => {
        /* Keep the bundled roadmap when the live content is unavailable. */
      });
    return () => controller.abort();
  }, []);

  const progress = computeRoadmapProgress(roadmap);
  const currentTitle = progress.currentDestination
    ? getRoadmapText(progress.currentDestination.title, locale)
    : null;

  return (
    <div className="site">
      <SiteHeader active="treasure" />
      <main className="container treasure-page">
        <Link href="/" className="back-link">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <header className="treasure-header">
          <div className="treasure-header-titles">
            <p className="eyebrow">
              <Compass size={14} className="spin-slow" /> Expedition roadmap // Treasure map
            </p>
            <h1>
              The living map of <em>AI treasures</em>
            </h1>
            <p className="lede">{getRoadmapText(roadmap.subtitle, locale)}</p>
          </div>

          <div className="stat-panel">
            <div className="stat-box">
              <span className="stat-box-val">
                {progress.completedDestinations}/{progress.totalDestinations}
              </span>
              <span className="stat-box-lbl">Claimed islands</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-val is-warm">
                {progress.collectedTreasures}/{progress.totalTreasures}
              </span>
              <span className="stat-box-lbl">Treasures found</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-val">{progress.percentage}%</span>
              <span className="stat-box-lbl">Total progress</span>
            </div>
          </div>
        </header>

        {currentTitle && (
          <div className="anchor-banner">
            <span className="anchor-icon"><Anchor size={16} /></span>
            <div>
              <span className="anchor-kicker">Current vessel anchorage</span>
              <strong>{currentTitle}</strong>
            </div>
            <span className="anchor-live"><span className="pulse" /> Exploring topics</span>
          </div>
        )}

        <TreasureMapView roadmap={roadmap} locale={locale} />
      </main>
      <SiteFooter
        note="Treasure map expedition"
        status={isDriveSynced ? "Synced with Google Drive" : "Bundled content"}
      />
    </div>
  );
}
