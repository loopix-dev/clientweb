import { revalidatePath } from "next/cache";
import { bad, json, unauthorized } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { db, saveDb } from "@/server/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  const d = db();
  const doc = d.docs.find((x) => x.id === id);
  if (!doc) return bad("Document not found.", 404);

  let body: { title?: string; slug?: string; body?: string; published?: boolean };
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return bad("Title cannot be empty.");
    doc.title = title;
  }
  if (body.slug !== undefined) {
    const slug = String(body.slug).trim().toLowerCase();
    if (!/^[a-z0-9-]{2,60}$/.test(slug)) return bad("Slug must be 2–60 characters: lowercase letters, numbers, dashes.");
    if (d.docs.some((x) => x.id !== doc.id && x.slug === slug)) return bad("A document with that slug already exists.", 409);
    doc.slug = slug;
  }
  if (body.body !== undefined) doc.body = String(body.body);
  if (body.published !== undefined) doc.published = Boolean(body.published);
  doc.updatedAt = new Date().toISOString();

  saveDb();
  revalidatePath("/docs");
  revalidatePath(`/docs/${doc.slug}`);
  return json({ doc });
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  const d = db();
  const doc = d.docs.find((x) => x.id === id);
  if (!doc) return bad("Document not found.", 404);

  d.docs = d.docs.filter((x) => x.id !== id);
  saveDb();
  revalidatePath("/docs");
  return json({ ok: true });
}
