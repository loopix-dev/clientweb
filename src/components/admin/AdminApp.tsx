"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, LogOut, Plus, Trash2 } from "lucide-react";
import { siteConfig } from "@/config/site";
import type { Content } from "@/server/content";
import type { Doc } from "@/server/db";
import { compareVersions, parseVersion } from "@/server/versions";

type Tab = "settings" | "content" | "screenshots" | "downloads" | "updates" | "servers" | "seo" | "api" | "docs" | "users";

type LauncherAccountSummary = {
  id: string;
  name: string;
};

type PublicUser = {
  id: string;
  username: string;
  email: string | null;
  role: "user" | "admin";
  status: "active" | "banned";
  launcherAccounts: LauncherAccountSummary[];
  activeLauncherAccountId: string | null;
  createdAt: string;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "settings", label: "Settings" },
  { id: "content", label: "Site text" },
  { id: "screenshots", label: "Screenshots" },
  { id: "downloads", label: "Downloads" },
  { id: "updates", label: "Updates" },
  { id: "servers", label: "Servers" },
  { id: "seo", label: "SEO" },
  { id: "api", label: "API" },
  { id: "docs", label: "Docs" },
  { id: "users", label: "Users" },
];

const input =
  "w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-[14px] text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none";
const label = "block text-[12.5px] font-medium text-fg-2";
const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-accent-hover disabled:opacity-60";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-4 py-2 text-[13px] font-medium text-fg-2 transition-colors hover:border-line-2 hover:text-fg disabled:opacity-60";

export function AdminApp() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("settings");
  const [content, setContent] = useState<Content | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const showNotice = useCallback((kind: "ok" | "error", text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => setNotice(null), 3500);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/content").then((r) => r.json()),
      fetch("/api/admin/docs").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ]).then(([c, d, u]) => {
      if (c.content) setContent(c.content);
      if (d.docs) setDocs(d.docs);
      if (u.users) setUsers(u.users);
      setLoading(false);
    });
  }, []);

  async function saveContent(next: Content, message = "Saved.") {
    setContent(next);
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Could not save.");
      return;
    }
    setContent(data.content);
    showNotice("ok", message);
    router.refresh();
  }

  async function uploadImage(kind: string, file: File) {
    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Upload failed.");
      return;
    }
    setContent(data.content);
    showNotice("ok", "Image uploaded.");
    router.refresh();
  }

  async function deleteUpload(url: string) {
    const res = await fetch("/api/admin/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Could not remove the image.");
      return;
    }
    setContent(data.content);
    showNotice("ok", "Image removed.");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (loading || !content) {
    return <p className="text-[14px] text-fg-3">Loading admin…</p>;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[190px_minmax(0,1fr)]">
      {/* sidebar */}
      <nav aria-label="Admin" className="lg:sticky lg:top-24 lg:self-start">
        <h1 className="font-mono text-[10px] tracking-[0.2em] text-fg-3 uppercase">Admin panel</h1>
        <ul className="mt-4 space-y-1">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "true" : undefined}
                className={
                  tab === t.id
                    ? "w-full rounded-lg bg-card px-3 py-2 text-left text-[13.5px] font-medium text-fg"
                    : "w-full rounded-lg px-3 py-2 text-left text-[13.5px] text-fg-2 transition-colors hover:bg-card/60 hover:text-fg"
                }
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={logout} className={`${btnGhost} mt-6 w-full justify-center`}>
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out
        </button>
      </nav>

      <div className="min-w-0">
        {notice ? (
          <p
            role="status"
            className={
              notice.kind === "ok"
                ? "mb-6 rounded-lg border border-accent/30 bg-moss px-4 py-2.5 text-[13px] text-accent"
                : "mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-300"
            }
          >
            {notice.text}
          </p>
        ) : null}

        {tab === "settings" ? <SettingsTab content={content} onSave={saveContent} onUpload={uploadImage} /> : null}
        {tab === "content" ? <TextTab content={content} onSave={saveContent} /> : null}
        {tab === "screenshots" ? (
          <ScreenshotsTab content={content} onUpload={uploadImage} onSave={saveContent} onDeleteUpload={deleteUpload} />
        ) : null}
        {tab === "downloads" ? <DownloadsTab content={content} onSave={saveContent} /> : null}
        {tab === "updates" ? <UpdatesTab content={content} onSave={saveContent} /> : null}
        {tab === "servers" ? <ServersTab showNotice={showNotice} /> : null}
        {tab === "seo" ? (
          <SeoTab content={content} onSave={saveContent} onUpload={uploadImage} onDeleteUpload={deleteUpload} />
        ) : null}
        {tab === "api" ? <ApiTab showNotice={showNotice} /> : null}
        {tab === "docs" ? <DocsTab docs={docs} setDocs={setDocs} showNotice={showNotice} router={router} /> : null}
        {tab === "users" ? <UsersTab users={users} setUsers={setUsers} showNotice={showNotice} /> : null}
      </div>
    </div>
  );
}

/* ---------------- shared bits ---------------- */

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-6">
      <h2 className="text-[16px] font-semibold tracking-tight">{title}</h2>
      {hint ? <p className="mt-1 text-[13px] text-fg-2">{hint}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label: labelText,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className={label}>
      {labelText}
      <input
        type={type}
        className={`${input} mt-1.5`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Area({
  label: labelText,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className={label}>
      {labelText}
      <textarea className={`${input} mt-1.5 resize-y`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/* ---------------- settings ---------------- */

function SettingsTab({
  content,
  onSave,
  onUpload,
}: {
  content: Content;
  onSave: (next: Content, message?: string) => Promise<void>;
  onUpload: (kind: string, file: File) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Content>(content);
  const [dirty, setDirty] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const faviconInput = useRef<HTMLInputElement>(null);

  const edit = (fn: (c: Content) => void) => {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
    setDirty(true);
  };

  return (
    <div className="space-y-6">
      <Section title="Brand" hint="Shown in the navigation, footer and browser tab.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand name" value={draft.brand.name} onChange={(v) => edit((c) => { c.brand.name = v; })} />
          <Field label="Suffix" value={draft.brand.suffix} onChange={(v) => edit((c) => { c.brand.suffix = v; })} placeholder="Client" />
        </div>
        <Field label="Tagline" value={draft.brand.tagline} onChange={(v) => edit((c) => { c.brand.tagline = v; })} />
        <label className={label}>
          Accent color
          <span className="mt-1.5 flex items-center gap-3">
            <input
              type="color"
              value={draft.brand.accent}
              onChange={(e) => edit((c) => { c.brand.accent = e.target.value; })}
              className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-ink-2"
            />
            <input
              className={`${input} max-w-[9rem]`}
              value={draft.brand.accent}
              onChange={(e) => edit((c) => { c.brand.accent = e.target.value; })}
            />
          </span>
        </label>
      </Section>

      <Section title="Logo & favicon" hint="PNG or SVG, up to 2 MB. Re-uploading replaces the previous image.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageSlot title="Logo" url={draft.brand.logoUrl} onChoose={() => logoInput.current?.click()} />
          <ImageSlot title="Favicon" url={draft.brand.faviconUrl} onChoose={() => faviconInput.current?.click()} />
        </div>
        <input
          ref={logoInput}
          type="file"
          accept="image/png,image/svg+xml"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onUpload("logo", e.target.files[0])}
        />
        <input
          ref={faviconInput}
          type="file"
          accept="image/png,image/svg+xml"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onUpload("favicon", e.target.files[0])}
        />
      </Section>

      <button type="button" className={btnPrimary} disabled={!dirty} onClick={() => { void onSave(draft, "Settings saved."); setDirty(false); }}>
        Save settings
      </button>
    </div>
  );
}

function ImageSlot({ title, url, onChoose }: { title: string; url: string | null; onChoose: () => void }) {
  return (
    <div className="rounded-xl border border-line bg-ink-2/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-fg">{title}</span>
        <span className="font-mono text-[10px] tracking-[0.14em] text-fg-3 uppercase">{url ? "Set" : "Default"}</span>
      </div>
      <div className="mt-3 flex h-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line-2 bg-ink/60">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`${title} preview`} className="max-h-20 max-w-full object-contain" />
        ) : (
          <span className="text-[12.5px] text-fg-3">Using built-in default</span>
        )}
      </div>
      <button type="button" onClick={onChoose} className={`${btnGhost} mt-3 w-full justify-center`}>
        {url ? "Replace" : "Upload"} {title.toLowerCase()}
      </button>
    </div>
  );
}

/* ---------------- site text ---------------- */

const FEATURE_ICONS = ["launcher", "sliders", "blocks", "tools", "refresh", "community"] as const;

function TextTab({ content, onSave }: { content: Content; onSave: (next: Content, message?: string) => Promise<void> }) {
  const [draft, setDraft] = useState<Content>(content);
  const [dirty, setDirty] = useState(false);
  // Raw text for comma-separated fields: parsing on every keystroke would eat
  // the commas, so the array is only rebuilt when saving.
  const [highlightsRaw, setHighlightsRaw] = useState(() => content.hero.highlights.join(", "));
  // Reset the local draft whenever server content changes (after saves/uploads).
  const [prevContent, setPrevContent] = useState<Content>(content);
  if (content !== prevContent) {
    setPrevContent(content);
    setDraft(content);
    setHighlightsRaw(content.hero.highlights.join(", "));
  }

  const edit = (fn: (c: Content) => void) => {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
    setDirty(true);
  };

  return (
    <div className="space-y-6">
      <Section title="Hero">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" value={draft.hero.eyebrow} onChange={(v) => edit((c) => { c.hero.eyebrow = v; })} />
          <Field label="Accent word" value={draft.hero.accentWord} onChange={(v) => edit((c) => { c.hero.accentWord = v; })} />
        </div>
        <Field label="Title" value={draft.hero.title} onChange={(v) => edit((c) => { c.hero.title = v; })} />
        <Area label="Subtitle" value={draft.hero.subtitle} onChange={(v) => edit((c) => { c.hero.subtitle = v; })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary button" value={draft.hero.primaryCta.label} onChange={(v) => edit((c) => { c.hero.primaryCta.label = v; })} />
          <Field label="Primary button link" value={draft.hero.primaryCta.href} onChange={(v) => edit((c) => { c.hero.primaryCta.href = v; })} />
          <Field label="Secondary button" value={draft.hero.secondaryCta.label} onChange={(v) => edit((c) => { c.hero.secondaryCta.label = v; })} />
          <Field label="Secondary button link" value={draft.hero.secondaryCta.href} onChange={(v) => edit((c) => { c.hero.secondaryCta.href = v; })} />
        </div>
        <Field
          label="Highlights (comma separated)"
          value={highlightsRaw}
          onChange={(v) => { setHighlightsRaw(v); setDirty(true); }}
        />
      </Section>

      <Section title="Features">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Label" value={draft.features.label} onChange={(v) => edit((c) => { c.features.label = v; })} />
          <Field label="Title" value={draft.features.title} onChange={(v) => edit((c) => { c.features.title = v; })} />
          <Field label="Subtitle" value={draft.features.subtitle} onChange={(v) => edit((c) => { c.features.subtitle = v; })} />
        </div>
        {draft.features.items.map((item, i) => (
          <div key={i} className="rounded-xl border border-line bg-ink-2/50 p-4">
            <div className="flex items-center justify-between">
              <select
                className={`${input} max-w-[10rem]`}
                value={item.icon}
                onChange={(e) => edit((c) => { c.features.items[i].icon = e.target.value; })}
              >
                {FEATURE_ICONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <button
                type="button"
                className={`${btnGhost} px-2`}
                aria-label={`Remove feature ${i + 1}`}
                onClick={() => edit((c) => { c.features.items.splice(i, 1); })}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Title" value={item.title} onChange={(v) => edit((c) => { c.features.items[i].title = v; })} />
              <Field label="Body" value={item.body} onChange={(v) => edit((c) => { c.features.items[i].body = v; })} />
            </div>
          </div>
        ))}
        <button
          type="button"
          className={btnGhost}
          onClick={() => edit((c) => { c.features.items.push({ icon: "launcher", title: "New feature", body: "" }); })}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add feature
        </button>
      </Section>

      <Section title="FAQ">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Label" value={draft.faq.label} onChange={(v) => edit((c) => { c.faq.label = v; })} />
          <Field label="Title" value={draft.faq.title} onChange={(v) => edit((c) => { c.faq.title = v; })} />
          <Field label="Subtitle" value={draft.faq.subtitle} onChange={(v) => edit((c) => { c.faq.subtitle = v; })} />
        </div>
        {draft.faq.items.map((item, i) => (
          <div key={i} className="rounded-xl border border-line bg-ink-2/50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-fg-3">{String(i + 1).padStart(2, "0")}</span>
              <button
                type="button"
                className={`${btnGhost} px-2`}
                aria-label={`Remove question ${i + 1}`}
                onClick={() => edit((c) => { c.faq.items.splice(i, 1); })}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 grid gap-3">
              <Field label="Question" value={item.q} onChange={(v) => edit((c) => { c.faq.items[i].q = v; })} />
              <Area label="Answer" value={item.a} onChange={(v) => edit((c) => { c.faq.items[i].a = v; })} rows={2} />
            </div>
          </div>
        ))}
        <button
          type="button"
          className={btnGhost}
          onClick={() => edit((c) => { c.faq.items.push({ q: "New question", a: "" }); })}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add question
        </button>
      </Section>

      <Section title="Footer">
        <Area label="Footer blurb" value={draft.footer.blurb} onChange={(v) => edit((c) => { c.footer.blurb = v; })} rows={2} />
      </Section>

      <button
        type="button"
        className={btnPrimary}
        disabled={!dirty}
        onClick={() => {
          const next = structuredClone(draft);
          next.hero.highlights = highlightsRaw.split(",").map((s) => s.trim()).filter(Boolean);
          void onSave(next, "Site text saved.");
          setDirty(false);
        }}
      >
        Save text
      </button>
    </div>
  );
}

/* ---------------- screenshots ---------------- */

function ScreenshotsTab({
  content,
  onUpload,
  onSave,
  onDeleteUpload,
}: {
  content: Content;
  onUpload: (kind: string, file: File) => Promise<void>;
  onSave: (next: Content, message?: string) => Promise<void>;
  onDeleteUpload: (url: string) => Promise<void>;
}) {
  const pcInput = useRef<HTMLInputElement>(null);
  const mobileInput = useRef<HTMLInputElement>(null);

  async function addFiles(kind: "pc" | "mobile", files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      await onUpload(`screenshot-${kind}`, file);
    }
  }

  function move(kind: "pc" | "mobile", index: number, delta: number) {
    const next = structuredClone(content);
    const list = next.screenshots[kind];
    const [item] = list.splice(index, 1);
    list.splice(index + delta, 0, item);
    void onSave(next, "Order updated.");
  }

  return (
    <Section
      title="Launcher screenshots"
      hint="Upload as many as you like — the download page shows them as an auto-swiping carousel. PNG, up to 2 MB each, max 12 per device."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {(["pc", "mobile"] as const).map((kind) => {
          const shots = content.screenshots[kind];
          return (
            <div key={kind} className="rounded-xl border border-line bg-ink-2/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-fg">{kind === "pc" ? "PC launcher" : "Mobile launcher"}</span>
                <span className="font-mono text-[10px] tracking-[0.14em] text-fg-3 uppercase">
                  {shots.length} {shots.length === 1 ? "shot" : "shots"}
                </span>
              </div>

              {shots.length === 0 ? (
                <div className="mt-3 flex aspect-[16/10] items-center justify-center rounded-lg border border-dashed border-line-2 bg-ink/60 px-4 text-center">
                  <span className="text-[12.5px] text-fg-3">
                    No screenshot yet — the download page stays honest until you add one.
                  </span>
                </div>
              ) : (
                <ul className="mt-3 grid grid-cols-2 gap-2">
                  {shots.map((url, i) => (
                    <li
                      key={url}
                      className="group relative aspect-[16/10] overflow-hidden rounded-lg border border-line bg-ink/60"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`${kind} screenshot ${i + 1}`} className="h-full w-full object-cover" />
                      <span className="pointer-events-none absolute top-1.5 left-1.5 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-fg-2">
                        {i + 1}
                      </span>
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-ink/90 to-transparent px-1.5 pt-4 pb-1.5">
                        <span className="flex gap-1">
                          <button
                            type="button"
                            aria-label={`Move ${kind} screenshot ${i + 1} left`}
                            disabled={i === 0}
                            onClick={() => move(kind, i, -1)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded bg-ink/80 text-fg-2 transition-colors hover:text-fg disabled:opacity-30"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move ${kind} screenshot ${i + 1} right`}
                            disabled={i === shots.length - 1}
                            onClick={() => move(kind, i, 1)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded bg-ink/80 text-fg-2 transition-colors hover:text-fg disabled:opacity-30"
                          >
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${kind} screenshot ${i + 1}`}
                          onClick={() => void onDeleteUpload(url)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded bg-ink/80 text-fg-3 transition-colors hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                className={`${btnGhost} mt-3 w-full justify-center`}
                onClick={() => (kind === "pc" ? pcInput.current : mobileInput.current)?.click()}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add {shots.length ? "screenshots" : "screenshot"}
              </button>
              <p className="mt-2 text-[11.5px] text-fg-3">
                The first image leads the carousel. Use the arrows to reorder, the bin to remove.
              </p>
            </div>
          );
        })}
      </div>
      <input
        ref={pcInput}
        type="file"
        accept="image/png,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => {
          void addFiles("pc", e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={mobileInput}
        type="file"
        accept="image/png,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => {
          void addFiles("mobile", e.target.files);
          e.target.value = "";
        }}
      />
    </Section>
  );
}

/* ---------------- SEO ---------------- */

function SeoTab({
  content,
  onSave,
  onUpload,
  onDeleteUpload,
}: {
  content: Content;
  onSave: (next: Content, message?: string) => Promise<void>;
  onUpload: (kind: string, file: File) => Promise<void>;
  onDeleteUpload: (url: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Content>(content);
  const [dirty, setDirty] = useState(false);
  // Raw text for the comma-separated keywords: parsing per keystroke would eat
  // the commas, so the array is only rebuilt when saving.
  const [keywordsRaw, setKeywordsRaw] = useState(() => content.seo.keywords.join(", "));
  // Reset the local draft whenever server content changes (after saves/uploads).
  const [prevContent, setPrevContent] = useState<Content>(content);
  if (content !== prevContent) {
    setPrevContent(content);
    setDraft(content);
    setKeywordsRaw(content.seo.keywords.join(", "));
  }
  const ogInput = useRef<HTMLInputElement>(null);

  const edit = (fn: (c: Content) => void) => {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
    setDirty(true);
  };

  const brandName = `${content.brand.name} ${content.brand.suffix}`.trim();
  const fallbackTitle = `${brandName} — A Better Minecraft Experience`;
  const fallbackDescription = siteConfig.description;
  const domain = siteConfig.url ? new URL(siteConfig.url).host : "your-domain.com";
  const seo = draft.seo;
  const previewTitle = seo.metaTitle.trim() || fallbackTitle;
  const previewDescription = seo.metaDescription.trim() || fallbackDescription;

  return (
    <div className="space-y-6">
      <Section
        title="Search metadata"
        hint="What search engines and social networks show for your site. Changes apply to every page after saving."
      >
        <div>
          <Field
            label="Meta title"
            value={seo.metaTitle}
            onChange={(v) => edit((c) => { c.seo.metaTitle = v; })}
          />
          <p className={`mt-1 text-[11.5px] ${seo.metaTitle.length > 65 ? "text-amber-300" : "text-fg-3"}`}>
            {seo.metaTitle.length} characters — search engines cut off around 60.
          </p>
        </div>
        <div>
          <Area
            label="Meta description"
            value={seo.metaDescription}
            onChange={(v) => edit((c) => { c.seo.metaDescription = v; })}
            rows={3}
          />
          <p className={`mt-1 text-[11.5px] ${seo.metaDescription.length > 170 ? "text-amber-300" : "text-fg-3"}`}>
            {seo.metaDescription.length} characters — aim for 50–160.
          </p>
        </div>
        <Field
          label="Keywords (comma separated)"
          value={keywordsRaw}
          onChange={(v) => { setKeywordsRaw(v); setDirty(true); }}
        />
      </Section>

      <Section
        title="Social preview image"
        hint="Shown when someone shares your site on Discord, X, Reddit, WhatsApp… Recommended: 1200×630 PNG."
      >
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex aspect-[1200/630] w-full max-w-sm items-center justify-center overflow-hidden rounded-xl border border-line bg-ink/60">
            {seo.ogImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seo.ogImageUrl} alt="Social preview" className="h-full w-full object-cover" />
            ) : (
              <span className="px-4 text-center text-[12.5px] text-fg-3">
                No custom image — the site&apos;s default card is used.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className={btnGhost} onClick={() => ogInput.current?.click()}>
              {seo.ogImageUrl ? "Replace image" : "Upload image"}
            </button>
            {seo.ogImageUrl ? (
              <button
                type="button"
                className={btnGhost}
                onClick={() => void onDeleteUpload(seo.ogImageUrl as string)}
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
        <input
          ref={ogInput}
          type="file"
          accept="image/png,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) void onUpload("og-image", e.target.files[0]);
            e.target.value = "";
          }}
        />
      </Section>

      <Section title="Preview" hint="How your homepage appears in search results and when shared.">
        {/* search-result style preview */}
        <div className="rounded-xl border border-line bg-ink/60 p-4">
          <p className="font-mono text-[11px] text-fg-3">{domain} ›</p>
          <p className="mt-1 text-[18px] leading-snug text-[#8ab4f8]">{previewTitle}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-fg-2">{previewDescription}</p>
        </div>
        {/* social-card style preview */}
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="flex aspect-[1200/630] max-h-56 w-full items-center justify-center bg-ink-2">
            {seo.ogImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seo.ogImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-mono text-[11px] tracking-[0.14em] text-fg-3 uppercase">
                default card image
              </span>
            )}
          </div>
          <div className="border-t border-line bg-card p-3.5">
            <p className="font-mono text-[10.5px] tracking-[0.12em] text-fg-3 uppercase">{domain}</p>
            <p className="mt-1 text-[14px] font-medium text-fg">{previewTitle}</p>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] text-fg-2">{previewDescription}</p>
          </div>
        </div>
      </Section>

      <button
        type="button"
        className={btnPrimary}
        disabled={!dirty}
        onClick={() => {
          const next = structuredClone(draft);
          next.seo.keywords = keywordsRaw.split(",").map((s) => s.trim()).filter(Boolean);
          void onSave(next, "SEO settings saved.");
          setDirty(false);
        }}
      >
        Save SEO
      </button>
    </div>
  );
}

/* ---------------- downloads ---------------- */

function DownloadsTab({ content, onSave }: { content: Content; onSave: (next: Content, message?: string) => Promise<void> }) {
  const [draft, setDraft] = useState<Content>(content);
  const [dirty, setDirty] = useState(false);
  // Reset the local draft whenever server content changes (after saves/uploads).
  const [prevContent, setPrevContent] = useState<Content>(content);
  if (content !== prevContent) {
    setPrevContent(content);
    setDraft(content);
  }

  const edit = (fn: (c: Content) => void) => {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
    setDirty(true);
  };

  return (
    <div className="space-y-6">
      <Section title="Download page">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading" value={draft.download.heading} onChange={(v) => edit((c) => { c.download.heading = v; })} />
          <Field label="Subtitle" value={draft.download.sub} onChange={(v) => edit((c) => { c.download.sub = v; })} />
        </div>
      </Section>

      {(["pc", "mobile"] as const).map((kind) => {
        const p = draft.download.platforms[kind];
        return (
          <Section key={kind} title={`${p.label || kind} build`} hint="Leave the URL empty to keep the honest “not published yet” state.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Label" value={p.label} onChange={(v) => edit((c) => { c.download.platforms[kind].label = v; })} />
              <Field label="Description" value={p.description} onChange={(v) => edit((c) => { c.download.platforms[kind].description = v; })} />
              <Field label="Download URL" value={p.url ?? ""} placeholder="https://…" onChange={(v) => edit((c) => { c.download.platforms[kind].url = v || null; })} />
              <Field label="Version" value={p.version ?? ""} placeholder="e.g. 1.0.0" onChange={(v) => edit((c) => { c.download.platforms[kind].version = v || null; })} />
              <Field label="File size" value={p.fileSize ?? ""} placeholder="e.g. 86 MB" onChange={(v) => edit((c) => { c.download.platforms[kind].fileSize = v || null; })} />
            </div>
          </Section>
        );
      })}

      <Section title="Install steps">
        {draft.download.steps.map((step, i) => (
          <div key={i} className="grid gap-3 rounded-xl border border-line bg-ink-2/50 p-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <Field label="Title" value={step.title} onChange={(v) => edit((c) => { c.download.steps[i].title = v; })} />
            <Field label="Body" value={step.body} onChange={(v) => edit((c) => { c.download.steps[i].body = v; })} />
          </div>
        ))}
      </Section>

      <Section title="Help bar">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Help text" value={draft.download.helpText} onChange={(v) => edit((c) => { c.download.helpText = v; })} />
          <Field
            label="Installation guide URL (optional)"
            value={draft.download.installationGuideUrl ?? ""}
            placeholder="https://…"
            onChange={(v) => edit((c) => { c.download.installationGuideUrl = v || null; })}
          />
        </div>
      </Section>

      <button type="button" className={btnPrimary} disabled={!dirty} onClick={() => { void onSave(draft, "Downloads saved."); setDirty(false); }}>
        Save downloads
      </button>
    </div>
  );
}

/* ---------------- launcher update notice ---------------- */

function UpdatesTab({ content, onSave }: { content: Content; onSave: (next: Content, message?: string) => Promise<void> }) {
  const [draft, setDraft] = useState<Content>(content);
  const [dirty, setDirty] = useState(false);
  // Reset the local draft whenever server content changes (after saves/uploads).
  const [prevContent, setPrevContent] = useState<Content>(content);
  if (content !== prevContent) {
    setPrevContent(content);
    setDraft(content);
  }

  const edit = (fn: (c: Content) => void) => {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
    setDirty(true);
  };

  const updater = draft.updater;
  const latestSet = updater.latestVersion.trim().length > 0;

  const errors: string[] = [];
  if (updater.latestVersion.trim() && !parseVersion(updater.latestVersion)) {
    errors.push("Latest version needs digits, e.g. 2.0.0.");
  }
  if (updater.minVersion.trim() && !parseVersion(updater.minVersion)) {
    errors.push("Minimum version needs digits, e.g. 1.5.0.");
  }
  if (updater.latestVersion.trim() && updater.minVersion.trim()) {
    const cmp = compareVersions(updater.minVersion, updater.latestVersion);
    if (cmp !== null && cmp > 0) errors.push("Minimum version can’t be newer than the latest version.");
  }
  if (updater.downloadUrl.trim() && !/^(https?:\/\/|\/(?!\/))/.test(updater.downloadUrl.trim())) {
    errors.push("Update URL must start with https://, http:// or a / path.");
  }

  const noticeLive = updater.enabled && latestSet;

  return (
    <div className="space-y-6">
      <Section
        title="Launcher update notice"
        hint="The launcher sends its version to GET /api/v1/update and shows this notice only when it is older than the latest version — current versions never see it. Nothing here affects the website."
      >
        <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-ink-2/50 px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium text-fg">Update notice enabled</p>
            <p className="mt-0.5 text-[12px] text-fg-3">
              When off, no launcher shows the notice — regardless of version.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Enable update notice"
            aria-checked={updater.enabled}
            onClick={() =>
              edit((c) => {
                c.updater.enabled = !c.updater.enabled;
              })
            }
            className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
              updater.enabled ? "border-accent/40 bg-accent" : "border-line bg-ink"
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-[3px] h-[18px] w-[18px] rounded-full transition-all ${
                updater.enabled ? "left-[23px] bg-ink" : "left-[3px] bg-fg-3"
              }`}
            />
          </button>
        </div>
      </Section>

      <Section title="Version gate" hint="“Latest” drives the notice; “minimum supported” additionally flags old builds as required so the launcher can block them. Leave the minimum empty to never block anyone.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Latest version"
            value={updater.latestVersion}
            placeholder="e.g. 2.0.0"
            onChange={(v) =>
              edit((c) => {
                c.updater.latestVersion = v;
              })
            }
          />
          <Field
            label="Minimum supported version (optional)"
            value={updater.minVersion}
            placeholder="e.g. 1.5.0"
            onChange={(v) =>
              edit((c) => {
                c.updater.minVersion = v;
              })
            }
          />
        </div>
        {!latestSet ? (
          <p className="mt-3 rounded-lg border border-dashed border-line-2 bg-ink/40 px-3.5 py-2.5 text-[12.5px] text-fg-3">
            No version published yet — launchers never see an update notice until a latest version is set.
          </p>
        ) : null}
      </Section>

      <Section title="Notice text" hint="Shown inside the launcher only when the player is on an older version. Leave the URL empty to fall back to the site’s /download page.">
        <div className="grid gap-4">
          <Field
            label="Title"
            value={updater.noticeTitle}
            placeholder="e.g. Loopix 2.0.0 is available"
            onChange={(v) =>
              edit((c) => {
                c.updater.noticeTitle = v;
              })
            }
          />
          <Area
            label="Message"
            value={updater.noticeBody}
            rows={3}
            onChange={(v) =>
              edit((c) => {
                c.updater.noticeBody = v;
              })
            }
          />
          <Field
            label="Update URL (optional)"
            value={updater.downloadUrl}
            placeholder="https://… or /download"
            onChange={(v) =>
              edit((c) => {
                c.updater.downloadUrl = v;
              })
            }
          />
        </div>
      </Section>

      <Section title="Launcher preview" hint="What players see inside the launcher right now.">
        <div className="rounded-xl border border-line bg-ink-2/50 p-5">
          <div
            className={`rounded-lg border p-4 ${
              noticeLive ? "border-accent/30 bg-ink" : "border-line bg-ink/40 opacity-60"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold text-fg">
                  {updater.noticeTitle.trim() || "Update notice title"}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-fg-2">
                  {updater.noticeBody.trim() || "Your message about the update shows up here."}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-ink">
                Update now
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-[12.5px] sm:grid-cols-2">
            <p className="rounded-lg border border-line bg-ink px-3 py-2 text-fg-2">
              <span className="text-fg">Older than {latestSet ? updater.latestVersion.trim() : "latest"}</span> →{" "}
              <span className={noticeLive ? "text-accent" : "text-fg-3"}>{noticeLive ? "notice shown" : "hidden"}</span>
            </p>
            <p className="rounded-lg border border-line bg-ink px-3 py-2 text-fg-2">
              <span className="text-fg">On {latestSet ? updater.latestVersion.trim() : "latest"} or newer</span> →{" "}
              <span className="text-fg-3">hidden</span>
            </p>
          </div>

          {noticeLive && updater.minVersion.trim() ? (
            <p className="mt-3 text-[12.5px] text-fg-3">
              Launchers below <span className="font-mono text-fg-2">{updater.minVersion.trim()}</span> are also
              flagged <span className="font-mono text-fg-2">required: true</span> so old builds can be blocked.
            </p>
          ) : null}
        </div>
      </Section>

      {errors.length > 0 ? (
        <ul className="space-y-1 text-[12.5px] text-red-300">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className={btnPrimary}
        disabled={!dirty || errors.length > 0}
        onClick={() => {
          void onSave(draft, "Launcher update settings saved.");
          setDirty(false);
        }}
      >
        Save update settings
      </button>
    </div>
  );
}

/* ---------------- docs ---------------- */

function DocsTab({
  docs,
  setDocs,
  showNotice,
  router,
}: {
  docs: Doc[];
  setDocs: (docs: Doc[]) => void;
  showNotice: (kind: "ok" | "error", text: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", slug: "", body: "", published: false });

  const selected = docs.find((d) => d.id === selectedId) ?? null;

  function selectDoc(doc: Doc | null) {
    setSelectedId(doc?.id ?? null);
    setDraft(doc ? { title: doc.title, slug: doc.slug, body: doc.body, published: doc.published } : { title: "", slug: "", body: "", published: false });
  }

  async function createDoc() {
    const res = await fetch("/api/admin/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Could not create the document.");
      return;
    }
    setDocs([...docs, data.doc]);
    selectDoc(data.doc);
    showNotice("ok", "Document created.");
    router.refresh();
  }

  async function saveDoc() {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/docs/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Could not save the document.");
      return;
    }
    setDocs(docs.map((d) => (d.id === selectedId ? data.doc : d)));
    showNotice("ok", "Document saved.");
    router.refresh();
  }

  async function deleteDoc() {
    if (!selectedId) return;
    if (!window.confirm("Delete this document permanently?")) return;
    const res = await fetch(`/api/admin/docs/${selectedId}`, { method: "DELETE" });
    if (!res.ok) {
      showNotice("error", "Could not delete the document.");
      return;
    }
    setDocs(docs.filter((d) => d.id !== selectedId));
    selectDoc(null);
    showNotice("ok", "Document deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Section title="Documents" hint="Markdown is supported: # headings, **bold**, - lists, [links](…). Only published docs are public.">
        <div className="flex flex-wrap gap-2">
          {docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => selectDoc(doc)}
              className={
                doc.id === selectedId
                  ? "rounded-lg bg-ink-2 px-3 py-1.5 text-[13px] font-medium text-fg ring-1 ring-accent/50"
                  : "rounded-lg border border-line bg-ink-2/60 px-3 py-1.5 text-[13px] text-fg-2 transition-colors hover:text-fg"
              }
            >
              {doc.title}
              {!doc.published ? <span className="ml-1.5 font-mono text-[9px] tracking-[0.1em] text-fg-3 uppercase">draft</span> : null}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
          <Field label="Slug" value={draft.slug} onChange={(v) => setDraft({ ...draft, slug: v })} placeholder="getting-started" />
        </div>
        <Area label="Content (markdown)" value={draft.body} onChange={(v) => setDraft({ ...draft, body: v })} rows={12} />
        <label className="flex items-center gap-2 text-[13.5px] text-fg-2">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Published (visible on /docs)
        </label>

        <div className="flex flex-wrap gap-2">
          {selected ? (
            <button type="button" className={btnPrimary} onClick={() => void saveDoc()}>
              Save document
            </button>
          ) : (
            <button type="button" className={btnPrimary} disabled={!draft.title || !draft.slug} onClick={() => void createDoc()}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Create document
            </button>
          )}
          {selected ? (
            <button type="button" className={btnGhost} onClick={() => void deleteDoc()}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
            </button>
          ) : null}
        </div>
        {selected ? (
          <p className="text-[12.5px] text-fg-3">
            Public URL: <span className="text-fg-2">/docs/{selected.slug}</span>
          </p>
        ) : null}
      </Section>
    </div>
  );
}

/* ---------------- users ---------------- */

function UsersTab({
  users,
  setUsers,
  showNotice,
}: {
  users: PublicUser[];
  setUsers: (users: PublicUser[]) => void;
  showNotice: (kind: "ok" | "error", text: string) => void;
}) {
  async function patch(id: string, body: Record<string, string>) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Could not update the user.");
      return;
    }
    setUsers(users.map((u) => (u.id === id ? data.user : u)));
    showNotice("ok", "User updated.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this user permanently? Their launcher profiles, skins and capes are removed too.")) return;
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Could not delete the user.");
      return;
    }
    setUsers(users.filter((u) => u.id !== id));
    showNotice("ok", "User deleted.");
  }

  return (
    <Section title="Users" hint={`${users.length} account${users.length === 1 ? "" : "s"}.`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line text-fg-3">
              <th className="py-2 pr-4 font-mono text-[10px] font-medium tracking-[0.16em] uppercase">User</th>
              <th className="py-2 pr-4 font-mono text-[10px] font-medium tracking-[0.16em] uppercase">Role</th>
              <th className="py-2 pr-4 font-mono text-[10px] font-medium tracking-[0.16em] uppercase">Status</th>
              <th className="py-2 pr-4 font-mono text-[10px] font-medium tracking-[0.16em] uppercase">Launcher profiles</th>
              <th className="py-2 font-mono text-[10px] font-medium tracking-[0.16em] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line/60">
                <td className="py-3 pr-4">
                  <span className="font-medium text-fg">{u.username}</span>
                  {u.email ? <span className="ml-2 text-fg-3">{u.email}</span> : null}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={
                      u.role === "admin"
                        ? "rounded-full border border-accent/40 bg-moss px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-accent uppercase"
                        : "rounded-full border border-line bg-ink-2 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-fg-3 uppercase"
                    }
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={u.status === "banned" ? "text-red-300" : "text-fg-2"}>{u.status}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-fg-2">
                    {u.launcherAccounts.length === 0
                      ? "—"
                      : u.launcherAccounts.map((a) => a.name).join(", ")}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => void patch(u.id, { role: u.role === "admin" ? "user" : "admin" })}
                    >
                      {u.role === "admin" ? "Make user" : "Make admin"}
                    </button>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => void patch(u.id, { status: u.status === "banned" ? "active" : "banned" })}
                    >
                      {u.status === "banned" ? "Unban" : "Ban"}
                    </button>
                    <button type="button" className={btnGhost} onClick={() => void remove(u.id)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ---------------- servers (launcher server list) ---------------- */

type ServerStatusInfo = {
  online: boolean;
  latencyMs: number | null;
  version: string | null;
  players: { online: number; max: number } | null;
  motd: string | null;
  checkedAt: string;
} | null;

type ServerRow = {
  id: string;
  name: string;
  address: string;
  description: string;
  version: string;
  iconUrl: string | null;
  enabled: boolean;
  status: ServerStatusInfo;
};

const rowBtn =
  "inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-ink font-mono text-[11px] text-fg-2 transition-colors hover:text-fg disabled:opacity-30";

/** Live status badge — measured with the real Minecraft ping, never faked. */
function StatusPill({ status, checking }: { status: ServerStatusInfo; checking: boolean }) {
  const base = "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px]";
  if (checking) {
    return (
      <span className={`${base} border-line bg-ink text-fg-3`}>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-3" aria-hidden="true" />
        Checking…
      </span>
    );
  }
  if (!status) return <span className={`${base} border-line bg-ink text-fg-3`}>Not checked yet</span>;
  if (status.online) {
    return (
      <span className={`${base} border-accent/30 bg-accent/10 text-accent`}>
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        Online{status.latencyMs !== null ? ` · ${status.latencyMs} ms` : ""}
      </span>
    );
  }
  return (
    <span className={`${base} border-red-400/30 bg-red-400/10 text-red-300`}>
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" />
      Offline
    </span>
  );
}

function ServersTab({ showNotice }: { showNotice: (kind: "ok" | "error", text: string) => void }) {
  const [servers, setServers] = useState<ServerRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", description: "", version: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", address: "", description: "", version: "" });
  const [iconTargetId, setIconTargetId] = useState<string | null>(null);
  const iconInput = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (fresh = false) => {
      if (fresh) setRefreshing(true);
      try {
        const res = await fetch(`/api/admin/servers${fresh ? "?fresh=1" : ""}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showNotice("error", data.error || "Could not load servers.");
          return;
        }
        setServers(data.servers ?? []);
      } catch {
        showNotice("error", "Could not load servers.");
      } finally {
        setRefreshing(false);
      }
    },
    [showNotice],
  );

  // Initial load: setState happens in the fetch callbacks (not in the effect body).
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/servers", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (alive) setServers(data.servers ?? []);
      })
      .catch(() => {
        if (alive) showNotice("error", "Could not load servers.");
      });
    return () => {
      alive = false;
    };
  }, [showNotice]);

  async function addServer(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/admin/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Could not add the server.");
      return;
    }
    setForm({ name: "", address: "", description: "", version: "" });
    showNotice("ok", "Server added — the launcher list updates immediately.");
    void load();
  }

  async function patchServer(id: string, body: Record<string, unknown>, okMessage?: string) {
    const res = await fetch(`/api/admin/servers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Could not update the server.");
      return false;
    }
    if (okMessage) showNotice("ok", okMessage);
    void load();
    return true;
  }

  async function removeServer(server: ServerRow) {
    if (!window.confirm(`Remove “${server.name}”? The launcher list updates immediately.`)) return;
    const res = await fetch(`/api/admin/servers/${server.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Could not remove the server.");
      return;
    }
    showNotice("ok", "Server removed.");
    void load();
  }

  function pickIcon(id: string) {
    setIconTargetId(id);
    iconInput.current?.click();
  }

  async function uploadIcon(file: File) {
    if (!iconTargetId) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/admin/servers/${iconTargetId}/icon`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Icon upload failed.");
      return;
    }
    showNotice("ok", "Server icon updated.");
    void load();
  }

  async function clearIcon(server: ServerRow) {
    const res = await fetch(`/api/admin/servers/${server.id}/icon`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice("error", data.error || "Could not remove the icon.");
      return;
    }
    showNotice("ok", "Server icon removed.");
    void load();
  }

  function move(index: number, delta: number) {
    if (!servers) return;
    const target = index + delta;
    if (target < 0 || target >= servers.length) return;
    void patchServer(servers[index].id, { order: target });
  }

  return (
    <div className="space-y-6">
      <Section
        title="Add a server"
        hint="Servers appear in the launcher's server list. Status is measured live with the Minecraft Server List Ping — online/offline, ping and player counts are real, never simulated."
      >
        <form onSubmit={addServer} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={form.name} placeholder="Loopix SMP" onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Address" value={form.address} placeholder="play.example.com:25565" onChange={(v) => setForm({ ...form, address: v })} />
          <Field
            label="Description (optional)"
            value={form.description}
            placeholder="One line shown under the name"
            onChange={(v) => setForm({ ...form, description: v })}
          />
          <Field
            label="Version label (optional)"
            value={form.version}
            placeholder="e.g. 1.8 – 1.21"
            onChange={(v) => setForm({ ...form, version: v })}
          />
          <div className="sm:col-span-2">
            <button type="submit" className={btnPrimary} disabled={!form.name.trim() || !form.address.trim()}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add server
            </button>
          </div>
        </form>
      </Section>

      <Section
        title="Servers"
        hint="This order is what the launcher shows. Hide keeps a server in the panel without deleting it; deleting also removes its icon file."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12.5px] text-fg-3">
            {servers === null ? "Loading…" : `${servers.length} ${servers.length === 1 ? "server" : "servers"}`}
          </span>
          <button type="button" className={btnGhost} disabled={refreshing || !servers} onClick={() => void load(true)}>
            {refreshing ? "Checking status…" : "Refresh status"}
          </button>
        </div>

        {servers && servers.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {servers.map((server, index) => (
              <li key={server.id} className="rounded-xl border border-line bg-ink-2/50 p-4">
                {editingId === server.id ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name" value={editDraft.name} onChange={(v) => setEditDraft({ ...editDraft, name: v })} />
                    <Field label="Address" value={editDraft.address} onChange={(v) => setEditDraft({ ...editDraft, address: v })} />
                    <Field
                      label="Description"
                      value={editDraft.description}
                      onChange={(v) => setEditDraft({ ...editDraft, description: v })}
                    />
                    <Field label="Version label" value={editDraft.version} onChange={(v) => setEditDraft({ ...editDraft, version: v })} />
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        type="button"
                        className={btnPrimary}
                        onClick={() => {
                          void patchServer(server.id, editDraft, "Server updated.").then((ok) => {
                            if (ok) setEditingId(null);
                          });
                        }}
                      >
                        Save
                      </button>
                      <button type="button" className={btnGhost} onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-line bg-ink">
                        {server.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={server.iconUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-mono text-[13px] text-fg-3">{server.name.slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      {server.iconUrl ? (
                        <button
                          type="button"
                          aria-label={`Remove ${server.name} icon`}
                          onClick={() => void clearIcon(server)}
                          className="absolute -top-1.5 -right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-line bg-ink text-[11px] leading-none text-fg-3 transition-colors hover:text-fg"
                        >
                          ×
                        </button>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-medium text-fg">{server.name}</span>
                        <span className="font-mono text-[11.5px] text-fg-3">{server.address}</span>
                        {server.enabled ? null : (
                          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[9.5px] tracking-[0.12em] text-fg-3 uppercase">
                            Hidden
                          </span>
                        )}
                      </div>
                      {server.description ? <p className="mt-1 text-[12.5px] text-fg-2">{server.description}</p> : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusPill status={server.status} checking={refreshing} />
                        {server.status?.players ? (
                          <span className="text-[11.5px] text-fg-3">
                            {server.status.players.online}/{server.status.players.max} players
                          </span>
                        ) : null}
                        {server.version ? (
                          <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-3">{server.version}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        aria-label={`Move ${server.name} up`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className={rowBtn}
                      >
                        <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${server.name} down`}
                        disabled={index === servers.length - 1}
                        onClick={() => move(index, 1)}
                        className={rowBtn}
                      >
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`${rowBtn} w-auto px-2.5`}
                        onClick={() => {
                          setEditingId(server.id);
                          setEditDraft({
                            name: server.name,
                            address: server.address,
                            description: server.description,
                            version: server.version,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`${rowBtn} w-auto px-2.5`}
                        onClick={() =>
                          void patchServer(
                            server.id,
                            { enabled: !server.enabled },
                            server.enabled ? "Server hidden from the launcher." : "Server visible in the launcher.",
                          )
                        }
                      >
                        {server.enabled ? "Hide" : "Show"}
                      </button>
                      <button type="button" className={`${rowBtn} w-auto px-2.5`} onClick={() => pickIcon(server.id)}>
                        Icon
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${server.name}`}
                        onClick={() => void removeServer(server)}
                        className={rowBtn}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-line-2 bg-ink/40 px-4 py-6 text-center text-[13px] text-fg-3">
            {servers === null
              ? "Loading…"
              : "No servers yet — add your first one above. The launcher shows the list to players."}
          </p>
        )}

        <input
          ref={iconInput}
          type="file"
          accept="image/png,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadIcon(file);
            e.target.value = "";
          }}
        />
      </Section>
    </div>
  );
}

/* ---------------- API status ---------------- */

type ApiStats = {
  online: number;
  heartbeatSeconds: number;
  origin: string;
  now: string;
  uptimeSeconds: number;
  counts: Record<string, number>;
  uploadsBytes: number;
  endpoints: { method: string; path: string; auth: string; description: string }[];
};

type ApiCheckResult = {
  path: string;
  method: string;
  status: number;
  expect: number;
  ms: number;
  ok: boolean;
};

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink-2/50 px-3.5 py-3">
      <p className="font-mono text-[10px] tracking-[0.14em] text-fg-3 uppercase">{label}</p>
      <p className="mt-1.5 text-[17px] font-semibold text-fg">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-fg-3">{hint}</p> : null}
    </div>
  );
}

function MethodChip({ method }: { method: string }) {
  return (
    <span className="rounded border border-line bg-ink px-1.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-fg-2">
      {method}
    </span>
  );
}

function ApiTab({ showNotice }: { showNotice: (kind: "ok" | "error", text: string) => void }) {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [results, setResults] = useState<ApiCheckResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/api-status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  async function runCheck() {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/api-status", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showNotice("error", data.error || "Health check failed.");
        return;
      }
      setResults(data.results);
      setCheckedAt(data.checkedAt);
      const failed = (data.results as ApiCheckResult[]).filter((r) => !r.ok).length;
      showNotice(
        failed ? "error" : "ok",
        failed
          ? `${failed} endpoint(s) did not answer as expected.`
          : `All ${data.results.length} endpoints answered as expected.`,
      );
    } finally {
      setChecking(false);
    }
  }

  const counts = stats?.counts ?? {};

  return (
    <div className="space-y-6">
      <Section
        title="Service status"
        hint="Live numbers straight from this server. Presence (launchers online) is in-memory and resets on restart, exactly like the header counter."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Stat
            label="Launchers online"
            value={stats ? stats.online : "…"}
            hint={stats ? `heartbeat ≤ ${stats.heartbeatSeconds}s ago` : undefined}
          />
          <Stat label="Users" value={stats ? `${counts.users ?? 0}` : "…"} hint={stats ? `${counts.admins ?? 0} admin` : undefined} />
          <Stat label="Launcher accounts" value={stats ? counts.launcherAccounts ?? 0 : "…"} />
          <Stat label="API sessions" value={stats ? counts.sessions ?? 0 : "…"} hint="tokens issued to launchers" />
          <Stat label="Servers" value={stats ? `${counts.serversEnabled ?? 0}/${counts.servers ?? 0}` : "…"} hint="enabled / total" />
          <Stat label="Docs" value={stats ? counts.docs ?? 0 : "…"} />
          <Stat label="Uploads" value={stats ? formatBytes(stats.uploadsBytes) : "…"} />
          <Stat label="Uptime" value={stats ? formatUptime(stats.uptimeSeconds) : "…"} />
        </div>
        {stats ? (
          <p className="mt-3 rounded-lg border border-line bg-ink/50 px-3.5 py-2.5 font-mono text-[11.5px] break-all text-fg-2">
            {stats.origin}
          </p>
        ) : null}
      </Section>

      <Section
        title="Health check"
        hint="Probes every endpoint below from the server itself and shows the real status code and latency. For protected routes 401 is the expected answer — it proves the route exists and auth is enforced."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12.5px] text-fg-3">
            {checkedAt ? `Last checked ${new Date(checkedAt).toLocaleTimeString()}` : "Not checked yet"}
          </span>
          <button type="button" className={btnPrimary} disabled={checking || !stats} onClick={() => void runCheck()}>
            {checking ? "Running…" : "Run health check"}
          </button>
        </div>

        {results ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="font-mono text-[10px] tracking-[0.12em] text-fg-3 uppercase">
                  <th className="pb-2 pr-3 font-medium">Method</th>
                  <th className="pb-2 pr-3 font-medium">Endpoint</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {results.map((r) => (
                  <tr key={`${r.method} ${r.path}`}>
                    <td className="py-2 pr-3">
                      <MethodChip method={r.method} />
                    </td>
                    <td className="py-2 pr-3 font-mono text-[12px] text-fg">{r.path}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          r.ok
                            ? "inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11.5px] text-accent"
                            : "inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[11.5px] text-red-300"
                        }
                      >
                        {r.ok
                          ? `${r.status} ${r.status === 200 ? "OK" : "expected"}`
                          : `${r.status || "no response"} — wanted ${r.expect}`}
                      </span>
                    </td>
                    <td className="py-2 text-fg-3">{r.ms} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-line-2 bg-ink/40 px-4 py-5 text-center text-[12.5px] text-fg-3">
            Run the health check to see live status codes and latency for every endpoint.
          </p>
        )}
      </Section>

      <Section
        title="Endpoints"
        hint="The complete API the launcher talks to. Send the bearer token from POST /api/v1/auth/login as an Authorization header."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="font-mono text-[10px] tracking-[0.12em] text-fg-3 uppercase">
                <th className="pb-2 pr-3 font-medium">Method</th>
                <th className="pb-2 pr-3 font-medium">Endpoint</th>
                <th className="pb-2 pr-3 font-medium">Auth</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {(stats?.endpoints ?? []).map((endpoint) => (
                <tr key={`${endpoint.method} ${endpoint.path}`}>
                  <td className="py-2 pr-3">
                    <MethodChip method={endpoint.method} />
                  </td>
                  <td className="py-2 pr-3 font-mono text-[12px] text-fg">{endpoint.path}</td>
                  <td className="py-2 pr-3 text-fg-2">{endpoint.auth}</td>
                  <td className="py-2 text-fg-3">{endpoint.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
