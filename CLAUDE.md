# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (port read from `../ports.json` under key `"ParkPal"`)
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Lint:** `npm run lint`
- **Preview production build:** `npm run preview`

There are no tests configured in this project.

## Architecture

ParkPal is a PWA for tracking visits to US national parks. It uses React 19, TypeScript, Vite 7, Tailwind CSS v4, and Supabase for auth and data storage.

### Environment

Secrets live in `.env.local` (gitignored via `*.local`) and are read through `import.meta.env`:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — consumed by `src/utils/supabase/client.ts`; `createClient` throws at startup if either is missing.
- `VITE_GOOGLE_MAPS_API_KEY` — consumed by `src/App.tsx` and forwarded to the `RouteFinder` component.
- `VITE_UNSPLASH_ACCESS_KEY` — consumed by `NationalParkCard.tsx` for the photo-swap UI.

### Key files

- `src/App.tsx` — Top-level page component (~595 lines). Owns filter/sort UI state, scroll-aware header, geolocation/nearest-park dialog, user-profile drawer, and route-finder gating. Delegates auth and park-visit state to hooks.
- `src/hooks/useAuth.ts` — Session bootstrap, `onAuthStateChange` listener, and `continueAsGuest` / `signOut` / `goToAuthScreen` helpers. Owns `authState`, `user`, `isGuest`.
- `src/hooks/useParkData.ts` — Park-visit state (`parkData`, `headerImageOverrides`), Supabase load/upsert/delete, guest `localStorage` persistence, and mutation helpers (`toggleVisited`, `updateParkNote`, `updateParkDate`, `updateParkPhoto`, `updateHeaderImage`, `resetParkData`, `clearSaveError`). Exposes `ParkData` type.
- `src/components/AuthScreen.tsx` — Email/password sign-in and sign-up screen with guest mode entry.
- `src/components/NationalParkCard.tsx` — Individual park card with visit toggling, notes, date picker, photo upload (Supabase storage), Unsplash photo-swap, and detail drawer/dialog.
- `src/components/RouteFinder.tsx` — Drawer that fetches Google Directions and finds parks along a route. Lazy-loaded in `App.tsx` so the `@googlemaps/js-api-loader` bundle only ships when the user opens the drawer.
- `src/components/AddressAutocomplete.tsx` — Google Places autocomplete input used inside `RouteFinder`.
- `src/utils/supabase/client.ts` — Supabase client initialization; exports `ParkVisitRow` and `SavedRouteRow` types.
- `src/utils/route.ts` — Polyline encode/decode, corridor-based park matching, and Routes API fetching.
- `src/utils/imageSize.ts` — `resizeUnsplashUrl(url, width)` rewrites the `w=` query on Unsplash URLs so each render site requests an appropriately-sized rendition.

### Data layer

- Park data is static in `src/data/nationalParks.ts` (all 63 parks with coordinates, descriptions, facts, trivia).
- `src/data/parkImages.ts` — header image URL per park id (Unsplash).
- `src/data/parkThumbnails.ts` — 4 Unsplash thumbnails per park id, rendered inside `NationalParkCard`.
- `src/data/parkAbbreviations.ts`, `src/data/stateAbbreviations.ts` — display-name shorteners.
- Visit data (visited status, notes, dates, photos) is stored in Supabase (`park_visits` table) and synced per-user. Guests persist to `localStorage` under `parkData_guest` / `parkpal_header_images`.
- Saved routes are stored in the `saved_routes` Supabase table for signed-in users.

### UI

- UI primitives are shadcn/ui components in `src/components/ui/` (button, input, dialog, drawer, calendar, etc.) using Radix UI + `class-variance-authority`.
- `buttonVariants` lives in `src/components/ui/button-variants.ts` so `button.tsx` only exports a component (required for React Fast Refresh).
- Path alias: `@/` maps to `src/`.
- CSS variables for theming are defined in `src/index.css` with light/dark mode support.
- Icons from `lucide-react`.

### Build configuration

`vite.config.ts` splits vendor code into named chunks (`react`, `supabase`, `radix`, `icons`) via `rollupOptions.output.manualChunks`. `react-day-picker` and `date-fns` are intentionally unchunked so `react-day-picker` travels with the lazy `Calendar` chunk. `RouteFinder` is `React.lazy`-loaded in `App.tsx`; the `Calendar` dialog inside `NationalParkCard` is `React.lazy`-loaded too. `NationalParkCard` is wrapped in `React.memo` to avoid re-renders across sibling cards.

### PWA

Configured via `vite-plugin-pwa` in `vite.config.ts` with auto-update service worker and manifest for standalone mobile install.

`workbox.runtimeCaching` caches Unsplash images (CacheFirst) and Supabase `park-photos` bucket URLs (StaleWhileRevalidate) so already-viewed park artwork works offline.

`index.html` includes `<link rel="preconnect">` hints for `images.unsplash.com` and the Supabase project URL to reduce TLS handshake latency on first paint.
