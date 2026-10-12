import type { NextRequest } from "next/server";
import { bad, json, unauthorized } from "@/server/http";
import {
  currentUserFromRequest,
  hashPassword,
  validPassword,
  validUsername,
  verifyPassword,
} from "@/server/auth";
import { db, normalizeUser, publicUser, saveDb } from "@/server/db";

/** Launcher account access via `Authorization: Bearer <token>`. */
export async function GET(request: Request) {
  const user = await currentUserFromRequest(request);
  if (!user) return unauthorized();
  return json({ user: publicUser(user) });
}

/**
 * PATCH profile fields (requires `currentPassword`) or switch the active
 * launcher account with `{ activeAccountId }` (no password needed).
 */
export async function PATCH(request: NextRequest) {
  const user = await currentUserFromRequest(request);
  if (!user) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  // Switch active launcher account — allowed without a password so the
  // launcher can flip profiles freely after signing in once.
  if (body?.activeAccountId !== undefined) {
    const id = String(body.activeAccountId);
    if (!user.launcherAccounts.some((a) => a.id === id)) {
      return bad("Launcher account not found.", 404);
    }
    user.activeLauncherAccountId = id;
    saveDb();
    return json({ user: publicUser(user) });
  }

  const username = body?.username === undefined ? undefined : String(body.username).trim();
  const email = body?.email === undefined ? undefined : String(body.email).trim();
  const newPassword = body?.newPassword === undefined ? undefined : String(body.newPassword);
  const currentPassword = String(body?.currentPassword ?? "");

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return bad("Current password is incorrect.", 403);
  }

  const d = db();

  if (username !== undefined && username !== user.username) {
    if (!validUsername(username)) {
      return bad("Username must be 3–16 characters: letters, numbers or underscores.");
    }
    if (d.users.some((u) => u.id !== user.id && u.usernameLower === username.toLowerCase())) {
      return bad("That username is already taken.", 409);
    }
    user.username = username;
    user.usernameLower = username.toLowerCase();
  }

  if (email !== undefined) {
    const value = email || null;
    if (value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      return bad("Enter a valid email address.");
    }
    if (value && d.users.some((u) => u.id !== user.id && u.email?.toLowerCase() === value.toLowerCase())) {
      return bad("An account with that email already exists.", 409);
    }
    user.email = value;
  }

  if (newPassword !== undefined) {
    if (!validPassword(newPassword)) {
      return bad("New password must be at least 8 characters.");
    }
    user.passwordHash = hashPassword(newPassword);
  }

  normalizeUser(user);
  saveDb();
  return json({ user: publicUser(user) });
}
