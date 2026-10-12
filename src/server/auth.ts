import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { db, saveDb, uid, type User } from "./db";

const SESSION_COOKIE = "loopix_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `s1$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "s1" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string, kind: "web" | "api"): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const d = db();
  d.sessions.push({
    id: uid(),
    userId,
    tokenHash: hashToken(token),
    kind,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString(),
  });
  saveDb();
  return token;
}

/**
 * Secure cookies require HTTPS. Set SESSION_SECURE=1 when serving over TLS;
 * left off by default so login also works on plain-HTTP dev/localhost.
 */
const useSecureCookies = process.env.SESSION_SECURE === "1";

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies,
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: useSecureCookies, path: "/", maxAge: 0 });
}

function userFromToken(token: string | undefined, kind: "web" | "api"): User | null {
  if (!token) return null;
  const d = db();
  const session = d.sessions.find((s) => s.tokenHash === hashToken(token) && s.kind === kind);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    d.sessions = d.sessions.filter((s) => s.id !== session.id);
    saveDb();
    return null;
  }

  const user = d.users.find((u) => u.id === session.userId);
  if (!user || user.status === "banned") {
    d.sessions = d.sessions.filter((s) => s.id !== session.id);
    saveDb();
    return null;
  }
  return user;
}

/** Current user from the browser session cookie. */
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  return userFromToken(jar.get(SESSION_COOKIE)?.value, "web");
}

/** Current user from a launcher API request: `Authorization: Bearer <token>` or session cookie. */
export async function currentUserFromRequest(request: Request): Promise<User | null> {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return userFromToken(auth.slice(7).trim(), "api");
  }
  return currentUser();
}

export async function requireAdmin(): Promise<User | null> {
  const user = await currentUser();
  return user?.role === "admin" ? user : null;
}

/** Reads a bearer token for launcher endpoints (login required). */
export function bearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
}

export function tokenUser(token: string | null): User | null {
  return userFromToken(token ?? undefined, "api");
}

export function revokeSessions(userId: string): void {
  const d = db();
  d.sessions = d.sessions.filter((s) => s.userId !== userId);
  saveDb();
}

export function revokeToken(token: string): void {
  const d = db();
  const hash = hashToken(token);
  d.sessions = d.sessions.filter((s) => s.tokenHash !== hash);
  saveDb();
}

export function validUsername(username: string): boolean {
  return /^[A-Za-z0-9_]{3,16}$/.test(username);
}

/** Web sign-in accepts either the email or the username. */
export function findUserByIdentifier(identifier: string): User | null {
  const value = identifier.trim().toLowerCase();
  if (!value) return null;
  return (
    db().users.find(
      (u) => u.usernameLower === value || (u.email !== null && u.email.toLowerCase() === value),
    ) ?? null
  );
}

export function validPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

/** Locale-independent request logging helper. */
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}
