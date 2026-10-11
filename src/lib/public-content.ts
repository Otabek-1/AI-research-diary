import type { Document, Tree, TreeNode } from "@/lib/content";
import { parseRoadmapFromFiles, type RoadmapData } from "@/lib/roadmap";

export type PublicContent = {
  documents: Document[];
  tree: Tree | null;
  labels: Record<string, string>;
  roadmap: RoadmapData | null;
};

type FeedFile = { path: string; content: string };

function decodeJson<T>(content: string): T | null {
  try {
    const bytes = Uint8Array.from(atob(content), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

export function flattenTreeDocumentIds(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.documentIds ?? []),
    ...(node.children ? flattenTreeDocumentIds(node.children) : []),
  ]);
}

export function localizeTree(nodes: TreeNode[], labels: Record<string, string>): TreeNode[] {
  return nodes.map((node) => ({
    ...node,
    title: labels[node.id] ?? node.title,
    children: node.children ? localizeTree(node.children, labels) : node.children,
  }));
}

/** Fetches the public feed once and turns it into ready-to-render data. */
export async function loadPublicContent(signal?: AbortSignal): Promise<PublicContent> {
  const response = await fetch("/api/content", { cache: "no-store", signal });
  if (!response.ok) throw new Error("Content could not be loaded.");
  const result = (await response.json()) as { files?: FeedFile[] };
  const files = result.files ?? [];

  const tree = (() => {
    const file = files.find((item) => item.path === "content/tree.json");
    return file ? decodeJson<Tree>(file.content) : null;
  })();
  const labels = (() => {
    const file = files.find((item) => item.path === "content/sections.json");
    const sections = file ? decodeJson<{ sections?: Record<string, { en?: string }> }>(file.content)?.sections : undefined;
    return Object.fromEntries(Object.entries(sections ?? {}).map(([id, names]) => [id, names.en ?? id]));
  })();

  const byId = new Map<string, Document>();
  for (const file of files) {
    if (!/^content\/locales\/en\/.+\.json$/.test(file.path)) continue;
    const document = decodeJson<Document>(file.content);
    if (document?.id && document.status === "published" && Array.isArray(document.content)) {
      byId.set(document.id, document);
    }
  }
  const order = tree ? flattenTreeDocumentIds(tree.roots) : [...byId.keys()];
  const documents = [...new Set(order)]
    .map((id) => byId.get(id))
    .filter((document): document is Document => Boolean(document));

  return { documents, tree, labels, roadmap: parseRoadmapFromFiles(files.map((file) => ({ ...file }))) };
}
