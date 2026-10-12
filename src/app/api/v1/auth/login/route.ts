import { bad, forbidden, json, unauthorized } from "@/server/http";
import { createSession, findUserByIdentifier, verifyPassword } from "@/server/auth";
import { publicUser } from "@/server/db";

/**
 * Launcher login. The launcher signs in with the same web credentials
 * (email or username + password) and receives a bearer token it sends as
 * `Authorization: Bearer <token>` on subsequent requests. The response
 * includes the linked launcher (offline) accounts with skin/cape URLs.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const identifier = String(body?.identifier ?? body?.username ?? body?.email ?? "");
  const password = String(body?.password ?? "");

  const user = findUserByIdentifier(identifier);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return unauthorized();
  }
  if (user.status === "banned") {
    return forbidden();
  }

  const token = await createSession(user.id, "api");
  return json({ token, user: publicUser(user) });
}
