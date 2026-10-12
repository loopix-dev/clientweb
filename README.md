# Loopix Client — Website

Marketing site + user/admin platform for **Loopix Client**, built with Next.js (App Router),
React, TypeScript and Tailwind CSS v4.

## Pages

| Route        | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `/`          | Home: hero, features, FAQ preview, download call-to-action         |
| `/features`  | Feature list                                                       |
| `/download`  | Download page: PC + Mobile cards, launcher screenshots, install steps |
| `/docs`      | Docs index (admin-managed, Markdown)                               |
| `/faq`       | Full FAQ                                                           |
| `/login`     | Sign in with email or username + password                         |
| `/register`  | Create account — **the first account created becomes the admin**   |
| `/dashboard` | User dashboard: linked launcher profiles, skins/capes, security    |
| `/admin`     | Admin panel (admin role only): content, screenshots, downloads, SEO, docs, users |
| `/api/v1/*`  | Launcher API (see below)                                           |

## Accounts: web vs launcher

There are two distinct identities:

- **Web account** — email + password. Signs you into the website and the launcher API.
- **Launcher accounts** — offline Minecraft player names (up to 6 per web account), each with
  its own skin and cape. One is *active* — that is the profile the launcher uses in-game.

You manage both from the **user dashboard** (`/dashboard`): link/rename/unlink launcher
accounts, switch the active one, upload skins and capes, and change your sign-in details.
The launcher signs in with the same web credentials and syncs everything through the API.

## Admin panel (`/admin`)

Everything on the public site is managed from the admin panel and stored in `data/db.json`:

- **Settings** — brand name, tagline, accent color, logo & favicon upload
- **Site text** — hero, features, FAQ, footer copy
- **Screenshots** — multiple PC + Mobile launcher previews (add many, reorder, remove);
  the download page shows them as an auto-swiping carousel
- **Downloads** — URL, version and file size per platform (empty URL keeps the honest
  “not published yet” state)
- **Updates** — launcher update notice: latest/minimum version gate, notice title/message,
  update URL and a live preview. Old launcher versions see the notice, current ones never do
- **Servers** — the Minecraft servers the launcher displays: add, edit, reorder, hide or
  delete them, upload an icon. Status (online/offline, ping, players) is measured live with
  the real Server List Ping — never simulated
- **SEO** — meta title/description/keywords + custom social-preview (Open Graph) image,
  with live search-result and share-card previews
- **API** — service status (launchers online, users, sessions, uploads, uptime), a health
  check that probes every endpoint and reports its real status code + latency, and the full
  endpoint reference
- **Docs** — create/edit/publish Markdown documents (`/docs/<slug>`)
- **Users** — promote to admin, ban/unban, delete accounts (their launcher profiles and
  uploaded files go with them)

Edits are applied immediately (static pages are revalidated on save).

### First run

1. `npm run dev` (or `npm run build && npm run start`)
2. Open `/register` — the page explains that this **first** account becomes the admin.
   Every account registered afterwards is a regular user.
3. Sign in and open `/admin` (admins also get an “Admin panel” shortcut in the dashboard).

To reset everything, delete `data/` (database and uploads).

## Launcher API (`/api/v1`)

| Method | Endpoint               | Auth                  | Description                                             |
| ------ | ---------------------- | --------------------- | ------------------------------------------------------- |
| GET    | `/api/v1/meta`         | none                  | Name, published downloads and docs                      |
| GET    | `/api/v1/update`       | none                  | Update notice + version gate (`?version=1.2.3`)          |
| POST   | `/api/v1/auth/login`   | `{identifier,password}` | Bearer `token` + launcher accounts (identifier = email or username) |
| GET    | `/api/v1/account`      | `Bearer <token>`      | Profile, linked launcher accounts and active account     |
| PATCH  | `/api/v1/account`      | `Bearer <token>`      | `{activeAccountId}` switches profile; other fields need `currentPassword` |
| POST   | `/api/v1/account/skin` | `Bearer <token>`      | Upload a skin (multipart `file`, optional `accountId`)   |
| DELETE | `/api/v1/account/skin` | `Bearer <token>`      | Remove the skin (optional `?accountId=`)                 |
| POST   | `/api/v1/account/cape` | `Bearer <token>`      | Upload a cape (multipart `file`, optional `accountId`)   |
| DELETE | `/api/v1/account/cape` | `Bearer <token>`      | Remove the cape (optional `?accountId=`)                 |
| POST   | `/api/v1/presence`     | `Bearer <token>`      | Heartbeat while the launcher runs; `{"status":"offline"}` on exit |
| GET    | `/api/v1/servers`      | `Bearer <token>`      | Enabled servers in admin order, each with live status    |

Skin/cape uploads target the **active** launcher account unless `accountId` is given.

### Live “N online” counter

The site header shows how many launchers are online right now. The launcher pings
`POST /api/v1/presence` (bearer token) every ~30 seconds; an account counts as online for
2 minutes after its last heartbeat. The public count is served by `GET /api/online`
(`{ online: n }`, no auth). Presence is held in memory only — it resets on server restart
and is never written to disk.

### Server list (for the launcher)

Servers are managed in the admin panel (**Servers** tab). The launcher fetches them with
`GET /api/v1/servers`:

```json
{
  "servers": [
    {
      "id": "…",
      "name": "Loopix SMP",
      "address": "play.example.com:25565",
      "description": "One line shown under the name",
      "version": "1.8 – 1.21",
      "iconUrl": "/uploads/servers/….png",
      "status": {
        "online": true,
        "latencyMs": 42,
        "version": "1.21.4",
        "players": { "online": 3, "max": 20 },
        "motd": "Welcome!",
        "checkedAt": "…"
      }
    }
  ],
  "checkedAt": "…"
}
```

Status comes from the vanilla **Server List Ping** (handshake → status request), cached
server-side for 30 seconds. A server that does not answer is reported `online: false` —
disabled servers are omitted entirely.

### Launcher API examples

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"you@example.com","password":"********"}'

curl http://localhost:3000/api/v1/account -H "Authorization: Bearer <token>"

curl -X POST http://localhost:3000/api/v1/account/skin \
  -H "Authorization: Bearer <token>" \
  -F "file=@skin.png"
```

### Launcher update notice

Everything lives in the admin panel (**Updates** tab): the enabled toggle, latest/minimum
version, notice title/message and the update URL (falls back to the site’s `/download` page).
The launcher calls `GET /api/v1/update?version=1.2.3` (no auth) on startup:

```json
{
  "enabled": true,
  "latestVersion": "2.0.0",
  "minVersion": "1.5.0",
  "notice": { "title": "Loopix 2.0.0 is available", "body": "…" },
  "downloadUrl": null,
  "downloadPath": "/download",
  "version": "1.2.3",
  "updateAvailable": true,
  "required": true,
  "showNotice": true
}
```

Rules — all decided server-side, nothing simulated:

- `showNotice` is `true` only when the notice is enabled, a latest version is published **and**
  the launcher’s version is older — current versions always get `false`.
- `required` flags builds below the minimum supported version (`false` when no gate is set)
  so the launcher can block old builds.
- Unparsable or missing versions return `null` — the launcher then shows nothing.
- When the notice is disabled, `showNotice` and `required` are `false` no matter what.

## Configuration

- `src/config/site.ts` — static project identity and official external links (Discord, support,
  legal). Leave a link `null` and the site renders an honest “soon” state instead of a dead link.
- `NEXT_PUBLIC_SITE_URL` env var — production domain used for OG/canonical URLs
  (also settable via `siteConfig.url`).
- `SESSION_SECURE=1` — set when serving over HTTPS so session cookies get the `Secure` flag.

## Storage & security

- **Database**: `data/db.json` (atomic writes). No external database required; swap
  `src/server/db.ts` if you outgrow it.
- **Uploads**: `data/uploads/` — logo, favicon, screenshots, user skins & capes
  (PNG/SVG only, max 2 MB, magic-byte validated). Served by the dynamic
  `/uploads/*` route so images appear immediately after upload.
- **Passwords**: `scrypt` hashing (Node crypto, per-user salt, constant-time compare).
- **Sessions**: random 256-bit tokens stored hashed; httpOnly, SameSite=Lax cookies for the
  web and `Authorization: Bearer` tokens for the launcher.
- **Access control**: `/admin` requires an admin session; admin APIs re-check the role on
  every request; the last admin cannot be demoted or deleted; banned users are signed out.

## Development

```bash
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Structure

```
src/
  app/                  # pages, API routes, dynamic favicon
  components/           # site sections + admin & dashboard UIs
  config/site.ts        # static identity + official links
  server/               # db, auth, content model, uploads, http helpers
  lib/                  # markdown renderer, color utils, cn()
data/db.json            # runtime database (created on first mutation)
data/uploads/           # uploaded images (created on demand, served via /uploads/*)
```

## Notes

- The site is a frontend + platform; it never claims features the client does not have.
  Any unpublished information renders an honest placeholder, never a fake value.
- Loopix Client is an independent project. Not affiliated with Mojang Studios or Microsoft.
