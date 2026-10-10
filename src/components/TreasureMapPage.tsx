"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  ArrowLeft,
  Anchor,
} from "lucide-react";
import {
  RoadmapData,
  defaultRoadmap,
  parseRoadmapFromFiles,
  computeRoadmapProgress,
  getRoadmapText,
} from "@/lib/roadmap";
import { TreasureMapView } from "@/components/TreasureMapView";

export default function TreasureMapPage() {
  const locale = "en" as string;

  const [roadmap, setRoadmap] = useState<RoadmapData>(defaultRoadmap);
  const [isDriveSynced, setIsDriveSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRoadmapFromDrive() {
      try {
        const response = await fetch("/api/content", { cache: "no-store" });
        if (!response.ok) return;
        const result = (await response.json()) as {
          files?: { path: string; content: string }[];
        };
        if (cancelled || !result.files) return;

        const liveRoadmap = parseRoadmapFromFiles(result.files);
        if (liveRoadmap) {
          setRoadmap(liveRoadmap);
          setIsDriveSynced(true);
        }
      } catch {
        // Fallback to default roadmap
      }
    }

    void loadRoadmapFromDrive();
    return () => {
      cancelled = true;
    };
  }, []);

  const progress = computeRoadmapProgress(roadmap);
  const currentTitle = progress.currentDestination
    ? getRoadmapText(progress.currentDestination.title, locale)
    : null;

  return (
    <main className="site-shell">
      {/* Topbar */}
      <header className="topbar">
        <Link className="wordmark" href="/">
          FIELD / NOTES<span>01</span>
        </Link>
        <nav className="public-nav" aria-label="Primary navigation">
          <Link href="/#archive">
            Archive
          </Link>
          <Link href="/treasure-map" className="text-acid">
            Treasure Map
          </Link>
          <Link href="/#about">
            About
          </Link>
        </nav>
      </header>

      {/* Page Content */}
      <div className="treasure-page-shell">
        {/* Breadcrumb / Back button */}
        <div className="pt-8 pb-3">
          <Link
            href="/"
            className="text-link inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-acid"
          >
            <ArrowLeft size={13} />
            <span>
              {locale === "uz"
                ? "Asosiy sahifaga qaytish"
                : locale === "ru"
                ? "Вернуться на главную"
                : "Back to Home"}
            </span>
          </Link>
        </div>

        {/* Header Section */}
        <div className="treasure-header-section">
          <div className="treasure-header-titles">
            <span className="treasure-eyebrow">
              <Compass size={14} className="treasure-icon-pulse" />
              <span>
                {locale === "uz"
                  ? "EKSPEDITSIYA ROADMAP // XAZINA XARITASI"
                  : locale === "ru"
                  ? "ЭКСПЕДИЦИЯ ROADMAP // КАРТА СОКРОВИЩ"
                  : "EXPEDITION ROADMAP // TREASURE MAP"}
              </span>
            </span>
            <h1>
              {locale === "uz" ? (
                <>
                  Tadqiqot yo&apos;li: <em>AI Xazina Xaritasi</em>
                </>
              ) : locale === "ru" ? (
                <>
                  Путь исследователя: <em>Карта Сокровищ</em>
                </>
              ) : (
                <>
                  The Living Map of <em>AI Treasures</em>
                </>
              )}
            </h1>
            <p>
              {getRoadmapText(roadmap.subtitle, locale)}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="treasure-stats-panel">
            <div className="stat-box">
              <span className="stat-box-val">
                {progress.completedDestinations}/{progress.totalDestinations}
              </span>
              <span className="stat-box-lbl">
                {locale === "uz"
                  ? "Manzillar zabt etildi"
                  : locale === "ru"
                  ? "Пунктов пройдено"
                  : "Claimed Islands"}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-box-val text-warm">
                {progress.collectedTreasures}/{progress.totalTreasures}
              </span>
              <span className="stat-box-lbl">
                {locale === "uz"
                  ? "Topilgan xazinalar"
                  : locale === "ru"
                  ? "Найдено сокровищ"
                  : "Treasures Found"}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-box-val">
                {progress.percentage}%
              </span>
              <span className="stat-box-lbl">
                {locale === "uz"
                  ? "Sayohat darajasi"
                  : locale === "ru"
                  ? "Общий прогресс"
                  : "Total Progress"}
              </span>
            </div>
          </div>
        </div>

        {/* Current Anchor Status Banner */}
        {currentTitle && (
          <div className="my-6 p-4 rounded bg-[#131a16] border border-[#233527] flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#c7ed6b22] text-acid flex items-center justify-center flex-shrink-0">
                <Anchor size={16} />
              </div>
              <div>
                <span className="font-mono text-xs uppercase text-acid tracking-wide block">
                  {locale === "uz"
                    ? "Kema Langar Tashlagan Manzil"
                    : locale === "ru"
                    ? "Текущий порт стоянки корабля"
                    : "Current Vessel Anchorage"}
                </span>
                <strong className="text-ink font-serif text-lg font-normal">
                  {currentTitle}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-acid animate-ping" />
              <span>
                {locale === "uz"
                  ? "Xazinalar izlanmoqda"
                  : locale === "ru"
                  ? "Идет сбор сокровищ"
                  : "Exploring topics"}
              </span>
            </div>
          </div>
        )}

        {/* Main Interactive Map View */}
        <TreasureMapView roadmap={roadmap} locale={locale} />
      </div>

      {/* Footer */}
      <footer className="footer">
        <span>FIELD / NOTES — TREASURE MAP EXPEDITION</span>
        <span>
          {isDriveSynced ? "SYNCED WITH GOOGLE DRIVE" : "LOCAL CONTENT"}
        </span>
      </footer>
    </main>
  );
}
