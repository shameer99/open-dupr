# Open DUPR

<div align="center">
  <img src="open-dupr-react/public/logo.png" alt="Open DUPR Logo" width="200"/>
</div>

https://opendupr.com

An unofficial, fast, clean, and open-source frontend for [DUPR](https://dupr.com)

## Why

DUPR is a great rating system, but the official website and app leave a lot to be desired.

### Issues with the official DUPR website and app

- **Annoying ads, popups, upsells**
- Slow
- Unintuitive UI

### Open DUPR vs Official DUPR

| Core User Journey         | Open DUPR                                                                                                                                                                                               | Official DUPR iOS App                                                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Player Profile Screen** | <img src="docs/assets/open-dupr-profile.png" width="300" alt="Open DUPR Profile"/><br/>✨ **Cleaner interface**<br/>• Simple, fast loading<br/>• All stats visible at once<br/>• No ads or distractions | <img src="docs/assets/offical-dupr-profile.png" width="300" alt="Official DUPR Profile"/><br/>📱 **Cluttered interface**<br/>• Ads on profile view<br/>• Less information visible                               |
| **Adding Match Journey**  | <img src="docs/assets/official-dupr-add-match.gif" width="300" alt="Open DUPR Add Match"/><br/>⚡ **Quick & streamlined**<br/>• Prioritizes followers/friends<br/>• Simple score input                  | <img src="docs/assets/open-dupr-add-match.gif" width="300" alt="Official DUPR Add Match"/><br/>🐌 **Complex flow**<br/>• Popups and ads galore<br/>• Longer, multi-step process<br/>• More friction to complete |

Both tested on iPhone 16 Pro Max on iOS 26 Developer Beta 9 on September 9, 2025. Open DUPR installed as a PWA. Official DUPR iOS App version 1.9.2 installed from the App Store.

## Features

- **Clean, fast interface** - No ads or distractions
- **Player profiles** - View ratings, match history, and stats
- **Match recording** - Record new matches and validate pending ones
- **Player search** - Find and follow other players
- **Social features** - Follow players and see their activity
- **PWA support** - Install as a mobile app
- **Responsive design** - Works on desktop and mobile
- **Native iOS app** - SwiftUI app for iOS 18+ with haptics and animations

## Projects

### React Web App

The main web application built with React.

#### Prerequisites

- [Bun](https://bun.sh) package manager

#### Installation

```bash
cd open-dupr-react
bun install
bun run dev
```

The app will be available at `http://localhost:5173`

#### Build

```bash
bun run build
```

### Native iOS App

A native iOS implementation using SwiftUI for iOS 18+.

See [OpenDUPR-iOS README](./OpenDUPR-iOS/README.md) for details.

Features:
- Native SwiftUI interface
- Haptic feedback throughout
- Smooth animations
- WebView integration for complex features
- Full offline support

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation

## What's Missing?

Coming Soon™️

- Add multiple games in a match
- More game formats e.g. Round Robin
- Player ratings on the add teammate/opponent view
- Recent players in additon to following/followers on add teammate/opponent view
- Edit profile

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## API

DUPR has a public API at `api.dupr.gg` with an [OpenAPI spec](https://backend.mydupr.com/v3/api-docs/DUPR%20Backend%20APIs) ([Swagger UI](https://backend.mydupr.com/swagger-ui/index.html)). A [downloaded copy](./api_reference/raw_openapi_spec.json) and notes live in [api_reference](./api_reference/README.md).

DUPR rejects requests from unknown origins, so the client never calls `api.dupr.gg` directly. Instead, `/api/...` requests are proxied same-origin: a [Vercel](https://vercel.com) Edge Function (`api/proxy.ts`) strips `Origin`/`Referer` and forwards to DUPR in production; the Vite dev server does the same locally. If a response includes Render’s `rndr-id` header (legacy static host), the client switches to `https://open-dupr.vercel.app/api` for the rest of the tab session (`VITE_VERCEL_API_BASE` overrides that URL). **Remove that fallback after 2026-07-01** (see `TODO` in `src/lib/api.ts`) once the domain is Vercel-only—DNS caches typically clear in hours to a couple of days; the extra months cover edge cases.
