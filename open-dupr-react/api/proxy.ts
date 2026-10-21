export const config = { runtime: "edge" };

// Keep the old endpoint as a tombstone for cached clients and bookmarks.
// No credentials, requests, or match writes are forwarded to DUPR.
export default function handler() {
  return Response.json(
    { message: "Open DUPR has retired. Please use the official DUPR app or website." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
