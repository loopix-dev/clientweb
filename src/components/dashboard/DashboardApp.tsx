"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Plus,
  ShieldCheck,
  Shirt,
  Trash2,
  User,
} from "lucide-react";

type LauncherAccount = {
  id: string;
  name: string;
  skinUrl: string | null;
  capeUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type PublicUser = {
  id: string;
  username: string;
  email: string | null;
  role: "user" | "admin";
  status: "active" | "banned";
  launcherAccounts: LauncherAccount[];
  activeLauncherAccountId: string | null;
  createdAt: string;
};

type Tab = "overview" | "accounts" | "appearance" | "security";
type Notice = { kind: "ok" | "error"; text: string } | null;

/** Shape of JSON responses from the account APIs. */
type ApiData = {
  user?: PublicUser;
  account?: LauncherAccount;
  error?: string;
};

/** Mirrors MAX_LAUNCHER_ACCOUNTS in the server. */
const ACCOUNT_LIMIT = 6;

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "accounts", label: "Launcher accounts", icon: Gamepad2 },
  { id: "appearance", label: "Appearance", icon: Shirt },
  { id: "security", label: "Security", icon: User },
];

const input =
  "w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-[14px] text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none";
const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-accent-hover disabled:opacity-60";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-4 py-2 text-[13px] font-medium text-fg-2 transition-colors hover:border-line-2 hover:text-fg disabled:opacity-60";
const label = "block text-[12.5px] font-medium text-fg-2";

export function DashboardApp({ initial }: { initial: PublicUser }) {
  const router = useRouter();
  const [user, setUserState] = useState<PublicUser>(initial);
  const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState<Notice>(null);

  const showNotice = useCallback((kind: "ok" | "error", text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  /** Keeps the navbar session display in sync after every change. */
  const applyUser = useCallback((next: PublicUser) => {
    setUserState(next);
    window.dispatchEvent(new Event("loopix:user"));
  }, []);

  const request = useCallback(
    async (path: string, init: RequestInit, okText?: string): Promise<ApiData | null> => {
      const res = await fetch(path, init);
      const data: ApiData = await res.json().catch(() => ({}));
      if (!res.ok) {
        showNotice("error", data.error || "Something went wrong.");
        return null;
      }
      if (data.user) applyUser(data.user);
      if (okText) showNotice("ok", okText);
      router.refresh();
      return data;
    },
    [applyUser, router, showNotice],
  );

  const jsonRequest = useCallback(
    (path: string, method: string, body: unknown, okText?: string): Promise<ApiData | null> =>
      request(
        path,
        { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
        okText,
      ),
    [request],
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const active =
    user.launcherAccounts.find((a) => a.id === user.activeLauncherAccountId) ?? null;

  return (
    <div className="grid gap-10 lg:grid-cols-[190px_minmax(0,1fr)]">
      {/* sidebar */}
      <nav aria-label="Dashboard" className="lg:sticky lg:top-24 lg:self-start">
        <h1 className="font-mono text-[10px] tracking-[0.2em] text-fg-3 uppercase">Dashboard</h1>
        <p className="mt-2 truncate text-[12.5px] text-fg-2">{user.email ?? user.username}</p>
        <ul className="mt-4 space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={tab === t.id ? "true" : undefined}
                  className={
                    tab === t.id
                      ? "flex w-full items-center gap-2 rounded-lg bg-card px-3 py-2 text-left text-[13.5px] font-medium text-fg"
                      : "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13.5px] text-fg-2 transition-colors hover:bg-card/60 hover:text-fg"
                  }
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
        {user.role === "admin" ? (
          <Link href="/admin" className={`${btnGhost} mt-6 w-full justify-center`}>
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Admin panel
          </Link>
        ) : null}
        <button type="button" onClick={logout} className={`${btnGhost} mt-2 w-full justify-center`}>
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out
        </button>
      </nav>

      <div className="min-w-0">
        {/* greeting */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight">
              Welcome back, {user.username}
            </h2>
            <p className="mt-1.5 max-w-xl text-[14.5px] text-fg-2">
              Your web account signs you in here and in the launcher. The launcher profiles you
              link below are what the game uses in-game — they stay in sync through the API.
            </p>
          </div>
          <span
            className={
              user.role === "admin"
                ? "rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-accent uppercase"
                : "rounded-full border border-line bg-card px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-fg-2 uppercase"
            }
          >
            {user.role === "admin" ? "Administrator" : "Member"}
          </span>
        </div>

        {notice ? (
          <p
            role="status"
            className={
              notice.kind === "ok"
                ? "mt-6 rounded-lg border border-accent/30 bg-moss px-4 py-2.5 text-[13px] text-accent"
                : "mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-300"
            }
          >
            {notice.text}
          </p>
        ) : null}

        <div className="mt-8 space-y-6">
          {tab === "overview" ? (
            <OverviewTab user={user} active={active} onGoTo={setTab} />
          ) : null}
          {tab === "accounts" ? (
            <AccountsTab user={user} jsonRequest={jsonRequest} request={request} />
          ) : null}
          {tab === "appearance" ? (
            <AppearanceTab user={user} active={active} request={request} onGoTo={setTab} />
          ) : null}
          {tab === "security" ? (
            <SecurityTab user={user} jsonRequest={jsonRequest} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------- tabs ---------------- */

type TabProps = {
  user: PublicUser;
  jsonRequest: (
    path: string,
    method: string,
    body: unknown,
    okText?: string,
  ) => Promise<ApiData | null>;
  request: (path: string, init: RequestInit, okText?: string) => Promise<ApiData | null>;
};

function OverviewTab({
  user,
  active,
  onGoTo,
}: {
  user: PublicUser;
  active: LauncherAccount | null;
  onGoTo: (tab: Tab) => void;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* web account */}
        <section className="rounded-2xl border border-line bg-card p-5">
          <h3 className="font-mono text-[10px] tracking-[0.18em] text-fg-3 uppercase">
            Web account
          </h3>
          <dl className="mt-4 space-y-3 text-[14px]">
            <Row term="Username" value={user.username} />
            <Row term="Email" value={user.email ?? "—"} />
            <Row term="Member since" value={new Date(user.createdAt).toLocaleDateString("en-GB")} />
          </dl>
          <p className="mt-4 text-[12px] leading-relaxed text-fg-3">
            Sign in with your email and password — on the website and inside the launcher.
          </p>
        </section>

        {/* active launcher account */}
        <section className="rounded-2xl border border-line bg-card p-5">
          <h3 className="font-mono text-[10px] tracking-[0.18em] text-fg-3 uppercase">
            Active launcher account
          </h3>
          {active ? (
            <>
              <p className="mt-4 text-[20px] font-semibold tracking-tight">{active.name}</p>
              <dl className="mt-3 space-y-3 text-[14px]">
                <Row term="Skin" value={active.skinUrl ? "Uploaded" : "None"} />
                <Row term="Cape" value={active.capeUrl ? "Uploaded" : "None"} />
                <Row
                  term="Updated"
                  value={new Date(active.updatedAt).toLocaleDateString("en-GB")}
                />
              </dl>
            </>
          ) : (
            <div className="mt-4">
              <p className="text-[14px] text-fg-2">No launcher account linked yet.</p>
              <button type="button" onClick={() => onGoTo("accounts")} className={`${btnPrimary} mt-4`}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Link your first account
              </button>
            </div>
          )}
        </section>

        {/* sync status */}
        <section className="rounded-2xl border border-line bg-card p-5 md:col-span-2 xl:col-span-1">
          <h3 className="font-mono text-[10px] tracking-[0.18em] text-fg-3 uppercase">Sync status</h3>
          <ul className="mt-4 space-y-3 text-[14px]">
            <li className="flex items-start justify-between gap-3">
              <span className="text-fg-2">Linked profiles</span>
              <span className="font-medium text-fg">
                {user.launcherAccounts.length} / {ACCOUNT_LIMIT}
              </span>
            </li>
            <li className="flex items-start justify-between gap-3">
              <span className="text-fg-2">Launcher API</span>
              <span className="font-medium text-accent">Ready</span>
            </li>
            <li className="flex items-start justify-between gap-3">
              <span className="text-fg-2">Account status</span>
              <span className="font-medium text-fg">
                {user.status === "banned" ? "Suspended" : "Active"}
              </span>
            </li>
          </ul>
          <p className="mt-4 text-[12px] leading-relaxed text-fg-3">
            The launcher signs in with your web account, then pulls the active profile&apos;s name,
            skin and cape.
          </p>
        </section>
      </div>

      {/* quick actions */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onGoTo("accounts")} className={btnGhost}>
          <Gamepad2 className="h-3.5 w-3.5" aria-hidden="true" /> Manage launcher accounts
        </button>
        <button type="button" onClick={() => onGoTo("appearance")} className={btnGhost}>
          <Shirt className="h-3.5 w-3.5" aria-hidden="true" /> Change skin or cape
        </button>
        <button type="button" onClick={() => onGoTo("security")} className={btnGhost}>
          <User className="h-3.5 w-3.5" aria-hidden="true" /> Security settings
        </button>
      </div>
    </>
  );
}

function AccountsTab({ user, jsonRequest, request }: TabProps) {
  const [addName, setAddName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function addAccount(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const data = await jsonRequest(
      "/api/account/launcher",
      "POST",
      { name: addName },
      `${addName.trim()} linked. The launcher can use it now.`,
    );
    if (data) setAddName("");
    setBusy(false);
  }

  async function renameAccount() {
    if (!editing) return;
    setBusy(true);
    const data = await jsonRequest(
      `/api/account/launcher/${editing.id}`,
      "PATCH",
      { name: editing.name },
      "Launcher account renamed.",
    );
    if (data) setEditing(null);
    setBusy(false);
  }

  async function activate(id: string) {
    await request(`/api/account/launcher/${id}/activate`, { method: "POST" }, "Active account switched.");
  }

  async function remove(id: string, name: string) {
    await request(
      `/api/account/launcher/${id}`,
      { method: "DELETE" },
      `${name} unlinked.`,
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-line bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-semibold tracking-tight">Linked launcher accounts</h3>
            <p className="mt-1 text-[13px] text-fg-2">
              Offline Minecraft profiles your launcher uses in-game — separate from your web login.
            </p>
          </div>
          <span className="font-mono text-[10px] tracking-[0.16em] text-fg-3 uppercase">
            {user.launcherAccounts.length} / {ACCOUNT_LIMIT} linked
          </span>
        </div>

        {user.launcherAccounts.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line-2 bg-ink-2/50 px-5 py-8 text-center">
            <Gamepad2 className="mx-auto h-5 w-5 text-fg-3" aria-hidden="true" />
            <p className="mt-3 text-[14px] text-fg-2">
              Add the player name you use offline — the launcher will sync it with your skin and cape.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {user.launcherAccounts.map((account) => {
              const isActive = account.id === user.activeLauncherAccountId;
              const isEditing = editing?.id === account.id;
              return (
                <li
                  key={account.id}
                  className={
                    isActive
                      ? "flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-accent/5 px-4 py-3"
                      : "flex flex-wrap items-center gap-3 rounded-xl border border-line bg-ink-2/60 px-4 py-3"
                  }
                >
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          className={`${input} max-w-[220px]`}
                          value={editing.name}
                          onChange={(e) => setEditing({ id: account.id, name: e.target.value })}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={renameAccount}
                          disabled={busy}
                          className={btnPrimary}
                        >
                          Save
                        </button>
                        <button type="button" onClick={() => setEditing(null)} className={btnGhost}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="truncate text-[15px] font-medium text-fg">
                          {account.name}
                        </span>
                        {isActive ? (
                          <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[9.5px] tracking-[0.14em] text-ink uppercase">
                            Active
                          </span>
                        ) : null}
                        <span className="text-[12px] text-fg-3">
                          skin {account.skinUrl ? "✓" : "—"} · cape {account.capeUrl ? "✓" : "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="flex items-center gap-2">
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => activate(account.id)}
                          className={btnPrimary}
                        >
                          Use this account
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setEditing({ id: account.id, name: account.name })}
                        className={btnGhost}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(account.id, account.name)}
                        aria-label={`Unlink ${account.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card text-fg-3 transition-colors hover:border-red-500/40 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-card p-6">
        <h3 className="text-[16px] font-semibold tracking-tight">Add a launcher account</h3>
        <p className="mt-1 text-[13px] text-fg-2">
          This is the name shown in-game. The launcher signs in with your web account and picks it
          up automatically.
        </p>
        <form onSubmit={addAccount} className="mt-5 flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 sm:max-w-xs">
            <span className={label}>Player name</span>
            <input
              className={`${input} mt-1.5`}
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Steve_404"
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy || user.launcherAccounts.length >= ACCOUNT_LIMIT}
            className={btnPrimary}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add account
          </button>
        </form>
        <p className="mt-3 text-[12px] text-fg-3">
          3–16 characters: letters, numbers, underscores.
          {user.launcherAccounts.length >= ACCOUNT_LIMIT
            ? ` Limit reached (${ACCOUNT_LIMIT}).`
            : ""}
        </p>
      </section>
    </>
  );
}

function AppearanceTab({
  user,
  active,
  request,
  onGoTo,
}: {
  user: PublicUser;
  active: LauncherAccount | null;
  request: (path: string, init: RequestInit, okText?: string) => Promise<ApiData | null>;
  onGoTo: (tab: Tab) => void;
}) {
  const skinInput = useRef<HTMLInputElement>(null);
  const capeInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  if (!active) {
    return (
      <section className="rounded-2xl border border-dashed border-line-2 bg-card px-6 py-12 text-center">
        <Shirt className="mx-auto h-5 w-5 text-fg-3" aria-hidden="true" />
        <p className="mt-3 text-[14.5px] text-fg-2">
          Link a launcher account first — skins and capes belong to a launcher profile.
        </p>
        <button type="button" onClick={() => onGoTo("accounts")} className={`${btnPrimary} mt-5`}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Link an account
        </button>
      </section>
    );
  }

  async function upload(kind: "skin" | "cape", file: File) {
    if (!active) return;
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    await request(
      `/api/account/launcher/${active.id}/${kind}`,
      { method: "POST", body: form },
      kind === "skin" ? "Skin updated." : "Cape updated.",
    );
    setBusy(false);
  }

  async function remove(kind: "skin" | "cape") {
    if (!active) return;
    await request(
      `/api/account/launcher/${active.id}/${kind}`,
      { method: "DELETE" },
      kind === "skin" ? "Skin removed." : "Cape removed.",
    );
  }

  return (
    <>
      {/* account picker */}
      <section className="rounded-2xl border border-line bg-card p-6">
        <h3 className="text-[16px] font-semibold tracking-tight">Editing profile</h3>
        <p className="mt-1 text-[13px] text-fg-2">
          Appearance applies to the selected launcher account.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {user.launcherAccounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() =>
                request(
                  `/api/account/launcher/${account.id}/activate`,
                  { method: "POST" },
                  `Switched to ${account.name}.`,
                )
              }
              aria-pressed={account.id === active.id}
              className={
                account.id === active.id
                  ? "rounded-lg border border-accent/50 bg-accent/10 px-3.5 py-2 text-[13.5px] font-medium text-fg"
                  : "rounded-lg border border-line bg-ink-2 px-3.5 py-2 text-[13.5px] text-fg-2 transition-colors hover:text-fg"
              }
            >
              {account.name}
              {account.id === active.id ? (
                <span className="ml-2 font-mono text-[9.5px] tracking-[0.14em] text-accent uppercase">
                  Active
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <AssetCard
          title="Skin"
          hint="PNG, up to 2 MB. Synced to the launcher; the launcher can also push one via the API."
          url={active.skinUrl}
          busy={busy}
          onChoose={() => skinInput.current?.click()}
          onRemove={() => remove("skin")}
        />
        <AssetCard
          title="Cape"
          hint="PNG, up to 2 MB. Synced to the launcher; the launcher can also push one via the API."
          url={active.capeUrl}
          busy={busy}
          onChoose={() => capeInput.current?.click()}
          onRemove={() => remove("cape")}
        />
        <input
          ref={skinInput}
          type="file"
          accept="image/png,image/svg+xml"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload("skin", e.target.files[0])}
        />
        <input
          ref={capeInput}
          type="file"
          accept="image/png,image/svg+xml"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload("cape", e.target.files[0])}
        />
      </div>
    </>
  );
}

function SecurityTab({
  user,
  jsonRequest,
}: {
  user: PublicUser;
  jsonRequest: (
    path: string,
    method: string,
    body: unknown,
    okText?: string,
  ) => Promise<ApiData | null>;
}) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const data = await jsonRequest(
      "/api/account",
      "PATCH",
      {
        username,
        email,
        currentPassword,
        ...(newPassword ? { newPassword } : {}),
      },
      "Security settings saved.",
    );
    if (data) {
      setCurrentPassword("");
      setNewPassword("");
    }
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-6">
      <h3 className="text-[16px] font-semibold tracking-tight">Sign-in &amp; security</h3>
      <p className="mt-1 text-[13px] text-fg-2">
        These credentials sign you into the website and the launcher API.
      </p>
      <form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Username</span>
          <input
            className={`${input} mt-1.5`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="block">
          <span className={label}>Email</span>
          <input
            type="email"
            className={`${input} mt-1.5`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className={label}>Current password</span>
          <input
            type="password"
            className={`${input} mt-1.5`}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="required to save"
            required
          />
        </label>
        <label className="block">
          <span className={label}>New password</span>
          <input
            type="password"
            className={`${input} mt-1.5`}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="leave empty to keep"
          />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ---------------- shared bits ---------------- */

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-fg-2">{term}</dt>
      <dd className="min-w-0 truncate font-medium text-fg">{value}</dd>
    </div>
  );
}

function AssetCard({
  title,
  hint,
  url,
  busy,
  onChoose,
  onRemove,
}: {
  title: string;
  hint: string;
  url: string | null;
  busy: boolean;
  onChoose: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold tracking-tight">{title}</h3>
        <span className="font-mono text-[10px] tracking-[0.16em] text-fg-3 uppercase">
          {url ? "Uploaded" : "None"}
        </span>
      </div>
      <div className="mt-4 flex h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line-2 bg-ink-2/60">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={`${title} preview`}
            className="max-h-32 max-w-full object-contain [image-rendering:pixelated]"
          />
        ) : (
          <span className="text-[13px] text-fg-3">No {title.toLowerCase()} uploaded</span>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onChoose} disabled={busy} className={btnPrimary}>
          {url ? "Replace" : "Upload"}
        </button>
        {url ? (
          <button type="button" onClick={onRemove} disabled={busy} className={btnGhost}>
            Remove
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-fg-3">{hint}</p>
    </div>
  );
}
