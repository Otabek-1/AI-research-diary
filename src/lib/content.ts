import enUi from "@/locales/en.json";
import sharedTree from "../../content/tree.json";
import sectionsFile from "../../content/sections.json";
import { generatedDocuments } from "./generated-content";

export type Locale = "en";
export const defaultLocale: Locale = "en";
export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "markdown"; text: string }
  | { type: "heading"; level: number; id: string; text: string }
  | { type: "callout"; tone: "note" | "idea" | "warning"; title: string; text: string }
  | { type: "code"; language: string; text: string }
  | { type: "quote"; text: string }
  | { type: "divider"; text: string }
  | { type: "image"; src: string; alt: string; caption: string; assetPath?: string };
export type DocumentPresentation = {
  backgroundColor?: string;
  backgroundImage?: string;
  textColor?: string;
  accentColor?: string;
  contentWidth?: number;
  fontScale?: number;
};
export type Document = { schemaVersion: number; id: string; slug: string; title: string; description: string; status: "idea" | "draft" | "in-progress" | "published" | "archived"; createdAt: string; publishedAt?: string; updatedAt: string; section: string; tags: string[]; content: ContentBlock[]; related: string[]; references: { title: string; author?: string; type: string; url?: string }[]; seo: { title: string; description: string }; presentation?: DocumentPresentation };
export type TreeNode = { id: string; title: string; children?: TreeNode[]; documentIds?: string[] };
export type Tree = { schemaVersion: number; updatedAt: string; roots: TreeNode[] };
export type SectionLabels = { schemaVersion: number; updatedAt: string; sections: Record<string, Partial<Record<Locale, string>>> };

const visibleStatuses = new Set<Document["status"]>(["published"]);
const docs: Record<Locale, Document[]> = { en: collectDocuments(generatedDocuments.en) };
const sharedStructure = sharedTree as unknown as Tree;
const sharedSections = (sectionsFile as unknown as SectionLabels | undefined)?.sections ?? {};
const ui = { en: enUi };
export function getSectionLabels() {
  return Object.entries(sharedSections).reduce<Record<string, string>>((labels, [id, names]) => {
    const title = names[defaultLocale];
    if (title) labels[id] = title;
    return labels;
  }, {});
}

export function getLocale(): Locale { return defaultLocale; }
export function getUi() { return ui[defaultLocale]; }
export function getDocuments() {
  const visibleIds = new Set(flattenTreeDocumentIds(sharedStructure));

  return [...visibleIds]
    .map((id) => docs[defaultLocale].find((document) => document.id === id))
    .filter((document): document is Document => {
      if (!document) return false;

      return (
        visibleStatuses.has(document.status) &&
        visibleIds.has(document.id)
      );
    });
}
export function getDocument(slug: string) { return getDocuments().find((document) => document.slug === slug || document.id === slug); }
export function getTree() { return localizeTree(sharedStructure); }
export function blockText(block: ContentBlock) { return "text" in block ? block.text : `${block.alt} ${block.caption}`; }
export function readingTime(document: Document) { const words = document.content.map(blockText).join(" ").split(/\s+/).filter(Boolean).length; return Math.max(1, Math.ceil(words / 190)); }
const sectionNames: Record<string, string> = { "ai-research": "AI Research", foundations: "Foundations", "deep-learning": "Deep Learning" };
export function sectionLabel(section: string) {
  const published = getSectionLabels();
  return section.split("/").map((part) => published[part] ?? sectionNames[part] ?? part.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())).join(" / ");
}
function flattenTreeDocumentIds(tree: Tree): string[] { return tree.roots.flatMap((node) => [...(node.documentIds ?? []), ...(node.children ? flattenTreeDocumentIds({ ...tree, roots: node.children }) : [])]); }
function localizeTree(shared: Tree): Tree {
  const published = getSectionLabels();
  const localize = (nodes: TreeNode[]): TreeNode[] => nodes.map((node) => {
    const title = published[node.id] ?? sectionNames[node.id] ?? node.title;
    return { ...node, title, children: node.children ? localize(node.children) : node.children };
  });
  return { ...shared, roots: localize(shared.roots) };
}
function collectDocuments(modules: readonly unknown[]): Document[] {
  return modules
    .filter((document): document is Document => isDocument(document));
}
function isDocument(value: unknown): value is Document {
  return Boolean(value && typeof value === "object" && "id" in value && "slug" in value && "content" in value && Array.isArray((value as Document).content));
}
