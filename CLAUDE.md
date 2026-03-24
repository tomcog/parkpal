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

### Key files

- `src/App.tsx` — Main application component. Contains all top-level state, auth flow, park filtering/sorting, geolocation, visit tracking logic, and renders the park grid. This is a large single-file component (~600 lines).
- `src/components/AuthScreen.tsx` — Email/password sign-in and sign-up screen with guest mode.
- `src/components/NationalParkCard.tsx` — Individual park card with visit toggling, notes, date picker, photo upload (via Supabase storage), and detail drawer/dialog.
- `src/utils/supabase/client.ts` — Supabase client initialization and `ParkVisitRow` type definition.

### Data layer

- Park data is static in `src/data/nationalParks.ts` (all 63 parks with coordinates, descriptions, facts, trivia).
- Supporting data: `parkAbbreviations.ts`, `stateAbbreviations.ts`, `parkThumbnails.ts`.
- Park images are hardcoded Unsplash URLs in `App.tsx` (`parkImages` record).
- Visit data (visited status, notes, dates, photos) is stored in Supabase and synced per-user.

### UI

- UI primitives are shadcn/ui components in `src/components/ui/` (button, input, dialog, drawer, calendar, etc.) using Radix UI + `class-variance-authority`.
- Path alias: `@/` maps to `src/`.
- CSS variables for theming are defined in `src/index.css` with light/dark mode support.
- Icons from `lucide-react`.

### PWA

Configured via `vite-plugin-pwa` in `vite.config.ts` with auto-update service worker and manifest for standalone mobile install.
