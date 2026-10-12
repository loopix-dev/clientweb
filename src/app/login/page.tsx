"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 403
            ? "This account has been suspended."
            : data.error || "Sign-in failed. Check your email and password.",
        );
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-5 py-28">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-[15px] text-fg-2">
        Sign in to your Loopix web account to manage your launcher profiles.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-[13px] font-medium text-fg-2">Email or username</span>
          <input
            className="mt-1.5 w-full rounded-lg border border-line bg-ink-2 px-3.5 py-2.5 text-[15px] text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            placeholder="you@example.com or your name"
            required
          />
        </label>
        <label className="block">
          <span className="text-[13px] font-medium text-fg-2">Password</span>
          <input
            type="password"
            className="mt-1.5 w-full rounded-lg border border-line bg-ink-2 px-3.5 py-2.5 text-[15px] text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
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
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-[13.5px] text-fg-2">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-accent hover:text-accent-hover">
          Create one
        </Link>
      </p>
    </section>
  );
}
