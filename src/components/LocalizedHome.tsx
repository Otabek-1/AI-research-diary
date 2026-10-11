"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock3, GitBranch, Layers, Search, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  blockText,
  Document,
  formatDate,
  getDocuments,
  getTree,
  getUi,
  readingTime,
  sectionLabel,
  Tree,
  TreeNode,
} from "@/lib/content";
import { TreasureHeroSection } from "@/components/TreasureHeroSection";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { defaultRoadmap, computeRoadmapProgress, RoadmapData } from "@/lib/roadmap";
import { loadPublicContent, localizeTree } from "@/lib/public-content";

type LoadState = "loading" | "ready" | "error";

export default function LocalizedHome() {
  const locale = "en" as const;
  const ui = getUi().ui;
  const [state, setState] = useState<LoadState>("loading");
  const [driveDocuments, setDriveDocuments] = useState<Document[] | null>(null);
  const [driveTree, setDriveTree] = useState<Tree | null>(null);
  const [driveLabels, setDriveLabels] = useState<Record<string, string> | null>(null);
  const [driveRoadmap, setDriveRoadmap] = useState<RoadmapData | null>(null);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string>("all");
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setState("loading");
    try {
      const content = await loadPublicContent(signal);
      if (signal?.aborted) return;
      setDriveDocuments(content.documents);
      setDriveTree(content.tree);
      setDriveLabels(content.labels);
      setDriveRoadmap(content.roadmap);
      setState("ready");
    } catch {
      if (!signal?.aborted) setState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch kicked off on mount
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // The search field advertises "/" as its shortcut, so make it real.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const documents = useMemo(() => driveDocuments ?? getDocuments(), [driveDocuments]);
  const labels = driveLabels;
  const labelFor = useCallback(
    (id: string) => labels?.[id] ?? sectionLabel(id),
    [labels],
  );
  const knowledgeTree: Tree = useMemo(
    () => (driveTree ? { ...driveTree, roots: localizeTree(driveTree.roots, labels ?? {}) } : getTree()),
    [driveTree, labels],
  );
  const activeRoadmap = driveRoadmap ?? defaultRoadmap;
  const progress = computeRoadmapProgress(activeRoadmap);

  const index = useMemo(
    () =>
      documents.map((document) => ({
        document,
        haystack: `${document.title} ${document.description} ${document.tags.join(" ")} ${document.content.map(blockText).join(" ")}`.toLowerCase(),
      })),
    [documents],
  );
  const sectionChips = useMemo(() => {
    const counts = new Map<string, number>();
    documents.forEach((document) => counts.set(document.section, (counts.get(document.section) ?? 0) + 1));
    return [...counts.entries()].map(([id, count]) => ({ id, label: labelFor(id), count }));
  }, [documents, labelFor]);

  const normalized = query.trim().toLowerCase();
  const visible = index
    .filter(({ document, haystack }) => (section === "all" || document.section === section) && (!normalized || haystack.includes(normalized)))
    .map(({ document }) => document);
  const sectionCount = countNodes(knowledgeTree.roots);
  const firstDocument = documents[0];
  const filtering = Boolean(normalized) || section !== "all";

  return (
    <div className="site">
      <a className="skip-link" href="#archive">{ui.skip}</a>
      <SiteHeader>
        <button
          type="button"
          className="icon-button"
          aria-label={ui.search}
          onClick={() => searchRef.current?.focus()}
        >
          <Search size={17} />
        </button>
      </SiteHeader>

      <main>
        <section className="hero">
          <div className="hero-backdrop" aria-hidden="true" />
          <div className="container hero-grid">
            <div className="hero-copy reveal">
              <p className="eyebrow">
                <span className="pulse" /> {ui.heroEyebrow} / 2026
              </p>
              <h1>
                {ui.heroTitleA} <em>{ui.heroTitleB}</em>
              </h1>
              <p className="hero-description">{ui.heroText}</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#archive">
                  {ui.explore} <ArrowRight size={16} />
                </a>
                <a className="button button-ghost" href="#map">
                  {ui.viewMap} <GitBranch size={15} />
                </a>
              </div>
            </div>
            <HeroGraph />
          </div>
        </section>

        <section className="container stats reveal" aria-label="Archive statistics">
          <Stat value={documents.length} label={ui.published} />
          <Stat value={sectionCount} label={ui.sections} />
          <Stat value={`${progress.collectedTreasures}/${progress.totalTreasures}`} label={ui.treasuresFound} accent />
        </section>

        <TreasureHeroSection locale={locale} roadmap={activeRoadmap} />

        <section className="container section" id="archive">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / {ui.archive}</p>
              <h2>{ui.recent}</h2>
            </div>
            <span className="section-note">{ui.sorted}</span>
          </div>

          <div className="search-wrap">
            <Search size={18} />
            <input
              id="search"
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Escape" && setQuery("")}
              placeholder={ui.search}
              aria-label={ui.search}
              autoComplete="off"
            />
            {query ? (
              <button type="button" className="icon-button" aria-label="Clear search" onClick={() => setQuery("")}>
                <X size={16} />
              </button>
            ) : (
              <kbd>{ui.searchHint}</kbd>
            )}
          </div>

          {sectionChips.length > 1 && (
            <div className="chip-row" role="group" aria-label="Filter by section">
              <button type="button" className={`chip${section === "all" ? " is-active" : ""}`} onClick={() => setSection("all")}>
                {ui.allSections} <span>{documents.length}</span>
              </button>
              {sectionChips.map((chip) => (
                <button
                  type="button"
                  key={chip.id}
                  className={`chip${section === chip.id ? " is-active" : ""}`}
                  onClick={() => setSection(chip.id)}
                >
                  {chip.label} <span>{chip.count}</span>
                </button>
              ))}
            </div>
          )}

          {filtering && state === "ready" && (
            <p className="result-count" role="status">
              {visible.length} {ui.resultsFor}
            </p>
          )}

          {state === "loading" && !driveDocuments ? (
            <div className="card-grid" aria-busy="true">
              {[0, 1, 2].map((item) => (
                <div className="doc-card skeleton" key={item} />
              ))}
            </div>
          ) : state === "error" && !documents.length ? (
            <div className="empty-state">
              <p>{ui.loadError}</p>
              <button type="button" className="button button-ghost" onClick={() => void load()}>
                {ui.retry}
              </button>
            </div>
          ) : visible.length ? (
            <div className="card-grid">
              {visible.map((document, position) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  position={position}
                  label={labelFor(document.section)}
                  featured={!filtering && position === 0 && visible.length > 2}
                />
              ))}
            </div>
          ) : (
            <p className="empty-state">{documents.length ? ui.noResults : ui.emptyArchive}</p>
          )}
        </section>

        <section className="container section" id="map">
          <div className="section-heading">
            <div>
              <p className="eyebrow">02 / {ui.structure}</p>
              <h2>{ui.where}</h2>
            </div>
            {firstDocument && (
              <Link className="text-link" href={`/research/${firstDocument.slug}`}>
                {ui.openThread} <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
          {knowledgeTree.roots.length ? (
            <div className="tree-grid">
              {knowledgeTree.roots.map((root) => (
                <div className="tree-card" key={root.id}>
                  <TreeBranch node={root} documents={documents} root />
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">{ui.noTree}</p>
          )}
        </section>

        <section className="container section" id="about">
          <div className="about-card">
            <span className="about-icon"><Sparkles size={20} /></span>
            <div>
              <p className="eyebrow">{ui.desk}</p>
              <h2>{ui.aboutTitle}</h2>
              <p>{ui.aboutText}</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter note={ui.archiveNote} />
    </div>
  );
}

function Stat({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
  const text = typeof value === "number" ? String(value).padStart(2, "0") : value;
  return (
    <div className="stat">
      <span className={`stat-value${accent ? " is-warm" : ""}`}>{text}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function DocumentCard({
  document,
  position,
  label,
  featured,
}: {
  document: Document;
  position: number;
  label: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/research/${document.slug}`}
      className={`doc-card${featured ? " is-featured" : ""}`}
      style={{ animationDelay: `${Math.min(position, 8) * 60}ms` }}
    >
      <div className="doc-card-top">
        <span className="doc-section">{label}</span>
        <span className="doc-index">{String(position + 1).padStart(2, "0")}</span>
      </div>
      <h3>{document.title}</h3>
      <p>{document.description}</p>
      {document.tags.length > 0 && (
        <ul className="tag-list" aria-label="Tags">
          {document.tags.slice(0, 3).map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
      <div className="doc-card-foot">
        <span><Clock3 size={13} /> {readingTime(document)} min</span>
        <span>{formatDate(document.updatedAt)}</span>
        <ArrowUpRight className="doc-arrow" size={18} />
      </div>
    </Link>
  );
}

function TreeBranch({ node, documents, root }: { node: TreeNode; documents: Document[]; root?: boolean }) {
  const own = (node.documentIds ?? [])
    .map((id) => documents.find((item) => item.id === id))
    .filter((item): item is Document => Boolean(item));
  return (
    <div className={root ? "tree-root" : "tree-child"}>
      <div className="tree-title">
        {root ? <Layers size={15} /> : <span className="branch" />}
        {node.title}
      </div>
      {own.map((document) => (
        <Link href={`/research/${document.slug}`} key={document.id} className="tree-document">
          <span>{document.title}</span>
          <ArrowUpRight size={13} />
        </Link>
      ))}
      {node.children?.map((child) => (
        <TreeBranch node={child} documents={documents} key={child.id} />
      ))}
    </div>
  );
}

function countNodes(nodes: TreeNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countNodes(node.children ?? []), 0);
}

function HeroGraph() {
  return (
    <div className="hero-graph reveal" role="img" aria-label="Abstract connected knowledge graph">
      <svg viewBox="0 0 520 440" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="hg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--acid)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--acid)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hg-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--acid)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--warm)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <circle cx="260" cy="220" r="190" fill="url(#hg-glow)" />
        <g className="hg-rings" fill="none" stroke="var(--line)" strokeWidth="1">
          <circle cx="260" cy="220" r="70" />
          <circle cx="260" cy="220" r="130" strokeDasharray="3 7" />
          <circle cx="260" cy="220" r="190" strokeDasharray="2 9" />
        </g>
        <g className="hg-links" stroke="url(#hg-line)" strokeWidth="1.4" fill="none">
          <path d="M110 140 L260 220" />
          <path d="M260 220 L400 110" />
          <path d="M260 220 L430 280" />
          <path d="M260 220 L170 340" />
          <path d="M110 140 L170 340" strokeDasharray="4 6" />
          <path d="M400 110 L430 280" strokeDasharray="4 6" />
        </g>
        <g className="hg-nodes">
          <Node x={260} y={220} r={13} label="idea" center />
          <Node x={110} y={140} r={8} label="representation" />
          <Node x={400} y={110} r={8} label="optimization" />
          <Node x={430} y={280} r={8} label="curiosity" />
          <Node x={170} y={340} r={8} label="implementation" />
        </g>
      </svg>
    </div>
  );
}

function Node({ x, y, r, label, center }: { x: number; y: number; r: number; label: string; center?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} className={center ? "hg-node is-center" : "hg-node"}>
      <circle r={r + 8} className="hg-halo" />
      <circle r={r} className="hg-core" />
      <text y={r + 22} textAnchor="middle">{label}</text>
    </g>
  );
}
