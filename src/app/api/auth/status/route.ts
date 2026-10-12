import { json } from "@/server/http";
import { db } from "@/server/db";

/**
 * Whether the site still needs its first (administrator) account.
 * Used by the register screen to explain the bootstrap honestly.
 */
export async function GET() {
  return json({ setupRequired: db().users.length === 0 });
}
