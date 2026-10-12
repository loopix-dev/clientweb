import { bad, json, unauthorized } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { db, saveDb } from "@/server/db";
import { removeUpload, saveImageUpload } from "@/server/uploads";

type Params = { params: Promise<{ id: string }> };

function findServer(id: string) {
  return db().servers.find((s) => s.id === id) ?? null;
}

/** POST /api/admin/servers/[id]/icon — upload (or replace) the server icon. */
export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  const server = findServer(id);
  if (!server) return bad("Server not found.", 404);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Expected multipart form data with a `file` field.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) return bad("Missing `file` field.");

  const previous = server.iconUrl;
  const result = await saveImageUpload(file as File, "servers", server.id);
  if ("error" in result) return bad(result.error);

  // The extension may differ from the previous icon — clear the old file.
  if (previous && previous !== result.url) removeUpload(previous);

  server.iconUrl = result.url;
  saveDb();
  return json({ iconUrl: result.url });
}

/** DELETE /api/admin/servers/[id]/icon — remove the icon. */
export async function DELETE(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  const server = findServer(id);
  if (!server) return bad("Server not found.", 404);

  removeUpload(server.iconUrl);
  server.iconUrl = null;
  saveDb();
  return json({ ok: true });
}
