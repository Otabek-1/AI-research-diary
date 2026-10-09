"use client";

import { useState, useId } from "react";
import {
  Anchor,
  CheckCircle2,
  Sparkles,
  Lock,
  Gem,
  Scroll,
  Shield,
  Key,
  Crown,
  MapPin,
} from "lucide-react";
import { Locale } from "@/lib/content";
import {
  RoadmapData,
  TreasureItem,
  computeRoadmapProgress,
  getRoadmapText,
} from "@/lib/roadmap";

export function TreasureMapView({
  roadmap,
  locale,
}: {
  roadmap: RoadmapData;
  locale: Locale;
}) {
  const progress = computeRoadmapProgress(roadmap);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(
    progress.currentDestination?.id ?? roadmap.destinations[0]?.id ?? null,
  );
  const [selectedIsFinal, setSelectedIsFinal] = useState(false);
  const glowFilterId = useId();

  const sortedDestinations = [...roadmap.destinations].sort((a, b) => a.order - b.order);
  const selectedDestination = selectedIsFinal
    ? null
    : sortedDestinations.find((d) => d.id === selectedDestinationId) ?? sortedDestinations[0];

  // Helper to build smooth curved Bezier path between two coordinate points
  function buildCurvePath(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
  ) {
    const x1 = (p1.x / 100) * 1000;
    const y1 = (p1.y / 100) * 580;
    const x2 = (p2.x / 100) * 1000;
    const y2 = (p2.y / 100) * 580;

    const dx = x2 - x1;
    const dy = y2 - y1;
    // Curved control points for natural maritime sailing arcs
    const cx1 = x1 + dx * 0.45;
    const cy1 = y1 - dy * 0.35 + (x1 % 2 === 0 ? -40 : 40);
    const cx2 = x1 + dx * 0.75;
    const cy2 = y2 + (y1 % 2 === 0 ? 30 : -30);

    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  }

  // All nodes in order including final project
  const allWaypoints = [
    ...sortedDestinations.map((d) => ({
      id: d.id,
      coordinates: d.coordinates,
      status: d.status,
      isFinal: false,
    })),
    {
      id: roadmap.finalProject.id,
      coordinates: roadmap.finalProject.coordinates ?? { x: 92, y: 45 },
      status: roadmap.finalProject.status,
      isFinal: true,
    },
  ];

  return (
    <div className="treasure-map-experience">
      {/* Interactive Nautical Cartography Surface */}
      <div className="interactive-map-container" role="region" aria-label="Interactive Treasure Map">
        <div className="map-cartography-bg">
          {/* Subtle Grid overlay */}
          <div className="treasure-grid-overlay" />

          {/* Compass Rose */}
          <div className="treasure-compass-rose">
            <div className="compass-ring" />
            <div className="compass-star" />
            <span className="compass-dir dir-n">N</span>
            <span className="compass-dir dir-e">E</span>
            <span className="compass-dir dir-s">S</span>
            <span className="compass-dir dir-w">W</span>
          </div>

          {/* Main SVG Map Canvas */}
          <svg
            className="map-svg-surface"
            viewBox="0 0 1000 580"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id={glowFilterId} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id="nodeActiveGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c7ed6b" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#c7ed6b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="finalGoldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e5a875" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#e5a875" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* CURVED DASHED PATHS BETWEEN DESTINATIONS */}
            {allWaypoints.slice(0, -1).map((currentPoint, index) => {
              const nextPoint = allWaypoints[index + 1];
              const pathD = buildCurvePath(currentPoint.coordinates, nextPoint.coordinates);
              // Done path: if currentPoint is completed!
              const isSegmentDone = currentPoint.status === "completed";

              return (
                <g key={`path-${currentPoint.id}-${nextPoint.id}`}>
                  {/* Backdrop shadow line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#080b09"
                    strokeWidth="4"
                    opacity="0.8"
                  />
                  {/* Actual dashed route */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isSegmentDone ? "#c7ed6b" : "rgba(142, 145, 141, 0.35)"}
                    strokeWidth={isSegmentDone ? "2.75" : "2"}
                    strokeDasharray={isSegmentDone ? "7 6" : "5 6"}
                    className={isSegmentDone ? "route-curved-done" : "route-curved-upcoming"}
                    filter={isSegmentDone ? `url(#${glowFilterId})` : undefined}
                  />
                </g>
              );
            })}

            {/* DESTINATION ISLAND NODES */}
            {sortedDestinations.map((destination) => {
              const cx = (destination.coordinates.x / 100) * 1000;
              const cy = (destination.coordinates.y / 100) * 580;
              const isSelected = !selectedIsFinal && selectedDestination?.id === destination.id;
              const isDone = destination.status === "completed";
              const isCurrent = destination.status === "current";
              const titleStr = getRoadmapText(destination.title, locale);

              return (
                <g
                  key={destination.id}
                  transform={`translate(${cx}, ${cy})`}
                  className="map-node-trigger"
                  onClick={() => {
                    setSelectedDestinationId(destination.id);
                    setSelectedIsFinal(false);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${titleStr} (${destination.status})`}
                >
                  {/* Island Radial Glow */}
                  {(isDone || isCurrent || isSelected) && (
                    <circle
                      r={isCurrent ? "46" : "34"}
                      fill="url(#nodeActiveGlow)"
                      className={isCurrent ? "animate-pulse" : ""}
                    />
                  )}

                  {/* Selection highlight ring */}
                  {isSelected && (
                    <circle
                      r="26"
                      fill="none"
                      stroke="#c7ed6b"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Destination Landform Base */}
                  <circle
                    r="16"
                    fill={isDone ? "#17231c" : isCurrent ? "#1b2720" : "#121614"}
                    stroke={isDone ? "#c7ed6b" : isCurrent ? "#c7ed6b" : "#404844"}
                    strokeWidth={isDone || isCurrent ? "2.5" : "1.5"}
                  />

                  {/* Icon / Marker within Node */}
                  {isDone && (
                    <g transform="translate(-7, -7)">
                      <path
                        d="M 3 8 L 6 11 L 12 4"
                        fill="none"
                        stroke="#c7ed6b"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  )}

                  {isCurrent && (
                    <>
                      {/* Central pulsing core */}
                      <circle r="4" fill="#c7ed6b" />
                      {/* Anchored Voyager Ship Figurehead */}
                      <g
                        transform="translate(0, -32)"
                        className="voyager-ship-anchor"
                      >
                        {/* Ship Hull */}
                        <path
                          d="M -15 14 Q 0 24 15 14 L 18 6 Q 0 9 -18 6 Z"
                          fill="#c7ed6b"
                        />
                        {/* Mast & Sails */}
                        <path d="M 0 -8 L 0 14" stroke="#ffffff" strokeWidth="2" />
                        <path
                          d="M 0 -6 L 13 0 L 0 6 Z"
                          fill="#c7ed6b"
                          opacity="0.95"
                        />
                        <path
                          d="M 0 -4 L -11 1 L 0 5 Z"
                          fill="#a3e635"
                          opacity="0.75"
                        />
                        {/* Golden Pennant flag */}
                        <polygon points="0,-8 6,-10 0,-12" fill="#e5a875" />
                        <circle cx="0" cy="-8" r="1.5" fill="#ffd166" />
                      </g>
                    </>
                  )}

                  {!isDone && !isCurrent && (
                    <g transform="translate(-4, -5)" opacity="0.6">
                      <rect x="0" y="4" width="8" height="6" rx="1" fill="#8e918d" />
                      <path
                        d="M 2 4 L 2 2 Q 4 0 6 2 L 6 4"
                        fill="none"
                        stroke="#8e918d"
                        strokeWidth="1.2"
                      />
                    </g>
                  )}

                  {/* Destination Label below node */}
                  <text
                    y="32"
                    textAnchor="middle"
                    fill={isDone || isCurrent ? "#e9e7df" : "#8e918d"}
                    fontSize="11"
                    fontFamily="DM Mono, monospace"
                    letterSpacing="0.04em"
                    className="select-none pointer-events-none"
                  >
                    0{destination.order}. {titleStr}
                  </text>

                  {/* Badge: CLAIMED or ANCHORED */}
                  {isDone && (
                    <text
                      y="45"
                      textAnchor="middle"
                      fill="#c7ed6b"
                      fontSize="9"
                      fontFamily="DM Mono, monospace"
                      letterSpacing="0.08em"
                      className="select-none pointer-events-none"
                    >
                      TREASURE CLAIMED
                    </text>
                  )}
                  {isCurrent && (
                    <text
                      y="45"
                      textAnchor="middle"
                      fill="#e5a875"
                      fontSize="9"
                      fontFamily="DM Mono, monospace"
                      fontWeight="bold"
                      letterSpacing="0.08em"
                      className="select-none pointer-events-none"
                    >
                      ANCHORED HERE
                    </text>
                  )}
                </g>
              );
            })}

            {/* FINAL TREASURE NODE (Final Project) */}
            {(() => {
              const fx = ((roadmap.finalProject.coordinates?.x ?? 92) / 100) * 1000;
              const fy = ((roadmap.finalProject.coordinates?.y ?? 45) / 100) * 580;
              const isDone = roadmap.finalProject.status === "completed";
              const isCurrent = roadmap.finalProject.status === "current";
              const isSelected = selectedIsFinal;
              const finalTitle = getRoadmapText(roadmap.finalProject.title, locale);

              return (
                <g
                  transform={`translate(${fx}, ${fy})`}
                  className="map-node-trigger"
                  onClick={() => setSelectedIsFinal(true)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Final Treasure: ${finalTitle}`}
                >
                  {/* Golden Halo */}
                  <circle
                    r="44"
                    fill="url(#finalGoldGlow)"
                    className="animate-pulse"
                  />

                  {isSelected && (
                    <circle
                      r="30"
                      fill="none"
                      stroke="#e5a875"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* Citadel Island Base */}
                  <polygon
                    points="0,-22 22,-4 14,20 -14,20 -22,-4"
                    fill="#241d17"
                    stroke={isDone ? "#ffd166" : isCurrent ? "#c7ed6b" : "#e5a875"}
                    strokeWidth="2.5"
                  />

                  {/* Crown / Chest Icon */}
                  <g transform="translate(-10, -11)">
                    <path
                      d="M 2 16 L 18 16 L 20 8 L 15 11 L 10 4 L 5 11 L 0 8 Z"
                      fill={isDone ? "#ffd166" : "#e5a875"}
                      stroke="#111513"
                      strokeWidth="1"
                    />
                    <circle cx="2" cy="7" r="1.5" fill="#ffd166" />
                    <circle cx="10" cy="3" r="1.5" fill="#ffd166" />
                    <circle cx="18" cy="7" r="1.5" fill="#ffd166" />
                  </g>

                  {/* Title and Badge */}
                  <text
                    y="36"
                    textAnchor="middle"
                    fill="#e5a875"
                    fontSize="12"
                    fontWeight="500"
                    fontFamily="Newsreader, serif"
                    className="select-none pointer-events-none"
                  >
                    ★ FINAL TREASURE
                  </text>
                  <text
                    y="50"
                    textAnchor="middle"
                    fill={isDone ? "#c7ed6b" : "#8e918d"}
                    fontSize="9"
                    fontFamily="DM Mono, monospace"
                    letterSpacing="0.08em"
                    className="select-none pointer-events-none"
                  >
                    {isDone ? "EXPEDITION COMPLETE" : "THE FINAL PROJECT"}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* DESTINATION EXPLORER DRAWER / DETAIL PANEL */}
      <div className="destination-drawer">
        {selectedIsFinal ? (
          <div>
            <div className="drawer-header">
              <div className="drawer-title-wrap">
                <span className="treasure-eyebrow">
                  <Crown size={14} className="text-warm" />
                  <span>
                    {locale === "uz"
                      ? "YAKUNIY XAZINA // FINAL PROJECT"
                      : locale === "ru"
                      ? "ГЛАВНОЕ СОКРОВИЩЕ // ФИНАЛЬНЫЙ ПРОЕКТ"
                      : "FINAL TREASURE // FINAL PROJECT"}
                  </span>
                </span>
                <h3>{getRoadmapText(roadmap.finalProject.title, locale)}</h3>
                <p className="text-muted text-sm mt-1">
                  {getRoadmapText(roadmap.finalProject.description, locale)}
                </p>
              </div>

              <div className="drawer-header-actions">
                <span
                  className={`drawer-status-badge ${
                    roadmap.finalProject.status === "completed"
                      ? "status-badge-done"
                      : roadmap.finalProject.status === "current"
                      ? "status-badge-current"
                      : "status-badge-upcoming"
                  }`}
                >
                  {roadmap.finalProject.status === "completed" ? (
                    <>
                      <CheckCircle2 size={13} />
                      {locale === "uz" ? "Zabt etilgan" : "Accomplished"}
                    </>
                  ) : roadmap.finalProject.status === "current" ? (
                    <>
                      <Anchor size={13} />
                      {locale === "uz" ? "Kema shu yerda" : "Active Final Stage"}
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      {locale === "uz" ? "Kutilmoqda" : "Veiled Goal"}
                    </>
                  )}
                </span>
              </div>
            </div>

            {roadmap.finalProject.reward && (
              <div className="p-4 bg-[#141a16] border border-[#263529] rounded mb-4 flex items-center gap-3">
                <Sparkles size={20} className="text-warm flex-shrink-0" />
                <div>
                  <h4 className="font-mono text-xs uppercase text-acid tracking-wide mb-0.5">
                    {locale === "uz" ? "Oliy Sovg'a" : "Ultimate Reward"}
                  </h4>
                  <p className="text-sm text-ink m-0">{roadmap.finalProject.reward}</p>
                </div>
              </div>
            )}
          </div>
        ) : selectedDestination ? (
          <div>
            <div className="drawer-header">
              <div className="drawer-title-wrap">
                <span className="treasure-eyebrow">
                  <MapPin size={13} />
                  <span>
                    {locale === "uz" ? "MANZIL" : "DESTINATION"} 0{selectedDestination.order} {"//"} 0{roadmap.destinations.length}
                  </span>
                </span>
                <h3>{getRoadmapText(selectedDestination.title, locale)}</h3>
                <p className="text-muted text-sm mt-1">
                  {getRoadmapText(selectedDestination.description, locale)}
                </p>
              </div>

              <div className="drawer-header-actions">
                <span
                  className={`drawer-status-badge ${
                    selectedDestination.status === "completed"
                      ? "status-badge-done"
                      : selectedDestination.status === "current"
                      ? "status-badge-current"
                      : "status-badge-upcoming"
                  }`}
                >
                  {selectedDestination.status === "completed" ? (
                    <>
                      <CheckCircle2 size={13} />
                      {locale === "uz"
                        ? "Xazina olib bo'lingan"
                        : locale === "ru"
                        ? "Сокровище получено"
                        : "Treasure Claimed"}
                    </>
                  ) : selectedDestination.status === "current" ? (
                    <>
                      <Anchor size={13} />
                      {locale === "uz"
                        ? "Kema shu yerda turibdi"
                        : locale === "ru"
                        ? "Корабль бросил якорь"
                        : "Voyager Anchored Here"}
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      {locale === "uz"
                        ? "Hali kelinmagan"
                        : locale === "ru"
                        ? "Не исследовано"
                        : "Uncharted Mist"}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* MANZIL ICHIDAGI MAVZULAR: TREASURES */}
            <div className="drawer-treasures-block">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-muted flex items-center gap-2">
                  <Gem size={14} className="text-acid" />
                  {locale === "uz"
                    ? `Bu manzildagi xazinalar (${selectedDestination.treasures.filter((t) => t.completed).length}/${selectedDestination.treasures.length})`
                    : locale === "ru"
                    ? `Сокровища острова (${selectedDestination.treasures.filter((t) => t.completed).length}/${selectedDestination.treasures.length})`
                    : `Island Treasures (${selectedDestination.treasures.filter((t) => t.completed).length}/${selectedDestination.treasures.length})`}
                </span>
              </div>

              <div className="treasures-grid">
                {selectedDestination.treasures.map((treasure) => (
                  <TreasureCard
                    key={treasure.id}
                    treasure={treasure}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TreasureCard({
  treasure,
  locale,
}: {
  treasure: TreasureItem;
  locale: Locale;
}) {
  const IconComponent =
    treasure.type === "gem"
      ? Gem
      : treasure.type === "scroll"
      ? Scroll
      : treasure.type === "key"
      ? Key
      : Shield;

  return (
    <div className={`treasure-card ${treasure.completed ? "collected" : ""}`}>
      <div className="treasure-card-left">
        <div className="treasure-type-icon">
          <IconComponent size={16} />
        </div>
        <div className="treasure-card-info">
          <h4>{treasure.title}</h4>
          <span>
            {treasure.completed
              ? locale === "uz"
                ? "Topilgan xazina"
                : "Claimed"
              : locale === "uz"
              ? "Kutilayotgan mavzu"
              : "In study"}
          </span>
        </div>
      </div>

      <div>
        {treasure.completed ? (
          <CheckCircle2 size={16} className="text-acid" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-[#404844] block" />
        )}
      </div>
    </div>
  );
}
