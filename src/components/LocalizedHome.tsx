"use client";

import Link from "next/link";
import { ArrowUpRight, GitBranch, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  blockText,
  Document,
  getDocuments,
  getTree,
  getUi,
  Locale,
  sectionLabel,
  Tree,
  TreeNode,
} from "@/lib/content";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TreasureHeroSection } from "@/components/TreasureHeroSection";
import {
  RoadmapData,
  defaultRoadmap,
  parseRoadmapFromFiles,
} from "@/lib/roadmap";

export default function LocalizedHome({ locale }: { locale: Locale }) {
  const ui = getUi(locale).ui;
  const [driveDocuments, setDriveDocuments] = useState<Document[] | null>(null);
  const [driveTree, setDriveTree] = useState<Tree | null>(null);
  const [driveLabels, setDriveLabels] = useState<Record<string, string> | null>(null);
  const [driveRoadmap, setDriveRoadmap] = useState<RoadmapData | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function loadDriveContent() {
      try {
        const response = await fetch("/api/content", { cache: "no-store" });
        if (!response.ok) throw new Error("Google Drive content could not be loaded.");
        const result = await response.json() as {
          files?: { path: string; content: string }[];
        };
        const decode = (content: string) =>
          JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(content), (char) => char.charCodeAt(0))));
        const files = result.files ?? [];
        const treeFile = files.find((file) => file.path === "content/tree.json");
        const sectionsFile = files.find((file) => file.path === "content/sections.json");
        const driveTree = treeFile ? decode(treeFile.content) as Tree : undefined;
        const documentIds = new Set(flattenTreeDocumentIds(driveTree?.roots ?? []));
        const localized = new Map<string, Document>();
        const fallback = new Map<string, Document>();
        for (const file of files) {
          const match = file.path.match(/^content\/locales\/(en|uz|ru)\/.+\.json$/);
          if (!match) continue;
          const document = decode(file.content) as Document;
          if (document.status !== "published" || !documentIds.has(document.id)) continue;
          if (match[1] === locale) localized.set(document.id, document);
          if (match[1] === "en") fallback.set(document.id, document);
        }
        const documents = [...documentIds]
          .map((id) => localized.get(id) ?? fallback.get(id))
          .filter((document): document is Document => Boolean(document));
        const liveRoadmap = parseRoadmapFromFiles(files);
        if (liveRoadmap) setDriveRoadmap(liveRoadmap);
        if (cancelled) return;
        setDriveDocuments(documents);
        if (driveTree) setDriveTree(driveTree);
        if (sectionsFile) {
          const sections = (decode(sectionsFile.content) as { sections?: Record<string, Partial<Record<Locale, string>>> }).sections ?? {};
          setDriveLabels(Object.fromEntries(Object.entries(sections).map(([id, names]) => [id, names[locale] ?? names.en ?? id])));
        }
      } catch {
        if (!cancelled) setDriveDocuments([]);
      }
    }
    void loadDriveContent();
    return () => { cancelled = true; };
  }, [locale]);
  const documents = driveDocuments ?? getDocuments(locale);
  const knowledgeTree = driveTree
    ? { ...driveTree, roots: localizeDriveTree(driveTree.roots, driveLabels ?? {}) }
    : getTree(locale);
  const activeRoadmap = driveRoadmap ?? defaultRoadmap;
  const firstDocument = documents[0];
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const results = normalized
    ? documents.filter((document) =>
        `${document.title} ${document.description} ${document.tags.join(" ")} ${document.content.map(blockText).join(" ")}`
          .toLowerCase()
          .includes(normalized),
      )
    : [];

  return (
    <div className="site-wrapper">
      <div className="site-shell">
        <header className="topbar">
          <Link className="wordmark" href={`/${locale}`}>
            FIELD / NOTES<span>01</span>
          </Link>
          <nav className="public-nav" aria-label="Primary navigation">
            <Link href={`/${locale}/treasure-map`}>
              {ui.treasureMap ?? "Treasure Map"}
            </Link>
            <a href="#archive">{ui.archive}</a>
            <a href="#map">{ui.map}</a>
            <a href="#about">{ui.about}</a>
          </nav>
          <LanguageSwitcher locale={locale} />
          <button
            className="icon-button"
            aria-label={ui.search}
            onClick={() => document.getElementById("search")?.focus()}
          >
            <Search size={17} />
          </button>
        </header>
      </div>

      {/* Main page Treasure Map Roadmap Hero Section: FULL-WIDTH (containerdan tashqarida) */}
      <TreasureHeroSection locale={locale} roadmap={activeRoadmap} />

      <main className="site-shell">
        <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="pulse" /> Personal research laboratory / 2026
          </p>
          <h1>
            A living map of things <em>worth understanding.</em>
          </h1>
          <p className="hero-description">
            Notes on artificial intelligence, mathematics, and the strange distance between an idea and its implementation.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#archive">
              {ui.explore} <ArrowUpRight size={16} />
            </a>
            <a className="text-link" href="#map">
              {ui.viewMap} <GitBranch size={15} />
            </a>
          </div>
        </div>
        <div className="graph-art" aria-label="Abstract connected knowledge graph" role="img">
          <div className="graph-label graph-label-a">representation</div>
          <div className="graph-label graph-label-b">optimization</div>
          <div className="graph-label graph-label-c">curiosity</div>
          <span className="node node-a" />
          <span className="node node-b" />
          <span className="node node-c" />
          <span className="node node-d" />
          <span className="node node-e" />
          <span className="line line-a" />
          <span className="line line-b" />
          <span className="line line-c" />
          <span className="line line-d" />
        </div>
      </section>

      <section className="signal-strip">
        <div>
          <span className="strip-number">{String(documents.length).padStart(2, "0")}</span>
          <span>{ui.published}</span>
        </div>
        <div>
          <span className="strip-number">00</span>
          <span>{ui.active}</span>
        </div>
        <div>
          <span className="strip-number">00</span>
          <span>{ui.questions}</span>
        </div>
      </section>

      <section className="archive-section" id="archive">
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
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ui.search}
            aria-label={ui.search}
          />
          <kbd>{ui.searchHint}</kbd>
        </div>
        {query && (
          <div className="search-results">
            {results.length ? (
              results.map((document) => (
                <Link key={document.id} href={`/${locale}/research/${document.slug}`} className="search-result">
                  <span>{driveLabels?.[document.section] ?? sectionLabel(document.section, locale)}</span>
                  <strong>{document.title}</strong>
                  <p>{document.description}</p>
                </Link>
              ))
            ) : (
              <p className="empty-state">{ui.noResults}</p>
            )}
          </div>
        )}
        {!query && (
          <div className="document-list">
            {documents.length ? (
              documents.map((document, index) => (
                <Link href={`/${locale}/research/${document.slug}`} className="document-row" key={document.id}>
                  <span className="doc-index">0{index + 1}</span>
                  <div className="doc-main">
                    <span className="doc-section">{driveLabels?.[document.section] ?? sectionLabel(document.section, locale)}</span>
                    <h3>{document.title}</h3>
                    <p>{document.description}</p>
                  </div>
                  <div className="doc-meta">
                    <span>{document.updatedAt}</span>
                    <ArrowUpRight size={17} />
                  </div>
                </Link>
              ))
            ) : (
              <p className="empty-state">{ui.noResults}</p>
            )}
          </div>
        )}
      </section>

      <section className="map-section" id="map">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / {ui.structure}</p>
            <h2>{ui.where}</h2>
          </div>
          {firstDocument && (
            <Link className="text-link" href={`/${locale}/research/${firstDocument.slug}`}>
              {ui.openThread} <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
        <div className="tree-preview">
          {knowledgeTree.roots.map((root) => (
            <div className="tree-root" key={root.id}>
              <div className="tree-title">
                <span className="tree-mark" />
                {root.title}
              </div>
              <TreeDocuments node={root} documents={documents} locale={locale} />
              {root.children?.map((child) => (
                <div className="tree-child" key={child.id}>
                  <span className="branch" />
                  {child.title}
                  <TreeDocuments node={child} documents={documents} locale={locale} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="about-section" id="about">
        <Sparkles size={18} />
        <div>
          <p className="eyebrow">{ui.desk}</p>
          <h2>{ui.aboutTitle}</h2>
          <p>{ui.aboutText}</p>
        </div>
      </section>
      <footer className="footer">
        <span>FIELD / NOTES</span>
        <span>{ui.archiveNote}</span>
      </footer>
    </main>
    </div>
  );
}

function TreeDocuments({
  node,
  documents,
  locale,
}: {
  node: TreeNode;
  documents: ReturnType<typeof getDocuments>;
  locale: Locale;
}) {
  return (
    <>
      {node.documentIds?.map((id) => {
        const document = documents.find((item) => item.id === id);
        return document ? (
          <Link href={`/${locale}/research/${document.slug}`} key={id} className="tree-document">
            {document.title} <ArrowUpRight size={13} />
          </Link>
        ) : null;
      })}
      {node.children?.map((child) => (
        <TreeDocuments node={child} documents={documents} locale={locale} key={child.id} />
      ))}
    </>
  );
}

function localizeDriveTree(nodes: TreeNode[], labels: Record<string, string>): TreeNode[] {
  return nodes.map((node) => ({
    ...node,
    title: labels[node.id] ?? node.title,
    children: node.children ? localizeDriveTree(node.children, labels) : node.children,
  }));
}

function flattenTreeDocumentIds(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.documentIds ?? []),
    ...(node.children ? flattenTreeDocumentIds(node.children) : []),
  ]);
}
