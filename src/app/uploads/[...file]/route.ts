import { NextResponse } from "next/server";
import { readUpload } from "@/server/uploads";

type Params = { params: Promise<{ file: string[] }> };

/**
 * Serves runtime uploads (logo, favicon, screenshots, skins, capes).
 * Files live in data/uploads, so they appear immediately after an upload —
 * unlike public/, which Next.js snapshots at server start.
 */
export async function GET(_request: Request, { params }: Params) {
  const { file } = await params;
  const asset = readUpload(`/uploads/${file.join("/")}`);
  if (!asset) {
    return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return new NextResponse(new Uint8Array(asset.bytes), {
    headers: {
      "Content-Type": asset.type,
      "Cache-Control": "public, max-age=300, must-revalidate",
    },
  });
}

export const dynamic = "force-dynamic";
