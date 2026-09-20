import enUi from "@/locales/en.json";
import uzUi from "@/locales/uz.json";
import ruUi from "@/locales/ru.json";
import enTree from "../../content/locales/en/tree.json";
import uzTree from "../../content/locales/uz/tree.json";
import ruTree from "../../content/locales/ru/tree.json";
import enMachineLearning from "../../content/locales/en/machine-learning.json";
import enNeuralNetworks from "../../content/locales/en/neural-networks.json";
import enGradientDescent from "../../content/locales/en/gradient-descent.json";
import uzMachineLearning from "../../content/locales/uz/machine-learning.json";
import uzNeuralNetworks from "../../content/locales/uz/neural-networks.json";
import uzGradientDescent from "../../content/locales/uz/gradient-descent.json";
import ruMachineLearning from "../../content/locales/ru/machine-learning.json";
import ruNeuralNetworks from "../../content/locales/ru/neural-networks.json";
import ruGradientDescent from "../../content/locales/ru/gradient-descent.json";

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

const docs: Record<Locale, Document[]> = {
  en: [enMachineLearning, enNeuralNetworks, enGradientDescent],
  uz: [uzMachineLearning, uzNeuralNetworks, uzGradientDescent],
  ru: [ruMachineLearning, ruNeuralNetworks, ruGradientDescent],
} as unknown as Record<Locale, Document[]>;
const trees: Record<Locale, Tree> = { en: enTree, uz: uzTree, ru: ruTree } as unknown as Record<Locale, Tree>;
const ui = { en: enUi, uz: uzUi, ru: ruUi };

export function isLocale(value: string): value is Locale { return locales.includes(value as Locale); }
export function getLocale(value?: string): Locale { return value && isLocale(value) ? value : defaultLocale; }
export function getUi(locale: Locale) { return ui[locale]; }
export function getDocuments(locale: Locale) { return docs[locale].filter((document) => document.status === "published"); }
export function getDocument(slug: string, locale: Locale) { return docs[locale].find((document) => document.slug === slug && document.status === "published") ?? docs[defaultLocale].find((document) => document.slug === slug && document.status === "published"); }
export function getTree(locale: Locale) { return trees[locale] ?? trees[defaultLocale]; }
export function getTranslationStatus(id: string) { return locales.reduce((status, locale) => ({ ...status, [locale]: docs[locale].some((document) => document.id === id) }), {} as Record<Locale, boolean>); }
export function blockText(block: ContentBlock) { return "text" in block ? block.text : `${block.alt} ${block.caption}`; }
export function readingTime(document: Document) { const words = document.content.map(blockText).join(" ").split(/\s+/).filter(Boolean).length; return Math.max(1, Math.ceil(words / 190)); }
const sectionNames: Record<Locale, Record<string, string>> = { en: { "ai-research": "AI Research", foundations: "Foundations", "deep-learning": "Deep Learning" }, uz: { "ai-research": "AI tadqiqotlari", foundations: "Asoslar", "deep-learning": "Chuqur o'rganish" }, ru: { "ai-research": "Исследования ИИ", foundations: "Основы", "deep-learning": "Глубокое обучение" } };
export function sectionLabel(section: string, locale: Locale = defaultLocale) { return section.split("/").map((part) => sectionNames[locale][part] ?? part.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())).join(" / "); }
