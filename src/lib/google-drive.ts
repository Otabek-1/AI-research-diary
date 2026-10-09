type DriveFile = {
  path: string;
  content: string;
  encoding?: "utf8" | "base64";
};

type DriveItem = { id: string; name: string };

const driveApi = "https://www.googleapis.com/drive/v3";
const uploadApi = "https://www.googleapis.com/upload/drive/v3/files";

export function isGoogleDriveConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GOOGLE_DRIVE_FOLDER_ID,
  );
}

export async function syncFilesToGoogleDrive(
  files: DriveFile[],
  deletes: string[],
) {
  if (!isGoogleDriveConfigured()) return { configured: false, files: 0, deletes: 0 };

  const accessToken = await getAccessToken();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID as string;
  let syncedFiles = 0;
  let deletedFiles = 0;

  for (const file of files) {
    const existing = await findFile(accessToken, folderId, file.path);
    await uploadFile(accessToken, folderId, file, existing?.id);
    syncedFiles += 1;
  }
  for (const path of deletes) {
    const existing = await findFile(accessToken, folderId, path);
    if (!existing) continue;
    const response = await fetch(`${driveApi}/files/${encodeURIComponent(existing.id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`Google Drive rejected deletion of ${path}: ${await response.text()}`);
    }
    deletedFiles += 1;
  }

  return { configured: true, files: syncedFiles, deletes: deletedFiles };
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
  const result = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !result.access_token) {
    throw new Error(result.error_description || "Google Drive access token could not be created.");
  }
  return result.access_token;
}

async function findFile(accessToken: string, folderId: string, path: string) {
  const query = `'${escapeQuery(folderId)}' in parents and name = '${escapeQuery(path)}' and trashed = false`;
  const response = await fetch(
    `${driveApi}/files?q=${encodeURIComponent(query)}&pageSize=1&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
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
  const content = file.encoding === "base64"
    ? Buffer.from(file.content, "base64")
    : Buffer.from(file.content, "utf8");
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
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
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!response.ok) throw new Error(`Google Drive rejected ${file.path}: ${await response.text()}`);
}

function escapeQuery(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}
