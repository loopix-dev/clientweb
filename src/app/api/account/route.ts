import type { NextRequest } from "next/server";
import { bad, json, unauthorized } from "@/server/http";
import { currentUser, hashPassword, validPassword, validUsername, verifyPassword } from "@/server/auth";
import { db, publicUser, saveDb } from "@/server/db";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return json({ user: publicUser(user) });
}

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
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
      return bad("Enter a valid email address, or leave it empty.");
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

  saveDb();
  return json({ user: publicUser(user) });
}
