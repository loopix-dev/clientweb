"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // null = still checking whether the site needs its first (admin) account.
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && typeof d?.setupRequired === "boolean") setSetupRequired(d.setupRequired);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create the account.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const isSetup = setupRequired === true;

  return (
    <section className="mx-auto max-w-md px-5 py-28">
      <h1 className="text-3xl font-semibold tracking-tight">
        {isSetup ? "Set up the admin account" : "Create your account"}
      </h1>
      <p className="mt-2 text-[15px] text-fg-2">
        {isSetup
          ? "This first account owns and manages the site."
          : "Your web account signs you into the site and the launcher. The launcher profiles you add inside are separate."}
      </p>

      {isSetup ? (
        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3.5 text-[13.5px] leading-relaxed text-fg-2">
          <span className="font-medium text-fg">Why this matters:</span> a site needs one
          administrator to manage content, downloads and users. This very first account becomes
          that admin — every account registered afterwards is a regular user.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-[13px] font-medium text-fg-2">Username</span>
          <input
            className="mt-1.5 w-full rounded-lg border border-line bg-ink-2 px-3.5 py-2.5 text-[15px] text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <span className="mt-1 block text-[12px] text-fg-3">3–16 characters: letters, numbers, underscores.</span>
        </label>
        <label className="block">
          <span className="text-[13px] font-medium text-fg-2">Email</span>
          <input
            type="email"
            className="mt-1.5 w-full rounded-lg border border-line bg-ink-2 px-3.5 py-2.5 text-[15px] text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <span className="mt-1 block text-[12px] text-fg-3">Used to sign in on the web and in the launcher.</span>
        </label>
        <label className="block">
          <span className="text-[13px] font-medium text-fg-2">Password</span>
          <input
            type="password"
            className="mt-1.5 w-full rounded-lg border border-line bg-ink-2 px-3.5 py-2.5 text-[15px] text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <span className="mt-1 block text-[12px] text-fg-3">At least 8 characters.</span>
        </label>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13.5px] text-red-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-accent px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {busy
            ? "Creating…"
            : isSetup
              ? "Create admin account"
              : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-[13.5px] text-fg-2">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Sign in
        </Link>
      </p>
    </section>
  );
}
