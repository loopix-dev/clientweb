import type { NextRequest } from "next/server";
import { clearSessionCookie, hashToken } from "@/server/auth";
import { db, saveDb } from "@/server/db";
import { json } from "@/server/http";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("loopix_session")?.value;
  if (token) {
    const d = db();
    const hash = hashToken(token);
    d.sessions = d.sessions.filter((s) => s.tokenHash !== hash);
    saveDb();
  }
  await clearSessionCookie();
  return json({ ok: true });
}
