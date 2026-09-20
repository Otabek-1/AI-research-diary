import { NextResponse } from "next/server";

type PublishFile = { path: string; content: string; encoding?: "utf8" | "base64" };

export async function POST(request: Request) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "master";
  if (!token || !owner || !repo) return NextResponse.json({ error: "GitHub publishing is not configured on the server." }, { status: 503 });
  try {
    const body = (await request.json()) as { files?: PublishFile[]; message?: string };
    if (!body.files?.length) return NextResponse.json({ error: "No files to publish." }, { status: 400 });
    if (body.files.some((file) => !file.path || !file.content || file.path.includes(".."))) return NextResponse.json({ error: "Invalid publish file." }, { status: 400 });
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" };
    for (const file of body.files) {
      const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${file.path.split("/").map(encodeURIComponent).join("/")}`;
      const existing = await fetch(`${endpoint}?ref=${encodeURIComponent(branch)}`, { headers });
      const existingData = existing.ok ? (await existing.json()) as { sha?: string } : undefined;
      const response = await fetch(endpoint, { method: "PUT", headers, body: JSON.stringify({ message: body.message || `Update ${file.path}`, content: file.encoding === "base64" ? file.content : Buffer.from(file.content, "utf8").toString("base64"), branch, ...(existingData?.sha ? { sha: existingData.sha } : {}) }) });
      if (!response.ok) { const detail = await response.text(); return NextResponse.json({ error: `GitHub rejected ${file.path}`, detail }, { status: response.status }); }
    }
    return NextResponse.json({ ok: true, files: body.files.map((file) => file.path), branch });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Publish failed." }, { status: 500 }); }
}
