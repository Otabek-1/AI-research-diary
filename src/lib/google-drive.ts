import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

type DriveFile = {
  path: string;
  content: string;
  encoding?: "utf8" | "base64";
};

type DriveItem = { id: string; name: string; mimeType?: string };
export type StoredDriveFile = {
  path: string;
  content: string;
  encoding: "utf8" | "base64";
};

const driveApi = "https://www.googleapis.com/drive/v3";
const CACHE_TTL_MS = 20_000;
let readCache: { at: number; files: StoredDriveFile[] } | null = null;
let readInFlight: Promise<StoredDriveFile[]> | null = null;
const uploadApi = "https://www.googleapis.com/upload/drive/v3/files";

/**
 * Local development without Google credentials: set LOCAL_CONTENT_DIR to a folder that
 * mirrors the Drive layout (content/tree.json, content/locales/en/*.json, ...).
 * The same read/save code paths then work against the file system.
 */
function localRoot() {
  const dir = process.env.LOCAL_CONTENT_DIR?.trim();
  return dir ? resolve(dir) : null;
}

export function isGoogleDriveConfigured() {
  return Boolean(localRoot()) || Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GOOGLE_DRIVE_FOLDER_ID,
  );
}

export async function syncFilesToGoogleDrive(files: DriveFile[], deletes: string[]) {
  if (!isGoogleDriveConfigured()) {
    return { configured: false, files: 0, deletes: 0 };
  }

  const root = localRoot();
  if (root) return syncFilesToLocalDirectory(root, files, deletes);

  const accessToken = await getAccessToken();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID as string;
  let syncedFiles = 0;
  let deletedFiles = 0;
  // A path that is uploaded in this request must never be deleted by the same request,
  // otherwise the file that was just written would disappear again.
  const uploaded = new Set(files.map((file) => file.path));
  const pendingDeletes = deletes.filter((path) => !uploaded.has(path));

  try {
    for (const file of files) {
      const existing = await findFile(accessToken, folderId, file.path);
      await uploadFile(accessToken, folderId, file, existing?.id);
      syncedFiles += 1;
    }
    for (const path of pendingDeletes) {
      const existing = await findFile(accessToken, folderId, path);
      if (!existing) continue;
      const response = await fetch(`${driveApi}/files/${encodeURIComponent(existing.id)}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + accessToken },
      });
      if (!response.ok && response.status !== 404) {
        throw new Error(`Google Drive rejected deletion of ${path}: ${await response.text()}`);
      }
      deletedFiles += 1;
    }
  } finally {
    // Whatever happened, the cached listing may now be stale.
    readCache = null;
  }

  return { configured: true, files: syncedFiles, deletes: deletedFiles };
}

export async function readFilesFromGoogleDrive(options: { fresh?: boolean } = {}): Promise<StoredDriveFile[]> {
  if (!isGoogleDriveConfigured()) {
    throw new Error("Google Drive storage is not configured on the server.");
  }
  if (!options.fresh && readCache && Date.now() - readCache.at < CACHE_TTL_MS) return readCache.files;
  if (!options.fresh && readInFlight) return readInFlight;

  const task = loadAllFiles().then((files) => {
    readCache = { at: Date.now(), files };
    return files;
  });
  if (!options.fresh) {
    readInFlight = task;
    task.then(
      () => { readInFlight = null; },
      () => { readInFlight = null; },
    );
  }
  return task;
}

async function loadAllFiles(): Promise<StoredDriveFile[]> {
  const root = localRoot();
  if (root) return readLocalDirectory(root);
  const accessToken = await getAccessToken();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID as string;
  const query = `'${escapeQuery(folderId)}' in parents and trashed = false`;
  const items: DriveItem[] = [];
  let pageToken: string | undefined;

  do {
    const url =
      `${driveApi}/files?q=${encodeURIComponent(query)}&pageSize=1000` +
      `&fields=nextPageToken,files(id,name,mimeType)` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");
    const response = await fetch(url, { headers: { Authorization: "Bearer " + accessToken } });
    if (!response.ok) throw new Error(`Google Drive listing failed: ${await response.text()}`);
    const result = (await response.json()) as { files?: DriveItem[]; nextPageToken?: string };
    items.push(...(result.files ?? []));
    pageToken = result.nextPageToken;
  } while (pageToken);

  // Download in small parallel batches instead of one request after another.
  const files: StoredDriveFile[] = [];
  const batchSize = 8;
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const loaded = await Promise.all(
      batch.map(async (file) => {
        const contentResponse = await fetch(
          `${driveApi}/files/${encodeURIComponent(file.id)}?alt=media`,
          { headers: { Authorization: "Bearer " + accessToken } },
        );
        if (!contentResponse.ok) {
          throw new Error(`Google Drive could not read ${file.name}: ${await contentResponse.text()}`);
        }
        const content = Buffer.from(await contentResponse.arrayBuffer()).toString("base64");
        return { path: file.name, content, encoding: "base64" } as StoredDriveFile;
      }),
    );
    files.push(...loaded);
  }
  return files;
}

async function getAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN as string,
      grant_type: "refresh_token",
    }),
  });
  const result = (await response.json()) as {
    access_token?: string;
    error_description?: string;
  };
  if (!response.ok || !result.access_token) {
    throw new Error(result.error_description || "Google Drive access token could not be created.");
  }
  return result.access_token;
}

async function findFile(accessToken: string, folderId: string, path: string) {
  const query = `'${escapeQuery(folderId)}' in parents and name = '${escapeQuery(path)}' and trashed = false`;
  const response = await fetch(
    `${driveApi}/files?q=${encodeURIComponent(query)}&pageSize=1&fields=files(id,name)`,
    { headers: { Authorization: "Bearer " + accessToken } },
  );
  if (!response.ok) throw new Error(`Google Drive lookup failed: ${await response.text()}`);
  const result = (await response.json()) as { files?: DriveItem[] };
  return result.files?.[0];
}

async function uploadFile(
  accessToken: string,
  folderId: string,
  file: DriveFile,
  fileId?: string,
) {
  const metadata = {
    name: file.path,
    mimeType: file.path.endsWith(".json") ? "application/json" : "application/octet-stream",
    ...(fileId ? {} : { parents: [folderId] }),
  };
  const boundary = `field-notes-${crypto.randomUUID()}`;
  const content =
    file.encoding === "base64"
      ? Buffer.from(file.content, "base64")
      : Buffer.from(file.content, "utf8");
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    ),
    Buffer.from(`--${boundary}\r\nContent-Type: ${metadata.mimeType}\r\n\r\n`),
    content,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const endpoint = fileId
    ? `${uploadApi}/${encodeURIComponent(fileId)}?uploadType=multipart`
    : `${uploadApi}?uploadType=multipart`;
  const response = await fetch(endpoint, {
    method: fileId ? "PATCH" : "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!response.ok) {
    throw new Error(`Google Drive rejected ${file.path}: ${await response.text()}`);
  }
}

function escapeQuery(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

async function readLocalDirectory(root: string): Promise<StoredDriveFile[]> {
  const files: StoredDriveFile[] = [];
  async function walk(directory: string) {
    let entries: string[] = [];
    try {
      entries = await readdir(directory);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = join(directory, name);
      const info = await stat(full);
      if (info.isDirectory()) await walk(full);
      else {
        const path = full.slice(root.length + 1).split(sep).join("/");
        files.push({ path, content: (await readFile(full)).toString("base64"), encoding: "base64" });
      }
    }
  }
  await walk(root);
  return files;
}

async function syncFilesToLocalDirectory(root: string, files: DriveFile[], deletes: string[]) {
  const uploaded = new Set(files.map((file) => file.path));
  const target = (path: string) => {
    const full = resolve(root, path);
    if (!full.startsWith(root + sep)) throw new Error(`Refusing to write outside the content directory: ${path}`);
    return full;
  };
  for (const file of files) {
    const full = target(file.path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, Buffer.from(file.content, file.encoding === "base64" ? "base64" : "utf8"));
  }
  let deleted = 0;
  for (const path of deletes.filter((item) => !uploaded.has(item))) {
    await rm(target(path), { force: true });
    deleted += 1;
  }
  readCache = null;
  return { configured: true, files: files.length, deletes: deleted };
}
