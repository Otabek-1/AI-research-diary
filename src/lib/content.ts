import enUi from "@/locales/en.json";
import uzUi from "@/locales/uz.json";
import ruUi from "@/locales/ru.json";
import sharedTree from "../../content/tree.json";

export const locales = ["en", "uz", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: number; id: string; text: string }
  | { type: "callout"; tone: "note" | "idea" | "warning"; title: string; text: string }
  | { type: "code"; language: string; text: string }
  | { type: "quote"; text: string }
  | { type: "divider"; text: string }
  | { type: "image"; src: string; alt: string; caption: string; assetPath?: string };
export type Document = { schemaVersion: number; id: string; slug: string; title: string; description: string; status: "idea" | "draft" | "in-progress" | "published" | "archived"; createdAt: string; publishedAt?: string; updatedAt: string; section: string; tags: string[]; content: ContentBlock[]; related: string[]; references: { title: string; author?: string; type: string; url?: string }[]; seo: { title: string; description: string } };
export type TreeNode = { id: string; title: string; children?: TreeNode[]; documentIds?: string[] };
export type Tree = { schemaVersion: number; updatedAt: string; roots: TreeNode[] };

const enDocuments = import.meta.glob("../../content/locales/en/*.json", { eager: true, import: "default" });
const uzDocuments = import.meta.glob("../../content/locales/uz/*.json", { eager: true, import: "default" });
const ruDocuments = import.meta.glob("../../content/locales/ru/*.json", { eager: true, import: "default" });
const visibleStatuses = new Set<Document["status"]>(["published", "in-progress"]);
const docs: Record<Locale, Document[]> = {
  en: collectDocuments(enDocuments),
  uz: collectDocuments(uzDocuments),
  ru: collectDocuments(ruDocuments),
};
const sharedStructure = sharedTree as unknown as Tree;
const ui = { en: enUi, uz: uzUi, ru: ruUi };

export function isLocale(value: string): value is Locale { return locales.includes(value as Locale); }
export function getLocale(value?: string): Locale { return value && isLocale(value) ? value : defaultLocale; }
export function getUi(locale: Locale) { return ui[locale]; }
export function getDocuments(locale: Locale) {
  const visibleIds = new Set(flattenTreeDocumentIds(sharedStructure));

  return flattenTreeDocumentIds(sharedStructure)
    .map((id) => getLocalizedDocumentById(id, locale))
    .filter((document): document is Document => {
      if (!document) return false;

      return (
        visibleStatuses.has(document.status) &&
        visibleIds.has(document.id)
      );
    });
}
export function getDocument(slug: string, locale: Locale) { return getDocuments(locale).find((document) => document.slug === slug || document.id === slug) ?? (locale !== defaultLocale ? getDocuments(defaultLocale).find((document) => document.slug === slug || document.id === slug) : undefined); }
export function getTree(locale: Locale) { return localizeTree(sharedStructure, locale); }
export function getTranslationStatus(id: string) { return locales.reduce((status, locale) => ({ ...status, [locale]: docs[locale].some((document) => document.id === id) }), {} as Record<Locale, boolean>); }
export function blockText(block: ContentBlock) { return "text" in block ? block.text : `${block.alt} ${block.caption}`; }
export function readingTime(document: Document) { const words = document.content.map(blockText).join(" ").split(/\s+/).filter(Boolean).length; return Math.max(1, Math.ceil(words / 190)); }
const sectionNames: Record<Locale, Record<string, string>> = { en: { "ai-research": "AI Research", foundations: "Foundations", "deep-learning": "Deep Learning" }, uz: { "ai-research": "AI tadqiqotlari", foundations: "Asoslar", "deep-learning": "Chuqur o'rganish" }, ru: { "ai-research": "Исследования ИИ", foundations: "Основы", "deep-learning": "Глубокое обучение" } };
export function sectionLabel(section: string, locale: Locale = defaultLocale) { return section.split("/").map((part) => sectionNames[locale][part] ?? part.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())).join(" / "); }
function flattenTreeDocumentIds(tree: Tree): string[] { return tree.roots.flatMap((node) => [...(node.documentIds ?? []), ...(node.children ? flattenTreeDocumentIds({ ...tree, roots: node.children }) : [])]); }
function localizeTree(shared: Tree, locale: Locale): Tree { const localize = (nodes: TreeNode[]): TreeNode[] => nodes.map((node) => { const translatedDocument = docs[locale].find((document) => document.id === node.id); const translatedTitle = sectionNames[locale][node.id] ?? translatedDocument?.title ?? node.title; return { ...node, title: translatedTitle, children: node.children ? localize(node.children) : node.children }; }); return { ...shared, roots: localize(shared.roots) }; }
function collectDocuments(modules: Record<string, unknown>): Document[] {
  return Object.entries(modules)
    .filter(([path]) => !path.endsWith("/tree.json"))
    .map(([, module]) => module)
    .filter((document): document is Document => isDocument(document));
}
function isDocument(value: unknown): value is Document {
  return Boolean(value && typeof value === "object" && "id" in value && "slug" in value && "content" in value && Array.isArray((value as Document).content));
}
function getLocalizedDocumentById(id: string, locale: Locale) {
  return docs[locale].find((document) => document.id === id) ?? docs[defaultLocale].find((document) => document.id === id) ?? locales.flatMap((code) => docs[code]).find((document) => document.id === id);
}
