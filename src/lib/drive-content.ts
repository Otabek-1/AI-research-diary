import { cache } from "react";
import { readFilesFromGoogleDrive } from "@/lib/google-drive";
import { Document, Locale, Tree, TreeNode } from "@/lib/content";

export type DriveContent = {
  documents: { en: Document[] };
  tree: Tree;
  labels: Record<string, Partial<Record<Locale, string>>>;
};

function decode<T>(content: string): T | null {
  try {
    return JSON.parse(Buffer.from(content, "base64").toString("utf8")) as T;
  } catch {
    // A single malformed file must not take the whole site down.
    return null;
  }
}

// `cache` de-duplicates the call inside one request (generateMetadata + the page itself).
export const getDriveContent = cache(async (): Promise<DriveContent> => {
  const files = await readFilesFromGoogleDrive();
  const documents: { en: Document[] } = { en: [] };

  for (const file of files) {
    if (!/^content\/locales\/en\/.+\.json$/.test(file.path)) continue;
    const document = decode<Document>(file.content);
    if (document && document.id && document.slug && Array.isArray(document.content)) {
      documents.en.push(document);
    }
  }
  const treeFile = files.find((file) => file.path === "content/tree.json");
  const sectionsFile = files.find((file) => file.path === "content/sections.json");
  const tree = (treeFile && decode<Tree>(treeFile.content)) || {
    schemaVersion: 1,
    updatedAt: new Date().toISOString().slice(0, 10),
    roots: [],
  };
  const labels = (sectionsFile && decode<{ sections?: DriveContent["labels"] }>(sectionsFile.content)?.sections) || {};

  return { documents, tree, labels };
});

export function getDriveDocuments(content: DriveContent) {
  const byId = new Map(content.documents.en.map((document) => [document.id, document]));
  const ids = new Set(flattenDocumentIds(content.tree.roots));
  return [...ids]
    .map((id) => byId.get(id))
    .filter((document): document is Document => Boolean(document && document.status === "published"));
}

export function getDriveDocument(content: DriveContent, slug: string) {
  return getDriveDocuments(content).find(
    (document) => document.slug === slug || document.id === slug,
  );
}

export function getDriveSectionLabel(content: DriveContent, section: string) {
  return section
    .split("/")
    .map((part) => content.labels[part]?.en ?? part.replace(/-/g, " "))
    .join(" / ");
}

function flattenDocumentIds(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.documentIds ?? []),
    ...(node.children ? flattenDocumentIds(node.children) : []),
  ]);
}
