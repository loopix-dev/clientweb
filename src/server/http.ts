export const json = (data: unknown, status = 200): Response => Response.json(data, { status });
export const bad = (error: string, status = 400): Response => Response.json({ error }, { status });
export const unauthorized = (): Response => Response.json({ error: "Not signed in." }, { status: 401 });
export const forbidden = (): Response => Response.json({ error: "Admin access required." }, { status: 403 });
