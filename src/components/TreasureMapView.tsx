"use client";

import { useState, useId } from "react";
import Link from "next/link";
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
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { Locale } from "@/lib/content";
import {
  RoadmapData,
  TreasureItem,
  computeRoadmapProgress,
  getRoadmapText,
  resolveTreasureLink,
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

  // Vertical Serpentine Layout Calculations
  // Every destination is spaced down vertically (y increases downward for scrolling)
  // Odd orders go on the left, even orders go on the right (serpentine S-curve)
  const START_Y = 220;
  const STEP_Y = 380;

  const destinationWaypoints = sortedDestinations.map((dest, index) => {
    // Serpentine: left (x: 250) <-> right (x: 750)
    const isLeft = dest.order % 2 === 1;
    const x = isLeft ? 250 : 750;
    const y = START_Y + index * STEP_Y;
    return {
      ...dest,
      coord: { x, y },
      isLeft,
    };
  });

  // Final project is at the very bottom center
  const finalCoord = {
    x: 500,
    y: START_Y + sortedDestinations.length * STEP_Y + 200,
  };
  const totalMapHeight = finalCoord.y + 260;
  const lastDestinationCoord = destinationWaypoints[destinationWaypoints.length - 1]?.coord;
  const mistCenter = lastDestinationCoord
    ? {
        x: (lastDestinationCoord.x + finalCoord.x) / 2,
        y: (lastDestinationCoord.y + finalCoord.y) / 2,
      }
    : null;
  const mistAngle = lastDestinationCoord
    ? Math.atan2(finalCoord.y - lastDestinationCoord.y, finalCoord.x - lastDestinationCoord.x) * (180 / Math.PI)
    : 0;
  const mistLength = lastDestinationCoord
    ? Math.hypot(finalCoord.x - lastDestinationCoord.x, finalCoord.y - lastDestinationCoord.y)
    : 0;

  // Build all sequential points for curved paths
  const allWaypoints = [
    ...destinationWaypoints.map((d) => ({
      id: d.id,
      coord: d.coord,
      status: d.status,
      isFinal: false,
    })),
    {
      id: roadmap.finalProject.id,
      coord: finalCoord,
      status: roadmap.finalProject.status,
      isFinal: true,
    },
  ];

  // Build vertical serpentine cubic Bezier curved path
  function buildVerticalCurvePath(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
  ) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // Cubic bezier with vertical bias for serpentine S-turns
    const cx1 = p1.x + dx * 0.15;
    const cy1 = p1.y + dy * 0.52;
    const cx2 = p2.x - dx * 0.15;
    const cy2 = p1.y + dy * 0.48;

    return `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
  }

  return (
    <div className="treasure-map-experience">
      {/* Scroll indicator prompt */}
      <div className="flex items-center justify-center gap-2 py-3 text-muted font-mono text-xs uppercase tracking-wider mb-2">
        <span>
          {locale === "uz"
            ? "↓ Pastga scroll qilib sarguzasht marshrutini kuzating"
            : locale === "ru"
            ? "↓ Листайте вниз для просмотра маршрута экспедиции"
            : "↓ Scroll down to voyage through the expedition"}
        </span>
        <ChevronDown size={14} className="animate-bounce" />
      </div>

      {/* Main Vertical Scrolling Maritime Map Canvas Container */}
      <div
        className="interactive-map-container"
        role="region"
        aria-label="Vertical Interactive Treasure Map"
      >
        <div className="map-cartography-bg">
          {/* Subtle Grid overlay */}
          <div className="treasure-grid-overlay" />

          {/* Top Compass Rose */}
          <div className="treasure-compass-rose">
            <div className="compass-ring" />
            <div className="compass-star" />
            <span className="compass-dir dir-n">N</span>
            <span className="compass-dir dir-e">E</span>
            <span className="compass-dir dir-s">S</span>
            <span className="compass-dir dir-w">W</span>
          </div>

          {/* SVG Map Canvas with full dynamic vertical height */}
          <svg
            className="map-svg-surface"
            viewBox={`0 0 1000 ${totalMapHeight}`}
            style={{ width: "100%", height: "auto" }}
          >
            <defs>
              <filter id={glowFilterId} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id="nodeActiveGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c7ed6b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#c7ed6b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="finalGoldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e5a875" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#e5a875" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="reefGradient" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="#1a2820" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0b110e" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="unchartedMistGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9ba99c" stopOpacity="0.04" />
                <stop offset="50%" stopColor="#d8ded4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#9ba99c" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {/* Maritime Latitude / Longitude Depth Markings along map */}
            {Array.from({ length: Math.floor(totalMapHeight / 300) }).map((_, i) => (
              <g key={`coord-line-${i}`} opacity="0.3">
                <line
                  x1="40"
                  y1={150 + i * 300}
                  x2="960"
                  y2={150 + i * 300}
                  stroke="#2b3830"
                  strokeWidth="0.8"
                  strokeDasharray="4 8"
                />
                <text
                  x="50"
                  y={145 + i * 300}
                  fill="#8e918d"
                  fontSize="9"
                  fontFamily="DM Mono, monospace"
                >
                  LAT {10 + i * 8}°N // UNCHARTED SEA
                </text>
              </g>
            ))}

            {/* CURVED DASHED SERPENTINE PATHS */}
            {allWaypoints.slice(0, -1).map((currentPoint, index) => {
              const nextPoint = allWaypoints[index + 1];
              const pathD = buildVerticalCurvePath(currentPoint.coord, nextPoint.coord);
              const isSegmentDone = currentPoint.status === "completed";

              return (
                <g key={`vpath-${currentPoint.id}-${nextPoint.id}`}>
                  {/* Backdrop shadow line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#070a08"
                    strokeWidth="6"
                    opacity="0.9"
                  />
                  {/* Actual dashed route: green if done, gray if upcoming */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isSegmentDone ? "#c7ed6b" : "rgba(142, 145, 141, 0.45)"}
                    strokeWidth={isSegmentDone ? "3.5" : "2.2"}
                    strokeDasharray={isSegmentDone ? "9 8" : "6 8"}
                    className={isSegmentDone ? "route-curved-done" : "route-curved-upcoming"}
                    filter={isSegmentDone ? `url(#${glowFilterId})` : undefined}
                  />
                </g>
              );
            })}

            {/* DESTINATION ISLAND NODES (Spread vertically) */}
            {destinationWaypoints.map((dest) => {
              const { x: cx, y: cy } = dest.coord;
              const isSelected = !selectedIsFinal && selectedDestination?.id === dest.id;
              const isDone = dest.status === "completed";
              const isCurrent = dest.status === "current";
              const titleStr = getRoadmapText(dest.title, locale);

              // Position for side treasure preview tag (if island on left -> tag on right, else tag on left)
              const tagX = dest.isLeft ? cx + 65 : cx - 275;

              return (
                <g key={dest.id} className="map-destination-group">
                  {/* Outer reef / shoal contour rings */}
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx="80"
                    ry="55"
                    fill="url(#reefGradient)"
                  />
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx="68"
                    ry="45"
                    fill="none"
                    stroke={isDone || isCurrent ? "rgba(199, 237, 107, 0.25)" : "rgba(80, 95, 88, 0.2)"}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />

                  {/* Island Node Trigger Button */}
                  <g
                    transform={`translate(${cx}, ${cy})`}
                    className="map-node-trigger"
                    onClick={() => {
                      setSelectedDestinationId(dest.id);
                      setSelectedIsFinal(false);
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${titleStr} (${dest.status})`}
                  >
                    {/* Glowing Aura if active/done/current */}
                    {(isDone || isCurrent || isSelected) && (
                      <circle
                        r={isCurrent ? "56" : "42"}
                        fill="url(#nodeActiveGlow)"
                        className={isCurrent ? "animate-pulse" : ""}
                      />
                    )}

                    {/* Selection Dash Ring */}
                    {isSelected && (
                      <circle
                        r="34"
                        fill="none"
                        stroke="#c7ed6b"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Island Core Circle */}
                    <circle
                      r="22"
                      fill={isDone ? "#18261e" : isCurrent ? "#1f2d24" : "#131715"}
                      stroke={isDone ? "#c7ed6b" : isCurrent ? "#c7ed6b" : "#45504a"}
                      strokeWidth={isDone || isCurrent ? "3" : "2"}
                    />

                    {/* Done Icon: Checkmark */}
                    {isDone && (
                      <g transform="translate(-10, -10)">
                        <path
                          d="M 4 11 L 8 15 L 16 6"
                          fill="none"
                          stroke="#c7ed6b"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    )}

                    {/* Current Icon: Pulsing Core + Large Voyager Ship Anchored */}
                    {isCurrent && (
                      <>
                        <circle r="6" fill="#c7ed6b" />
                        {/* Beautiful Anchored Ship on this island */}
                        <g
                          transform="translate(0, -42)"
                          className="voyager-ship-anchor"
                        >
                          {/* Ship Hull */}
                          <path
                            d="M -22 18 Q 0 30 22 18 L 26 8 Q 0 12 -26 8 Z"
                            fill="#c7ed6b"
                          />
                          {/* Main Mast & Sails */}
                          <path d="M 0 -12 L 0 18" stroke="#ffffff" strokeWidth="2.5" />
                          <path
                            d="M 0 -10 L 18 -2 L 0 6 Z"
                            fill="#c7ed6b"
                            opacity="0.95"
                          />
                          <path
                            d="M 0 -6 L -16 0 L 0 6 Z"
                            fill="#a3e635"
                            opacity="0.8"
                          />
                          {/* Pennant Flag */}
                          <polygon points="0,-12 9,-15 0,-18" fill="#e5a875" />
                          <circle cx="0" cy="-12" r="2" fill="#ffd166" />
                        </g>
                      </>
                    )}

                    {/* Upcoming Icon: Lock */}
                    {!isDone && !isCurrent && (
                      <g transform="translate(-6, -7)" opacity="0.6">
                        <rect x="0" y="5" width="12" height="9" rx="1.5" fill="#8e918d" />
                        <path
                          d="M 3 5 L 3 3 Q 6 0 9 3 L 9 5"
                          fill="none"
                          stroke="#8e918d"
                          strokeWidth="1.8"
                        />
                      </g>
                    )}

                    {/* Destination Label */}
                    <text
                      y="40"
                      textAnchor="middle"
                      fill={isDone || isCurrent ? "#e9e7df" : "#8e918d"}
                      fontSize="14"
                      fontWeight="500"
                      fontFamily="Newsreader, serif"
                      className="select-none pointer-events-none"
                    >
                      0{dest.order}. {titleStr}
                    </text>

                    {/* Status Pill Badge */}
                    {isDone && (
                      <text
                        y="56"
                        textAnchor="middle"
                        fill="#c7ed6b"
                        fontSize="10"
                        fontFamily="DM Mono, monospace"
                        fontWeight="bold"
                        letterSpacing="0.08em"
                        className="select-none pointer-events-none"
                      >
                        ✓ TREASURE CLAIMED
                      </text>
                    )}
                    {isCurrent && (
                      <text
                        y="56"
                        textAnchor="middle"
                        fill="#e5a875"
                        fontSize="10"
                        fontFamily="DM Mono, monospace"
                        fontWeight="bold"
                        letterSpacing="0.08em"
                        className="select-none pointer-events-none"
                      >
                        ⚓ VOYAGER ANCHORED HERE
                      </text>
                    )}
                    {!isDone && !isCurrent && (
                      <text
                        y="56"
                        textAnchor="middle"
                        fill="#8e918d"
                        fontSize="9"
                        fontFamily="DM Mono, monospace"
                        letterSpacing="0.06em"
                        className="select-none pointer-events-none"
                      >
                        UNCHARTED TERRITORY
                      </text>
                    )}
                  </g>

                  {/* SIDE FLOATING TREASURE PREVIEW CARD ON MAP */}
                  <g
                    transform={`translate(${tagX}, ${cy - 50})`}
                    className="island-treasure-tag cursor-pointer"
                    onClick={() => {
                      setSelectedDestinationId(dest.id);
                      setSelectedIsFinal(false);
                    }}
                  >
                    <rect
                      width="210"
                      height="100"
                      rx="6"
                      fill="#121814"
                      stroke={isSelected ? "#c7ed6b" : "#243228"}
                      strokeWidth="1.2"
                      opacity="0.95"
                    />
                    <text
                      x="14"
                      y="24"
                      fill="#8e918d"
                      fontSize="9"
                      fontFamily="DM Mono, monospace"
                      letterSpacing="0.06em"
                    >
                      ISLAND TREASURES ({dest.treasures.filter((t) => t.completed).length}/{dest.treasures.length})
                    </text>
                    {dest.treasures.slice(0, 3).map((tr, trIdx) => {
                      const trLink = resolveTreasureLink(tr, locale);
                      return (
                        <g
                          key={tr.id}
                          transform={`translate(14, ${44 + trIdx * 19})`}
                          className={trLink ? "cursor-pointer" : ""}
                          onClick={(e) => {
                            if (trLink) {
                              e.stopPropagation();
                              if (trLink.startsWith("http")) {
                                window.open(trLink, "_blank");
                              } else {
                                window.location.href = trLink;
                              }
                            }
                          }}
                        >
                          <circle
                            r="3"
                            cx="3"
                            cy="-3"
                            fill={tr.completed ? "#c7ed6b" : "#505854"}
                          />
                          <text
                            x="12"
                            y="0"
                            fill={tr.completed ? "#c7ed6b" : "#b0b3ae"}
                            fontSize="10"
                            fontFamily="DM Sans, sans-serif"
                            className={trLink ? "underline" : ""}
                          >
                            {tr.title.length > 22 ? tr.title.slice(0, 20) + "…" : tr.title}
                            {trLink ? " ↗" : ""}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </g>
              );
            })}

            {/* UNCHARTED MIST BETWEEN THE LAST WAYPOINT AND FINAL TREASURE */}
            {mistCenter && (
              <g
                className="uncharted-mist"
                transform={`translate(${mistCenter.x}, ${mistCenter.y}) rotate(${mistAngle})`}
                aria-label="Uncharted mist concealing future destinations"
              >
                <rect
                  x={-mistLength / 2}
                  y="-62"
                  width={mistLength}
                  height="124"
                  rx="62"
                  fill="url(#unchartedMistGradient)"
                  filter={`url(#${glowFilterId})`}
                />
                <ellipse cx={-mistLength * 0.28} cy="-12" rx="82" ry="38" fill="#cbd5cb" opacity="0.1" />
                <ellipse cx={0} cy="12" rx="105" ry="46" fill="#e2e7df" opacity="0.13" />
                <ellipse cx={mistLength * 0.28} cy="-8" rx="78" ry="34" fill="#cbd5cb" opacity="0.1" />
                <text
                  y="4"
                  textAnchor="middle"
                  fill="#d8ded4"
                  fontSize="11"
                  fontFamily="DM Mono, monospace"
                  fontWeight="bold"
                  letterSpacing="0.12em"
                  opacity="0.8"
                  transform={`rotate(${-mistAngle})`}
                >
                  UNCHARTED MIST
                </text>
              </g>
            )}

            {/* FINAL TREASURE CITADEL AT THE VERY BOTTOM */}
            {(() => {
              const { x: fx, y: fy } = finalCoord;
              const isDone = roadmap.finalProject.status === "completed";
              const isCurrent = roadmap.finalProject.status === "current";
              const isSelected = selectedIsFinal;
              const finalTitle = getRoadmapText(roadmap.finalProject.title, locale);

              return (
                <g className="map-final-destination-group">
                  {/* Huge Golden Reef Base */}
                  <ellipse
                    cx={fx}
                    cy={fy}
                    rx="120"
                    ry="70"
                    fill="url(#finalGoldGlow)"
                  />
                  <ellipse
                    cx={fx}
                    cy={fy}
                    rx="100"
                    ry="58"
                    fill="none"
                    stroke="rgba(229, 168, 117, 0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                  />

                  {/* Citadel Trigger */}
                  <g
                    transform={`translate(${fx}, ${fy})`}
                    className="map-node-trigger"
                    onClick={() => setSelectedIsFinal(true)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Final Treasure: ${finalTitle}`}
                  >
                    {isSelected && (
                      <circle
                        r="52"
                        fill="none"
                        stroke="#e5a875"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Massive Citadel Base Hexagon */}
                    <polygon
                      points="0,-36 34,-10 24,30 -24,30 -34,-10"
                      fill="#261d15"
                      stroke={isDone ? "#ffd166" : isCurrent ? "#c7ed6b" : "#e5a875"}
                      strokeWidth="3.5"
                    />

                    {/* Grand Crown Icon */}
                    <g transform="translate(-16, -18)">
                      <path
                        d="M 3 24 L 29 24 L 32 10 L 24 15 L 16 4 L 8 15 L 0 10 Z"
                        fill={isDone ? "#ffd166" : "#e5a875"}
                        stroke="#111513"
                        strokeWidth="1.5"
                      />
                      <circle cx="3" cy="9" r="2" fill="#ffd166" />
                      <circle cx="16" cy="3" r="2.5" fill="#ffd166" />
                      <circle cx="29" cy="9" r="2" fill="#ffd166" />
                    </g>

                    {/* Grand Title and Badge */}
                    <text
                      y="52"
                      textAnchor="middle"
                      fill="#e5a875"
                      fontSize="18"
                      fontWeight="500"
                      fontFamily="Newsreader, serif"
                      className="select-none pointer-events-none"
                    >
                      ★ FINAL TREASURE: {finalTitle}
                    </text>
                    <text
                      y="70"
                      textAnchor="middle"
                      fill={isDone ? "#c7ed6b" : "#8e918d"}
                      fontSize="11"
                      fontFamily="DM Mono, monospace"
                      fontWeight="bold"
                      letterSpacing="0.08em"
                      className="select-none pointer-events-none"
                    >
                      {isDone ? "EXPEDITION COMPLETE // REWARD CLAIMED" : "THE ULTIMATE RESEARCH PROJECT"}
                    </text>
                  </g>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* DESTINATION EXPLORER DRAWER / DETAIL PANEL (Sticky on bottom or below map) */}
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

  const targetLink = resolveTreasureLink(treasure, locale);
  const isExternal = Boolean(
    targetLink && (targetLink.startsWith("http://") || targetLink.startsWith("https://")),
  );

  const cardInner = (
    <div
      className={`treasure-card ${treasure.completed ? "collected" : ""} ${
        targetLink ? "hover:border-[#c7ed6b] transition-all cursor-pointer group" : ""
      }`}
    >
      <div className="treasure-card-left">
        <div className="treasure-type-icon group-hover:bg-[#c7ed6b22]">
          <IconComponent size={16} />
        </div>
        <div className="treasure-card-info">
          <h4 className="group-hover:text-[#c7ed6b] transition-colors">{treasure.title}</h4>
          <span className="flex items-center gap-1.5">
            {treasure.completed ? (
              <>
                <span className="text-acid">
                  {locale === "uz" ? "Topilgan xazina" : "Claimed"}
                </span>
                {targetLink && (
                  <span className="text-[10px] text-muted inline-flex items-center gap-0.5">
                    • {locale === "uz" ? "Tadqiqotni o'qish" : "Read note"}
                  </span>
                )}
              </>
            ) : (
              <span>
                {locale === "uz" ? "Kutilayotgan mavzu" : "In study"}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {targetLink && (
          <span
            className="p-1 rounded bg-[#c7ed6b18] text-[#c7ed6b] group-hover:bg-[#c7ed6b] group-hover:text-[#111513] transition-colors inline-flex items-center gap-1 font-mono text-[11px] px-2"
            title="Tadqiqot maqolasini ochish"
          >
            <span>{locale === "uz" ? "O'qish" : "Read"}</span>
            <ArrowUpRight size={13} />
          </span>
        )}
        {treasure.completed ? (
          <CheckCircle2 size={16} className="text-acid flex-shrink-0" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-[#404844] block flex-shrink-0" />
        )}
      </div>
    </div>
  );

  if (targetLink) {
    if (isExternal) {
      return (
        <a
          href={targetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block no-underline"
        >
          {cardInner}
        </a>
      );
    }
    return (
      <Link href={targetLink} className="block no-underline">
        {cardInner}
      </Link>
    );
  }

  return cardInner;
}
