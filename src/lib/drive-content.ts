import { readFilesFromGoogleDrive } from "@/lib/google-drive";
import { Document, Locale, Tree, TreeNode } from "@/lib/content";

type DriveContent = {
  documents: Record<Locale, Document[]>;
  tree: Tree;
  labels: Record<string, Partial<Record<Locale, string>>>;
};

export async function getDriveContent(): Promise<DriveContent> {
  const files = await readFilesFromGoogleDrive();
  const decode = (content: string) =>
    JSON.parse(Buffer.from(content, "base64").toString("utf8"));
  const documents: Record<Locale, Document[]> = { en: [], uz: [], ru: [] };

  for (const file of files) {
    const match = file.path.match(/^content\/locales\/(en|uz|ru)\/.+\.json$/);
    if (match) documents[match[1] as Locale].push(decode(file.content) as Document);
  }
  const treeFile = files.find((file) => file.path === "content/tree.json");
  const sectionsFile = files.find((file) => file.path === "content/sections.json");
  const tree = treeFile
    ? (decode(treeFile.content) as Tree)
    : { schemaVersion: 1, updatedAt: new Date().toISOString().slice(0, 10), roots: [] };
  const labels = sectionsFile
    ? (decode(sectionsFile.content) as { sections?: DriveContent["labels"] }).sections ?? {}
    : {};

  return { documents, tree, labels };
}

export function getDriveDocuments(content: DriveContent, locale: Locale) {
  const ids = new Set(flattenDocumentIds(content.tree.roots));
  const localized = content.documents[locale];
  const fallback = content.documents.en;
  return [...ids]
    .map((id) => localized.find((document) => document.id === id) ?? fallback.find((document) => document.id === id))
    .filter((document): document is Document => Boolean(document && document.status === "published"));
}

export function getDriveDocument(content: DriveContent, slug: string, locale: Locale) {
  return getDriveDocuments(content, locale).find(
    (document) => document.slug === slug || document.id === slug,
  );
}

export function getDriveSectionLabel(content: DriveContent, section: string, locale: Locale) {
  return section
    .split("/")
    .map((part) => content.labels[part]?.[locale] ?? content.labels[part]?.en ?? part.replace(/-/g, " "))
    .join(" / ");
}

function flattenDocumentIds(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.documentIds ?? []),
    ...(node.children ? flattenDocumentIds(node.children) : []),
  ]);
}
