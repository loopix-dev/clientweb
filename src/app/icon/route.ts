import { NextResponse } from "next/server";
import { getContent } from "@/server/content";
import { readUpload } from "@/server/uploads";

const DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#080A07"/><path d="M32 12 46 22v20L32 52 18 42V22z" fill="none" stroke="#A3E635" stroke-width="5" stroke-linejoin="round"/><circle cx="32" cy="34" r="4.5" fill="#A3E635"/></svg>`;

/** Serves the admin-uploaded favicon, or the default Loopix mark. */
export async function GET() {
  const uploaded = readUpload(getContent().brand.faviconUrl);
  if (uploaded) {
    return new NextResponse(new Uint8Array(uploaded.bytes), {
      headers: {
        "Content-Type": uploaded.type,
        "Cache-Control": "public, max-age=300, must-revalidate",
      },
    });
  }
  return new NextResponse(DEFAULT_ICON, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, must-revalidate",
    },
  });
}

export const dynamic = "force-dynamic";
