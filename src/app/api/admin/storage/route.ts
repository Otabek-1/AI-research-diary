import { NextResponse } from "next/server";
import { readFilesFromGoogleDrive } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // The editor always needs the latest Drive state, so it skips the short server cache.
    return NextResponse.json(
      { files: await readFilesFromGoogleDrive({ fresh: true }) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Google Drive read failed." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
