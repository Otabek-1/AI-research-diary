import { readFilesFromGoogleDrive } from "@/lib/google-drive";
import { Document, Locale, Tree, TreeNode } from "@/lib/content";

type DriveContent = {
  documents: { en: Document[] };
  tree: Tree;
  labels: Record<string, Partial<Record<Locale, string>>>;
};

export async function getDriveContent(): Promise<DriveContent> {
  const files = await readFilesFromGoogleDrive();
  const decode = (content: string) =>
    JSON.parse(Buffer.from(content, "base64").toString("utf8"));
  const documents: { en: Document[] } = { en: [] };

  for (const file of files) {
    if (file.path.match(/^content\/locales\/en\/.+\.json$/)) {
      documents.en.push(decode(file.content) as Document);
    }
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

export function getDriveDocuments(content: DriveContent) {
  const ids = new Set(flattenDocumentIds(content.tree.roots));
  return [...ids]
    .map((id) => content.documents.en.find((document) => document.id === id))
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
