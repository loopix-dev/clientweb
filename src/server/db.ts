import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { defaultContent, type Content } from "./content";

export type Role = "user" | "admin";
export type UserStatus = "active" | "banned";

/**
 * An offline launcher profile added by the user (the in-game name shown in
 * Minecraft) with its own synced skin/cape. Distinct from the web account:
 * you sign into the website with email + password, and the launcher syncs
 * these accounts through the API.
 */
export interface LauncherAccount {
  id: string;
  name: string;
  nameLower: string;
  skinUrl: string | null;
  capeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  /** Web account identity (used to sign into the site and the launcher API). */
  username: string;
  usernameLower: string;
  email: string | null;
  role: Role;
  status: UserStatus;
  passwordHash: string;
  /** Launcher (offline) profiles linked to this web account. */
  launcherAccounts: LauncherAccount[];
  activeLauncherAccountId: string | null;
  createdAt: string;
}

/** Per web account limit for linked launcher profiles. */
export const MAX_LAUNCHER_ACCOUNTS = 6;

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  kind: "web" | "api";
  expiresAt: string;
}

export interface Doc {
  id: string;
  slug: string;
  title: string;
  body: string;
  published: boolean;
  updatedAt: string;
}

/** A Minecraft server the admin publishes to the launcher's server list. */
export interface GameServer {
  id: string;
  /** Player-facing name shown in the launcher. */
  name: string;
  /** Real join address: `host`, `host:port` or `[v6]:port` (default port 25565). */
  address: string;
  description: string;
  /** Admin-provided version label, e.g. "1.8 – 1.21". */
  version: string;
  iconUrl: string | null;
  /** Disabled servers are hidden from the launcher but kept here. */
  enabled: boolean;
  createdAt: string;
}

export interface Database {
  users: User[];
  sessions: Session[];
  docs: Doc[];
  servers: GameServer[];
  content: Content;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface CacheEntry {
  data: Database;
  mtimeMs: number;
  size: number;
}

/**
 * The cache lives on globalThis: production bundles give every route its own
 * copy of this module, and a per-module cache would serve stale data across
 * routes (e.g. an admin write in /api/* not visible to a page render).
 * The mtime/size check also picks up manual edits to data/db.json.
 */
const GLOBAL_KEY = "__loopixDbCache__";
const store = globalThis as Record<string, unknown>;

const getCache = (): CacheEntry | null => (store[GLOBAL_KEY] as CacheEntry | null) ?? null;
const setCache = (entry: CacheEntry | null): void => {
  store[GLOBAL_KEY] = entry;
};

function seedDocs(): Doc[] {
  const now = new Date().toISOString();
  return [
    {
      id: "doc-getting-started",
      slug: "getting-started",
      title: "Getting started",
      body: [
        "# Getting started",
        "",
        "Loopix Client is a cleaner launcher for Minecraft.",
        "",
        "## 1. Download",
        "Open the **Download** page and pick your device: PC or Mobile. If a build is not published yet, the page says so — only official builds are linked.",
        "",
        "## 2. Install",
        "Run the installer and follow the steps shown on screen.",
        "",
        "## 3. Sign in",
        "Create your Loopix web account on this site (email + password). In the **Dashboard**, link the offline player name your launcher uses, then sign in inside the launcher — it picks up the name, skin and cape automatically.",
        "",
        "## Support",
        "Check the [FAQ](/faq) or use the community channels linked in the footer.",
      ].join("\n"),
      published: true,
      updatedAt: now,
    },
    {
      id: "doc-privacy",
      slug: "privacy",
      title: "Privacy policy",
      body: [
        "# Privacy policy",
        "",
        "*This page is a placeholder. Replace it in the admin panel (Docs) with your real privacy policy before publishing.*",
        "",
        "We only store the account data required to run the service: your username, email, password hash, and the launcher profiles you link with their skin/cape images.",
      ].join("\n"),
      published: false,
      updatedAt: now,
    },
    {
      id: "doc-terms",
      slug: "terms",
      title: "Terms of service",
      body: [
        "# Terms of service",
        "",
        "*This page is a placeholder. Replace it in the admin panel (Docs) with your real terms before publishing.*",
      ].join("\n"),
      published: false,
      updatedAt: now,
    },
  ];
}

function emptyDb(): Database {
  return { users: [], sessions: [], docs: seedDocs(), servers: [], content: structuredClone(defaultContent) };
}

export function db(): Database {
  let stat: fs.Stats | null = null;
  try {
    stat = fs.statSync(DB_FILE);
  } catch {
    stat = null;
  }

  const cached = getCache();

  if (stat) {
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
      return cached.data;
    }
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Database;
    (data.users ?? []).forEach((u) => normalizeUser(u));
    normalizeContentShape(data);
    normalizeServers(data);
    setCache({ data, mtimeMs: stat.mtimeMs, size: stat.size });
    return data;
  }

  // No file on disk yet: keep using the in-memory database until first save.
  if (cached) return cached.data;
  const data = emptyDb();
  setCache({ data, mtimeMs: -1, size: -1 });
  return data;
}

/** Atomic write so a crash mid-save never corrupts the database. */
export function saveDb(next: Database = db()): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2));
  fs.renameSync(tmp, DB_FILE);
  const stat = fs.statSync(DB_FILE);
  setCache({ data: next, mtimeMs: stat.mtimeMs, size: stat.size });
}

export const uid = (): string => randomBytes(12).toString("hex");

export function publicUser(u: User) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    status: u.status,
    launcherAccounts: u.launcherAccounts.map(publicLauncherAccount),
    activeLauncherAccountId: u.activeLauncherAccountId,
    createdAt: u.createdAt,
  };
}

export function publicLauncherAccount(a: LauncherAccount) {
  return {
    id: a.id,
    name: a.name,
    skinUrl: a.skinUrl,
    capeUrl: a.capeUrl,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

/** Reconciles stored users with the current schema (older data → safe defaults). */
export function normalizeUser(u: User): User {
  if (!Array.isArray(u.launcherAccounts)) u.launcherAccounts = [];
  if (!u.launcherAccounts.some((a) => a.id === u.activeLauncherAccountId)) {
    u.activeLauncherAccountId = u.launcherAccounts[0]?.id ?? null;
  }
  return u;
}

/**
 * Migrates legacy stored content to the current shape at load time, so both
 * read routes (getContent) and write routes (uploads, admin saves) always
 * work with the modern structure (e.g. single screenshot strings → arrays).
 */
function normalizeContentShape(data: Database): void {
  const content = data.content;
  if (!content || typeof content !== "object") {
    data.content = structuredClone(defaultContent);
    return;
  }
  if (!content.screenshots || typeof content.screenshots !== "object") {
    content.screenshots = { pc: [], mobile: [] };
  }
  for (const key of ["pc", "mobile"] as const) {
    const value = content.screenshots[key] as unknown;
    if (typeof value === "string") {
      content.screenshots[key] = value ? [value] : [];
    } else if (!Array.isArray(value)) {
      content.screenshots[key] = [];
    } else {
      content.screenshots[key] = value.filter((u: unknown): u is string => typeof u === "string" && u.length > 0);
    }
  }
  if (!content.seo || typeof content.seo !== "object") {
    content.seo = structuredClone(defaultContent.seo);
  }
  if (typeof content.seo.metaTitle !== "string") content.seo.metaTitle = defaultContent.seo.metaTitle;
  if (typeof content.seo.metaDescription !== "string") content.seo.metaDescription = defaultContent.seo.metaDescription;
  if (!Array.isArray(content.seo.keywords)) content.seo.keywords = defaultContent.seo.keywords.slice();
  if (content.seo.ogImageUrl !== null && typeof content.seo.ogImageUrl !== "string") content.seo.ogImageUrl = null;
  if (!content.updater || typeof content.updater !== "object") {
    content.updater = structuredClone(defaultContent.updater);
  }
  if (typeof content.updater.enabled !== "boolean") content.updater.enabled = false;
  for (const key of ["latestVersion", "minVersion", "noticeTitle", "noticeBody", "downloadUrl"] as const) {
    if (typeof content.updater[key] !== "string") content.updater[key] = "";
  }
}

/** Coerces the stored server list to well-formed entries at load time. */
function normalizeServers(data: Database): void {
  if (!Array.isArray(data.servers)) {
    data.servers = [];
    return;
  }
  data.servers = data.servers
    .filter((s): s is GameServer => Boolean(s) && typeof s === "object")
    .map((s) => ({
      id: typeof s.id === "string" && s.id ? s.id : uid(),
      name: typeof s.name === "string" ? s.name : "Server",
      address: typeof s.address === "string" ? s.address : "",
      description: typeof s.description === "string" ? s.description : "",
      version: typeof s.version === "string" ? s.version : "",
      iconUrl: typeof s.iconUrl === "string" && s.iconUrl.startsWith("/uploads/") ? s.iconUrl : null,
      enabled: s.enabled !== false,
      createdAt: typeof s.createdAt === "string" ? s.createdAt : new Date().toISOString(),
    }));
}
