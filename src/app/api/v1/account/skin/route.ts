import { bad, json, unauthorized } from "@/server/http";
import { currentUserFromRequest } from "@/server/auth";
import { publicUser, saveDb, type User } from "@/server/db";
import { removeUpload, saveImageUpload } from "@/server/uploads";

/** Target account: explicit `accountId` form field, else the active one. */
function targetAccount(user: User, form: FormData | null, query: URLSearchParams) {
  const id = form?.get("accountId") ?? query.get("accountId");
  const wanted = typeof id === "string" && id ? id : user.activeLauncherAccountId;
  const account = user.launcherAccounts.find((a) => a.id === wanted);
  return account ?? null;
}

/** Launcher uploads a skin for one of its linked accounts (bearer token). */
export async function POST(request: Request) {
  const user = await currentUserFromRequest(request);
  if (!user) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Expected multipart form data with a `file` field.");
  }

  const account = targetAccount(user, form, new URLSearchParams());
  if (!account) return bad("No launcher account selected. Add one on the website first.", 400);

  const file = form.get("file");
  if (!(file instanceof File)) return bad("Missing `file` field.");

  const result = await saveImageUpload(file as File, "skins", account.id);
  if ("error" in result) return bad(result.error);

  account.skinUrl = result.url;
  account.updatedAt = new Date().toISOString();
  saveDb();
  return json({ user: publicUser(user), account });
}

/** Launcher removes the skin (optional `?accountId=`). */
export async function DELETE(request: Request) {
  const user = await currentUserFromRequest(request);
  if (!user) return unauthorized();

  const account = targetAccount(user, null, new URL(request.url).searchParams);
  if (!account) return bad("No launcher account selected.", 400);

  removeUpload(account.skinUrl);
  account.skinUrl = null;
  account.updatedAt = new Date().toISOString();
  saveDb();
  return json({ user: publicUser(user), account });
}
