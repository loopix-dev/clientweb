import fs from "node:fs";
import path from "node:path";

/**
 * Uploads live in data/uploads (NOT public/) because Next.js snapshots the
 * public directory when the server starts — files added while the server is
 * running would 404. They are served by app/uploads/[...file]/route.ts.
 */
const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

/** Detects PNG (always) and SVG (for logos). Returns the extension or null. */
export function detectImageType(bytes: Uint8Array): "png" | "svg" | null {
  if (bytes.length >= 4 && Buffer.from(bytes.slice(0, 4)).equals(PNG_MAGIC)) return "png";
  const head = Buffer.from(bytes.slice(0, 512)).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) return "svg";
  return null;
}

/** Rejects path traversal; returns the safe relative path or null. */
function safeRelative(url: string | null): string | null {
  if (!url || !url.startsWith("/uploads/")) return null;
  const rel = url.slice("/uploads/".length);
  if (!rel || rel.includes("..") || rel.includes("\\")) return null;
  return rel;
}

/**
 * Validates an uploaded image and writes it to data/uploads/<dir>/<name>.<ext>.
 * `name` must be a safe identifier (no path separators) — callers pass user ids
 * or fixed names, never client-controlled paths.
 */
export async function saveImageUpload(
  file: File,
  dir: string,
  name: string,
): Promise<{ url: string } | { error: string }> {
  if (file.size > MAX_BYTES) return { error: "Image is larger than 2 MB." };

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImageType(bytes);
    if (!type) return { error: "Only PNG or SVG images are allowed." };

    const targetDir = path.join(UPLOAD_ROOT, dir);
    fs.mkdirSync(targetDir, { recursive: true });
    const filePath = path.join(targetDir, `${name}.${type}`);
    fs.writeFileSync(filePath, Buffer.from(bytes));
    return { url: `/uploads/${dir}/${name}.${type}` };
  } catch {
    return { error: "Could not read the uploaded file." };
  }
}

/** Reads an uploaded file back from disk (dynamic favicon + /uploads route). */
export function readUpload(url: string | null): { bytes: Buffer; type: string } | null {
  const rel = safeRelative(url);
  if (!rel) return null;
  const filePath = path.join(UPLOAD_ROOT, rel);
  if (!fs.existsSync(filePath)) return null;
  const bytes = fs.readFileSync(filePath);
  return { bytes, type: rel.endsWith(".svg") ? "image/svg+xml" : "image/png" };
}

/** Deletes an uploaded file (used when a user removes their skin/cape). */
export function removeUpload(url: string | null): void {
  const rel = safeRelative(url);
  if (!rel) return;
  fs.rmSync(path.join(UPLOAD_ROOT, rel), { force: true });
}
