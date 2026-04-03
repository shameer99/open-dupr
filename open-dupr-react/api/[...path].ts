export const config = { runtime: "edge" };

const BLOCKED_HEADERS = new Set(["origin", "referer"]);

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/api/, "") || "/";
  const target = `https://api.dupr.gg${targetPath}${url.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!BLOCKED_HEADERS.has(key)) headers.set(key, value);
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

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}
