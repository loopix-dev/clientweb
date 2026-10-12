import type { NextRequest } from "next/server";
import { bad, json } from "@/server/http";
import { createSession, hashPassword, setSessionCookie, validPassword, validUsername } from "@/server/auth";
import { db, normalizeUser, publicUser, saveDb, uid, type User } from "@/server/db";

/**
 * Creates the web account (email + password). The very FIRST account becomes
 * the site administrator — every account after that is a regular user.
 * The register page tells the user this up front when it is the first account.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!validUsername(username)) {
    return bad("Username must be 3–16 characters: letters, numbers or underscores.");
  }
  if (!validPassword(password)) {
    return bad("Password must be at least 8 characters.");
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return bad("A valid email address is required to sign in.");
  }

  const d = db();
  if (d.users.some((u) => u.usernameLower === username.toLowerCase())) {
    return bad("That username is already taken.", 409);
  }
  if (d.users.some((u) => u.email?.toLowerCase() === email)) {
    return bad("An account with that email already exists.", 409);
  }

  const user: User = normalizeUser({
    id: uid(),
    username,
    usernameLower: username.toLowerCase(),
    email,
    // Bootstrap: the very first account provisions and manages the site.
    role: d.users.length === 0 ? "admin" : "user",
    status: "active",
    passwordHash: hashPassword(password),
    launcherAccounts: [],
    activeLauncherAccountId: null,
    createdAt: new Date().toISOString(),
  });
  d.users.push(user);
  saveDb();

  const token = await createSession(user.id, "web");
  await setSessionCookie(token);
  return json({ user: publicUser(user), setupRequired: false }, 201);
}
