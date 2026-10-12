import { bad, json, unauthorized } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { db, saveDb } from "@/server/db";
import { getStatus } from "@/server/minecraft";
import { cleanServerFields, serverFieldErrors } from "@/server/servers";
import { removeUpload } from "@/server/uploads";

type Params = { params: Promise<{ id: string }> };

function findServer(id: string) {
  return db().servers.find((s) => s.id === id) ?? null;
}

/**
 * PATCH /api/admin/servers/[id] — edit fields / toggle `enabled`, or move the
 * entry with `{ order: <targetIndex> }` (array order = launcher order).
 */
export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  const server = findServer(id);
  if (!server) return bad("Server not found.", 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const d = db();

  // Reordering: splice the entry to its target index.
  if (typeof body.order === "number") {
    const from = d.servers.indexOf(server);
    const to = Math.max(0, Math.min(d.servers.length - 1, Math.round(body.order)));
    if (from !== to) {
      d.servers.splice(from, 1);
      d.servers.splice(to, 0, server);
    }
    saveDb();
    return json({ server });
  }

  const fields = cleanServerFields({
    name: typeof body.name === "string" ? body.name : server.name,
    address: typeof body.address === "string" ? body.address : server.address,
    description: typeof body.description === "string" ? body.description : server.description,
    version: typeof body.version === "string" ? body.version : server.version,
  });
  const error = serverFieldErrors(fields);
  if (error) return bad(error);

  const addressChanged = fields.address !== server.address;
  Object.assign(server, fields);
  if (typeof body.enabled === "boolean") server.enabled = body.enabled;
  saveDb();

  // A changed address invalidates the cached status — re-ping immediately.
  const status = await getStatus(server.id, server.address, addressChanged);
  return json({ server, status });
}

/** DELETE /api/admin/servers/[id] — remove the server and its icon file. */
export async function DELETE(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  const server = findServer(id);
  if (!server) return bad("Server not found.", 404);

  removeUpload(server.iconUrl);
  const d = db();
  d.servers.splice(d.servers.indexOf(server), 1);
  saveDb();

  return json({ ok: true });
}
