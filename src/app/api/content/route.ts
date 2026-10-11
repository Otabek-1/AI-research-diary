import { NextResponse } from "next/server";
import { readFilesFromGoogleDrive } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

type PublicFile = { path: string; content: string; encoding?: string };

/**
 * Public content feed used by the home page and the treasure map.
 * Only data that is meant to be public leaves the server: the tree, section names,
 * the roadmap and documents whose status is "published". Drafts, archived notes and
 * unrelated files that happen to live in the Drive folder are never returned.
 */
export async function GET() {
  try {
    const files = await readFilesFromGoogleDrive();
    return NextResponse.json(
      { files: files.filter(isPublic) },
      { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Google Drive content could not be loaded." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

const sharedFiles = new Set(["content/tree.json", "content/sections.json", "content/roadmap.json"]);

function isPublic(file: PublicFile) {
  if (sharedFiles.has(file.path)) return true;
  if (!/^content\/locales\/en\/.+\.json$/.test(file.path)) return false;
  try {
    const document = JSON.parse(Buffer.from(file.content, "base64").toString("utf8")) as { status?: string };
    return document.status === "published";
  } catch {
    return false;
  }
}
