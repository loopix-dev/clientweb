import { bad, json, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { normalizeUser, publicUser, saveDb, uid, MAX_LAUNCHER_ACCOUNTS, type LauncherAccount } from "@/server/db";

/**
 * Link an offline launcher profile to the web account.
 * The first one added becomes the active account automatically.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const name = String(body?.name ?? "").trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) {
    return bad("Launcher name must be 3–16 characters: letters, numbers or underscores.");
  }
  if (user.launcherAccounts.length >= MAX_LAUNCHER_ACCOUNTS) {
    return bad(`You can link up to ${MAX_LAUNCHER_ACCOUNTS} launcher accounts.`, 409);
  }
  if (user.launcherAccounts.some((a) => a.nameLower === name.toLowerCase())) {
    return bad("That launcher account is already linked.", 409);
  }

  const now = new Date().toISOString();
  const account: LauncherAccount = {
    id: uid(),
    name,
    nameLower: name.toLowerCase(),
    skinUrl: null,
    capeUrl: null,
    createdAt: now,
    updatedAt: now,
  };
  user.launcherAccounts.push(account);
  if (!user.activeLauncherAccountId) user.activeLauncherAccountId = account.id;
  normalizeUser(user);
  saveDb();

  return json({ user: publicUser(user), account }, 201);
}
