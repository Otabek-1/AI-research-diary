import { NextResponse } from "next/server";
import { readFilesFromGoogleDrive } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(
      { files: await readFilesFromGoogleDrive() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Google Drive content could not be loaded." },
      { status: 502 },
    );
  }
}
