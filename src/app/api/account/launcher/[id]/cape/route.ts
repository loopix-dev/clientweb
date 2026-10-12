import { bad, json, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { publicUser, saveDb } from "@/server/db";
import { removeUpload, saveImageUpload } from "@/server/uploads";

type Params = { params: Promise<{ id: string }> };

/** Upload (or replace) the cape of a linked launcher account. */
export async function POST(request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const account = user.launcherAccounts.find((a) => a.id === id);
  if (!account) return bad("Launcher account not found.", 404);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Expected multipart form data with a `file` field.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return bad("Missing `file` field.");

  const result = await saveImageUpload(file as File, "capes", account.id);
  if ("error" in result) return bad(result.error);

  account.capeUrl = result.url;
  account.updatedAt = new Date().toISOString();
  saveDb();
  return json({ user: publicUser(user), account });
}

/** Remove the cape of a linked launcher account. */
export async function DELETE(_request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const account = user.launcherAccounts.find((a) => a.id === id);
  if (!account) return bad("Launcher account not found.", 404);

  removeUpload(account.capeUrl);
  account.capeUrl = null;
  account.updatedAt = new Date().toISOString();
  saveDb();
  return json({ user: publicUser(user), account });
}
