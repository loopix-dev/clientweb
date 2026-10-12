import { revalidatePath } from "next/cache";
import { bad, json, unauthorized } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { db, saveDb, uid, type Doc } from "@/server/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  return json({ docs: db().docs });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  let body: { title?: string; slug?: string; body?: string; published?: boolean };
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const title = String(body?.title ?? "").trim();
  const slug = String(body?.slug ?? "").trim().toLowerCase();
  if (!title) return bad("Title is required.");
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) return bad("Slug must be 2–60 characters: lowercase letters, numbers, dashes.");

  const d = db();
  if (d.docs.some((doc) => doc.slug === slug)) return bad("A document with that slug already exists.", 409);

  const doc: Doc = {
    id: uid(),
    slug,
    title,
    body: String(body?.body ?? ""),
    published: Boolean(body?.published),
    updatedAt: new Date().toISOString(),
  };
  d.docs.push(doc);
  saveDb();
  revalidatePath("/docs");
  return json({ doc }, 201);
}
