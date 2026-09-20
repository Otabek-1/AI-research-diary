import { NextResponse } from "next/server";

type PublishFile = { path: string; content: string; encoding?: "utf8" | "base64" };
type GitHubFile = { sha?: string };

export async function POST(request: Request) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "master";
  if (!token || !owner || !repo) return NextResponse.json({ error: "GitHub publishing is not configured on the server." }, { status: 503 });
  try {
    const body = (await request.json()) as { files?: PublishFile[]; deletes?: string[]; message?: string };
    const files = body.files ?? [];
    const deletes = [...new Set(body.deletes ?? [])];
    if (!files.length && !deletes.length) return NextResponse.json({ error: "No files to publish." }, { status: 400 });
    if (files.some((file) => !safePath(file.path) || !file.content) || deletes.some((path) => !safePath(path))) return NextResponse.json({ error: "Invalid publish file." }, { status: 400 });
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" };
    const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`;
    const commitMessage = body.message || "Update research archive";
    for (const path of deletes) {
      const endpoint = `${base}/${githubPath(path)}`;
      const existing = await fetch(`${endpoint}?ref=${encodeURIComponent(branch)}`, { headers });
      if (existing.status === 404) continue;
      if (!existing.ok) return NextResponse.json({ error: `Could not inspect ${path} before deletion.` }, { status: existing.status });
      const current = await existing.json() as GitHubFile;
      if (!current.sha) return NextResponse.json({ error: `GitHub did not return a SHA for ${path}.` }, { status: 502 });
      const deleted = await fetch(endpoint, { method: "DELETE", headers, body: JSON.stringify({ message: commitMessage, sha: current.sha, branch }) });
      if (!deleted.ok) return NextResponse.json({ error: `GitHub rejected deletion of ${path}.`, detail: await deleted.text() }, { status: deleted.status });
    }
    for (const file of files) {
      const endpoint = `${base}/${githubPath(file.path)}`;
      const existing = await fetch(`${endpoint}?ref=${encodeURIComponent(branch)}`, { headers });
      const current = existing.ok ? await existing.json() as GitHubFile : undefined;
      const saved = await fetch(endpoint, { method: "PUT", headers, body: JSON.stringify({ message: commitMessage, branch, content: file.encoding === "base64" ? file.content : Buffer.from(file.content, "utf8").toString("base64"), ...(current?.sha ? { sha: current.sha } : {}) }) });
      if (!saved.ok) return NextResponse.json({ error: `GitHub rejected ${file.path}.`, detail: await saved.text() }, { status: saved.status });
    }
    return NextResponse.json({ ok: true, files: files.map((file) => file.path), deletes, branch });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Publish failed." }, { status: 500 }); }
}

function safePath(path: string) { return Boolean(path) && !path.startsWith("/") && !path.includes("..") && !path.includes("\\"); }
function githubPath(path: string) { return path.split("/").map(encodeURIComponent).join("/"); }
