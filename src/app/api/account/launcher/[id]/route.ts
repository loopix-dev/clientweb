import { bad, json, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { normalizeUser, publicUser, saveDb } from "@/server/db";
import { removeUpload } from "@/server/uploads";

type Params = { params: Promise<{ id: string }> };

/** Rename a linked launcher account. */
export async function PATCH(request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const account = user.launcherAccounts.find((a) => a.id === id);
  if (!account) return bad("Launcher account not found.", 404);

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
  if (user.launcherAccounts.some((a) => a.id !== id && a.nameLower === name.toLowerCase())) {
    return bad("That launcher account is already linked.", 409);
  }

  account.name = name;
  account.nameLower = name.toLowerCase();
  account.updatedAt = new Date().toISOString();
  saveDb();
  return json({ user: publicUser(user), account });
}

/** Unlink a launcher account (its skin and cape files are removed too). */
export async function DELETE(_request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const account = user.launcherAccounts.find((a) => a.id === id);
  if (!account) return bad("Launcher account not found.", 404);

  removeUpload(account.skinUrl);
  removeUpload(account.capeUrl);
  user.launcherAccounts = user.launcherAccounts.filter((a) => a.id !== id);
  normalizeUser(user);
  saveDb();
  return json({ user: publicUser(user) });
}
