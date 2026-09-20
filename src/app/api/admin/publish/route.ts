import { NextResponse } from "next/server";

type PublishFile = { path: string; content: string; encoding?: "utf8" | "base64" };
type GitRef = { object?: { sha?: string } };
type GitCommit = { tree?: { sha?: string } };

export async function POST(request: Request) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "master";
  if (!token || !owner || !repo) return NextResponse.json({ error: "GitHub publishing is not configured on the server." }, { status: 503 });
  try {
    const body = (await request.json()) as { files?: PublishFile[]; deletes?: string[]; message?: string };
    const files = body.files ?? [];
    const deletes = body.deletes ?? [];
    if (!files.length && !deletes.length) return NextResponse.json({ error: "No files to publish." }, { status: 400 });
    if (files.some((file) => !safePath(file.path) || !file.content) || deletes.some((path) => !safePath(path))) return NextResponse.json({ error: "Invalid publish file." }, { status: 400 });
    const api = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" };
    const ref = await github<GitRef>(`${api}/git/ref/heads/${encodeURIComponent(branch)}`, { headers });
    const headSha = ref.object?.sha;
    if (!headSha) return NextResponse.json({ error: `Branch ${branch} was not found.` }, { status: 404 });
    const head = await github<GitCommit>(`${api}/git/commits/${headSha}`, { headers });
    const baseTree = head.tree?.sha;
    if (!baseTree) return NextResponse.json({ error: "GitHub did not return the current tree." }, { status: 502 });
    const entries: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
    for (const file of files) {
      const blob = await github<{ sha: string }>(`${api}/git/blobs`, { method: "POST", headers, body: JSON.stringify({ content: file.content, encoding: file.encoding === "base64" ? "base64" : "utf-8" }) });
      entries.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
    }
    for (const path of deletes) entries.push({ path, mode: "100644", type: "blob", sha: null });
    const tree = await github<{ sha: string }>(`${api}/git/trees`, { method: "POST", headers, body: JSON.stringify({ base_tree: baseTree, tree: entries }) });
    const commit = await github<{ sha: string }>(`${api}/git/commits`, { method: "POST", headers, body: JSON.stringify({ message: body.message || "Update research archive", tree: tree.sha, parents: [headSha] }) });
    await github(`${api}/git/refs/heads/${encodeURIComponent(branch)}`, { method: "PATCH", headers, body: JSON.stringify({ sha: commit.sha, force: false }) });
    return NextResponse.json({ ok: true, commit: commit.sha, files: files.map((file) => file.path), deletes, branch });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Publish failed." }, { status: 500 }); }
}

function safePath(path: string) { return Boolean(path) && !path.startsWith("/") && !path.includes("..") && !path.includes("\\"); }
async function github<T = unknown>(url: string, init: RequestInit): Promise<T> { const response = await fetch(url, init); if (!response.ok) throw new Error(`GitHub request failed (${response.status}): ${await response.text()}`); return await response.json() as T; }
