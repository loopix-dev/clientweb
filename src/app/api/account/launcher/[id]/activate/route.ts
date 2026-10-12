import { bad, json, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { publicUser, saveDb } from "@/server/db";

type Params = { params: Promise<{ id: string }> };

/** Switch the active launcher profile (the one the launcher uses in-game). */
export async function POST(_request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!user.launcherAccounts.some((a) => a.id === id)) {
    return bad("Launcher account not found.", 404);
  }

  user.activeLauncherAccountId = id;
  saveDb();
  return json({ user: publicUser(user) });
}
