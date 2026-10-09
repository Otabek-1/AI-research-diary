import { NextResponse } from "next/server";
import { isGoogleDriveConfigured, syncFilesToGoogleDrive } from "@/lib/google-drive";

type PublishFile = { path: string; content: string; encoding?: "utf8" | "base64" };

export async function POST(request: Request) {
  if (!isGoogleDriveConfigured()) {
    return NextResponse.json(
      { error: "Google Drive storage is not configured on the server." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      files?: PublishFile[];
      deletes?: string[];
    };
    const files = body.files ?? [];
    const deletes = [...new Set(body.deletes ?? [])];

    if (!files.length && !deletes.length) {
      return NextResponse.json({ error: "No files to save." }, { status: 400 });
    }
    if (
      files.some(
        (file) =>
          !file ||
          !safePath(file.path) ||
          typeof file.content !== "string" ||
          !file.content,
      ) ||
      deletes.some((path) => !safePath(path))
    ) {
      return NextResponse.json({ error: "Invalid storage file." }, { status: 400 });
    }

    const drive = await syncFilesToGoogleDrive(files, deletes);
    return NextResponse.json({
      ok: true,
      storage: "google-drive",
      files: files.map((file) => file.path),
      deletes,
      drive,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Google Drive save failed.",
      },
      { status: 502 },
    );
  }
}

function safePath(path: string) {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    (path.startsWith("content/") || path.startsWith("public/")) &&
    !path.startsWith("/") &&
    !path.includes("..") &&
    !path.includes("\\")
  );
}
