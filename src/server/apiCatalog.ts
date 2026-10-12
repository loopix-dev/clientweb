/**
 * Single source of truth for the API surface, shown in the admin "API" tab
 * and used by the health check.
 *
 * Endpoints with a `probe` are tested server-side. `expect` is the status an
 * *unauthenticated* request should receive: for protected routes that is 401,
 * which proves the route exists and auth is actually enforced.
 */
export interface ApiEndpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  auth: string;
  description: string;
  probe?: { method: "GET" | "POST"; body?: string; expect: number };
}

export const API_CATALOG: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/online",
    auth: "Public",
    description: "Live count of launchers online (the pill in the site header)",
    probe: { method: "GET", expect: 200 },
  },
  {
    method: "GET",
    path: "/api/auth/status",
    auth: "Public",
    description: "Whether the first (admin) account still needs to be created",
    probe: { method: "GET", expect: 200 },
  },
  {
    method: "GET",
    path: "/api/v1/meta",
    auth: "Public",
    description: "Brand, download links and feature flags for the launcher",
    probe: { method: "GET", expect: 200 },
  },
  {
    method: "GET",
    path: "/api/v1/update",
    auth: "Public",
    description: "Update notice + version gate for the launcher (?version=1.2.3)",
    probe: { method: "GET", expect: 200 },
  },
  {
    method: "POST",
    path: "/api/v1/auth/login",
    auth: "Public",
    description: "Launcher sign-in (identifier + password) → bearer token",
    probe: { method: "POST", body: "{}", expect: 401 },
  },
  {
    method: "POST",
    path: "/api/v1/presence",
    auth: "Bearer token",
    description: "Heartbeat while the launcher is running (every 30 s)",
    probe: { method: "POST", body: "{}", expect: 401 },
  },
  {
    method: "GET",
    path: "/api/v1/servers",
    auth: "Bearer token",
    description: "Server list with live status — shown in the launcher",
    probe: { method: "GET", expect: 401 },
  },
  {
    method: "GET",
    path: "/api/v1/account",
    auth: "Bearer token",
    description: "Active launcher account with skin and cape URLs",
    probe: { method: "GET", expect: 401 },
  },
  {
    method: "POST",
    path: "/api/v1/account/skin",
    auth: "Bearer token",
    description: "Push a skin for a linked launcher account",
    probe: { method: "POST", body: "{}", expect: 401 },
  },
  {
    method: "POST",
    path: "/api/v1/account/cape",
    auth: "Bearer token",
    description: "Push a cape for a linked launcher account",
    probe: { method: "POST", body: "{}", expect: 401 },
  },
];
