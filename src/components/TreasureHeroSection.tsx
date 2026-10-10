"use client";

import Link from "next/link";
import { Compass, Sparkles, Anchor, CheckCircle2, ChevronRight } from "lucide-react";
import {
  RoadmapData,
  defaultRoadmap,
  computeRoadmapProgress,
  getRoadmapText,
} from "@/lib/roadmap";

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

  return (
    <section className="treasure-hero-banner" aria-label="Treasure Map Roadmap Hero">
      {/* Dynamic Animated Maritime / Treasure Map Background */}
      <div className="treasure-hero-bg" aria-hidden="true">
        {/* Subtle coordinate grid & navigational circles */}
        <div className="treasure-grid-overlay" />
        <div className="treasure-sea-waves" />

        {/* Vintage nautical compass rose */}
        <div className="treasure-compass-rose">
          <div className="compass-ring" />
          <div className="compass-star" />
          <span className="compass-dir dir-n">N</span>
          <span className="compass-dir dir-e">E</span>
          <span className="compass-dir dir-s">S</span>
          <span className="compass-dir dir-w">W</span>
        </div>

        {/* Map Islands / Waypoints Silhouette on background */}
        <svg
          className="treasure-map-svg"
          viewBox="0 0 1000 450"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="islandGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c7ed6b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c7ed6b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="pathGreen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c7ed6b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#a3e635" stopOpacity="0.9" />
            </linearGradient>
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Curved Map Routes */}
          {/* Completed section: green dashed curved line */}
          <path
            d="M 120 320 Q 230 180 340 180 T 520 280"
            fill="none"
            stroke="url(#pathGreen)"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            className="route-curved-done"
            filter="url(#glowEffect)"
          />
          {/* Upcoming section: gray dashed curved line */}
          <path
            d="M 520 280 Q 640 330 730 160 T 900 210"
            fill="none"
            stroke="rgba(142, 145, 141, 0.35)"
            strokeWidth="2"
            strokeDasharray="5 5"
            className="route-curved-upcoming"
          />

          {/* Island nodes */}
          {/* Island 1 - Done */}
          <g transform="translate(120, 320)">
            <circle r="24" fill="url(#islandGlow)" />
            <circle r="8" fill="#111513" stroke="#c7ed6b" strokeWidth="2" />
            <circle r="3" fill="#c7ed6b" />
          </g>

          {/* Island 2 - Done */}
          <g transform="translate(340, 180)">
            <circle r="26" fill="url(#islandGlow)" />
            <circle r="9" fill="#111513" stroke="#c7ed6b" strokeWidth="2" />
            <circle r="3" fill="#c7ed6b" />
          </g>

          {/* Island 3 - Current with Anchored Ship */}
          <g transform="translate(520, 280)">
            <circle r="34" fill="url(#islandGlow)" className="animate-pulse" />
            <circle r="12" fill="#171c1a" stroke="#c7ed6b" strokeWidth="2.5" />
            {/* Anchored Voyager ship icon on map */}
            <g transform="translate(-14, -36)" className="hero-ship-float">
              <path
                d="M 6 18 Q 14 26 22 18 L 25 12 Q 14 14 3 12 Z"
                fill="#c7ed6b"
              />
              <path d="M 14 3 L 14 18" stroke="#e9e7df" strokeWidth="1.5" />
              <path d="M 14 4 L 23 9 L 14 14 Z" fill="#c7ed6b" opacity="0.9" />
              <circle cx="14" cy="2" r="1.5" fill="#facc15" />
            </g>
          </g>

          {/* Island 4 - Upcoming */}
          <g transform="translate(730, 160)" opacity="0.5">
            <circle r="7" fill="#111513" stroke="#8e918d" strokeWidth="1.5" />
          </g>

          {/* Final Treasure Project - Island 5 */}
          <g transform="translate(900, 210)">
            <circle r="28" fill="rgba(229, 168, 117, 0.15)" />
            <polygon
              points="900,195 912,218 888,218"
              transform="translate(-900, -210)"
              fill="#e5a875"
              stroke="#ffd166"
              strokeWidth="1.5"
            />
          </g>
        </svg>

        {/* Ambient floating dust / nautical sparkles */}
        <span className="sparkle-dot sparkle-1" />
        <span className="sparkle-dot sparkle-2" />
        <span className="sparkle-dot sparkle-3" />
      </div>

      {/* Curtain bg: linear-gradient from transparent to black */}
      <div className="treasure-curtain-overlay" aria-hidden="true" />

      {/* Bottom-left Content inside full-width container */}
      <div className="treasure-hero-content-wrap">
        <div className="treasure-hero-content">
        <div className="treasure-hero-meta">
          <span className="treasure-eyebrow">
            <Compass size={14} className="treasure-icon-pulse" />
            <span>
              {locale === "uz"
                ? "EKSPEDITSIYA ROADMAP // 2026 XAZINA XARITASI"
                : locale === "ru"
                ? "ЭКСПЕДИЦИЯ ROADMAP // КАРТА СОКРОВИЩ 2026"
                : "EXPEDITION ROADMAP // 2026 TREASURE MAP"}
            </span>
          </span>

          {currentTitle && (
            <span className="treasure-live-pill">
              <Anchor size={12} />
              <span>
                {locale === "uz"
                  ? `Kema manzili: ${currentTitle}`
                  : locale === "ru"
                  ? `Корабль в порту: ${currentTitle}`
                  : `Anchored at: ${currentTitle}`}
              </span>
            </span>
          )}
        </div>

        <h2 className="treasure-hero-title">
          {locale === "uz" ? (
            <>
              G&apos;oyalardan Yakuniy Xazinagacha: <em>Tadqiqot yo&apos;li</em>
            </>
          ) : locale === "ru" ? (
            <>
              От первых идей к Финальному Проекту: <em>Путь исследователя</em>
            </>
          ) : (
            <>
              From Foundational Seeds to the Final Treasure:{" "}
              <em>The Expedition</em>
            </>
          )}
        </h2>

        <p className="treasure-hero-desc">
          {locale === "uz"
            ? "Har bir bosqich — zabt etiladigan manzil, har bir mavzu — topiladigan xazina. Kema safarini kuzating va yakuniy loyiha cho'qqisiga birga yetib boring."
            : locale === "ru"
            ? "Каждый этап — новый пункт назначения, каждая тема — найденное сокровище. Следите за маршрутом корабля к легендарному финальному проекту."
            : "Every milestone is a destination, every insight a claimed treasure. Follow the anchored voyager towards the crowning Final Project."}
        </p>

        <div className="treasure-hero-actions">
          <Link
            href="/treasure-map"
            className="button button-primary treasure-cta-button"
          >
            <Compass size={17} />
            <span>
              {locale === "uz"
                ? "Xazina xaritasini ochish"
                : locale === "ru"
                ? "Открыть карту сокровищ"
                : "Explore Treasure Map"}
            </span>
            <ChevronRight size={16} />
          </Link>

          <div className="treasure-progress-summary">
            <span className="summary-stat">
              <CheckCircle2 size={13} className="text-acid" />
              <strong>{progress.completedDestinations}</strong>/
              {progress.totalDestinations}{" "}
              {locale === "uz"
                ? "Manzillar zabt etildi"
                : locale === "ru"
                ? "Пунктов пройдено"
                : "Destinations claimed"}
            </span>
            <span className="summary-stat">
              <Sparkles size={13} className="text-warm" />
              <strong>{progress.collectedTreasures}</strong>/
              {progress.totalTreasures}{" "}
              {locale === "uz"
                ? "Xazinalar"
                : locale === "ru"
                ? "Сокровищ"
                : "Treasures"}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);
}
