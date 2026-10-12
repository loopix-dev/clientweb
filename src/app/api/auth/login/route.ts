import type { NextRequest } from "next/server";
import { bad, forbidden, json, unauthorized } from "@/server/http";
import { createSession, findUserByIdentifier, setSessionCookie, verifyPassword } from "@/server/auth";
import { db, publicUser } from "@/server/db";

/** Web sign-in with email (or username) + password. */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const identifier = String(body?.identifier ?? body?.username ?? body?.email ?? "");
  const password = String(body?.password ?? "");

  const user = findUserByIdentifier(identifier);
  // Same error for unknown account and wrong password.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return unauthorized();
  }
  if (user.status === "banned") {
    return forbidden();
  }

  const token = await createSession(user.id, "web");
  await setSessionCookie(token);
  return json({ user: publicUser(user), setupRequired: db().users.length === 0 });
}
