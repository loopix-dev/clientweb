import { bad, json, unauthorized } from "@/server/http";
import { requireAdmin, revokeSessions } from "@/server/auth";
import { db, publicUser, saveDb } from "@/server/db";
import { removeUpload } from "@/server/uploads";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  const users = db().users.map(publicUser);
  return json({ users });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  let body: { id?: string; role?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const d = db();
  const user = d.users.find((u) => u.id === body.id);
  if (!user) return bad("User not found.", 404);

  if (body.role !== undefined) {
    if (body.role !== "admin" && body.role !== "user") return bad("Role must be `admin` or `user`.");
    if (body.role === "user" && user.role === "admin" && activeAdminCount() <= 1) {
      return bad("You cannot demote the last admin.");
    }
    user.role = body.role;
  }

  if (body.status !== undefined) {
    if (body.status !== "active" && body.status !== "banned") return bad("Status must be `active` or `banned`.");
    if (body.status === "banned" && user.id === admin.id) return bad("You cannot ban yourself.");
    user.status = body.status;
    if (body.status === "banned") revokeSessions(user.id);
  }

  saveDb();
  return json({ user: publicUser(user) });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const id = new URL(request.url).searchParams.get("id");
  const d = db();
  const user = d.users.find((u) => u.id === id);
  if (!user) return bad("User not found.", 404);
  if (user.id === admin.id) return bad("You cannot delete your own account here.");
  if (user.role === "admin" && activeAdminCount() <= 1) return bad("You cannot delete the last admin.");

  // Remove the user's uploaded skin/cape files with the account.
  for (const account of user.launcherAccounts) {
    removeUpload(account.skinUrl);
    removeUpload(account.capeUrl);
  }

  d.users = d.users.filter((u) => u.id !== user.id);
  revokeSessions(user.id);
  saveDb();
  return json({ ok: true });
}

function activeAdminCount(): number {
  return db().users.filter((u) => u.role === "admin" && u.status === "active").length;
}
