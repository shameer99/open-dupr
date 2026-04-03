export const config = { runtime: "edge" };

// TODO(2026-07-01): Revisit CORS allowlist if Render cross-origin fallback is removed (see api.ts).

const BLOCKED_HEADERS = new Set(["origin", "referer"]);

const ALLOWED_ORIGINS = new Set([
  "https://opendupr.com",
  "https://www.opendupr.com",
  "https://open-dupr.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const CORS_ALLOW_HEADERS =
  "Authorization, Content-Type, x-refresh-token, X-Requested-With";

const CORS_ALLOW_METHODS = "GET, POST, PUT, DELETE, OPTIONS, HEAD";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }
  if (ALLOWED_ORIGINS.has(origin)) {
    return true;
  }
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

function corsPreflightResponse(request: Request): Response | null {
  if (request.method !== "OPTIONS") {
    return null;
  }
  const origin = request.headers.get("origin");
  if (!origin || !isAllowedOrigin(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
      "Access-Control-Allow-Methods": CORS_ALLOW_METHODS,
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  });
}

function withCors(request: Request, response: Response): Response {
  const origin = request.headers.get("origin");
  if (!origin || !isAllowedOrigin(origin)) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  headers.set("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
  headers.set("Vary", "Origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default async function handler(request: Request) {
  const preflight = corsPreflightResponse(request);
  if (preflight) {
    return preflight;
  }

  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/api/, "") || "/";
  const target = `https://api.dupr.gg${targetPath}${url.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!BLOCKED_HEADERS.has(key)) {
      headers.set(key, value);
    }
  });
  headers.set("host", "api.dupr.gg");

  const res = await fetch(target, {
    method: request.method,
    headers,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : undefined,
    // @ts-expect-error -- required for streaming request bodies in edge runtime
    duplex: "half",
  });

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("content-encoding");

  return withCors(
    request,
    new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    })
  );
}
