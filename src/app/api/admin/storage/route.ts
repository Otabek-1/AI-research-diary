import { NextResponse } from "next/server";
import { readFilesFromGoogleDrive } from "@/lib/google-drive";

export async function GET() {
  try {
    return NextResponse.json({ files: await readFilesFromGoogleDrive() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Google Drive read failed." },
      { status: 502 },
    );
  }
}
