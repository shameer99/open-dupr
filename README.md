# Open DUPR — retired

[opendupr.com](https://opendupr.com)

Open DUPR was an unofficial, fast, clean, open-source frontend for [DUPR](https://dupr.com), built to make checking ratings and recording matches simpler and free from ads and upsells.

## Why it retired

Keeping up with DUPR’s API and authentication changes takes more time than I can give the project. Moving from direct browser requests to a server-side proxy also reduced some of its original simplicity, while the official app improved in several areas.

I still wish the official experience had fewer subscription prompts and made the option to skip them more obvious. However, I can no longer provide the maintenance Open DUPR needs.

Thank you to everyone who used it, shared feedback, or contributed.

## What happens now

- Every website route displays a retirement notice with links to DUPR and this repository.
- The former API proxy returns **410 Gone** and no longer forwards requests or credentials.
- Previously installed PWAs receive a cleanup worker when their browser checks for updates. It removes the old Workbox caches and reloads open windows to the notice. An offline copy may remain visible until it reconnects and updates.
- The notice removes Open DUPR’s locally saved access token, refresh token, and proxy fallback setting.
- DUPR accounts, ratings, and match records remain with DUPR.

## Source and forks

The source remains available under the [MIT License](LICENSE). There are no plans for further feature development or compatibility fixes. Forks are welcome, but the retained API documentation is historical and may no longer match DUPR.

The last active app is preserved in Git history at [f33de87](https://github.com/shameer99/open-dupr/tree/f33de87ee418cd90a948df8587a7794f2b1ab187). Its React components and API reference also remain in this repository for reference; they are not included in the retirement page’s browser bundle.

## Local development

Requires [Bun](https://bun.sh).

```bash
cd open-dupr-react
bun install
bun run dev
```

Build with `bun run build`; lint with `bun run lint`. The Vite development server serves the notice without an upstream API proxy. The 410 API response is provided by the Vercel Edge Function in production.

## Deployment notes

Keep the existing deployment URLs, including `open-dupr.vercel.app`, serving this retirement build so cached installations can retrieve `/sw.js` and old API clients receive 410 responses. The cleanup worker must retain its existing URL and no-cache headers.

Merging this change does not archive the GitHub repository or remove hosting. Archive the repository separately after the retirement deployment is verified.
