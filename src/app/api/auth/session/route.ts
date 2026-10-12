import { json } from "@/server/http";
import { currentUser } from "@/server/auth";
import { publicUser } from "@/server/db";

/**
 * Session probe for the navbar. Always answers 200 with `{user}` or
 * `{user: null}` (never a 401) so signed-out visitors produce no console noise.
 */
export async function GET() {
  const user = await currentUser();
  return json({ user: user ? publicUser(user) : null });
}
