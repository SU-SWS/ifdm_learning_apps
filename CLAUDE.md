# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Educational financial-decision-making prototype for early-career professionals, built with Stanford GSB's Initiative for Financial Decision Making (IFDM). It's a Next.js **static site** of interactive financial calculators, each designed to be embedded via `<iframe>` inside the Mighty Networks platform. Hosted on GitHub Pages.

## Commands

```bash
nvm use              # match the Node version in .nvmrc before anything else
yarn install         # this repo uses yarn (yarn@1.22.22), not npm
yarn dev             # dev server with turbopack at http://localhost:3000
yarn build:local     # plain next build, no static-export path juggling — use this to check a build compiles
yarn lint            # next lint (eslint) — runs against app/ only
```

There is no test suite. Verification is manual: run `yarn dev` and exercise the calculator in the browser.

### Deploying (branch-gated — do not run casually)

Deploys publish to GitHub Pages via `gh-pages`. Each script refuses to run unless you're on the matching branch (`scripts/check-branch.js`):

- `yarn deploy` → production, requires branch `1.x`, publishes to https://ifdm-learning.stanford.edu/
- `yarn deploy:staging` → staging, requires branch `dev`, publishes to the `ifdm_learning_apps_staging` repo

Flow: feature branch → PR into `dev` → `yarn deploy:staging` (QA) → PR `dev` into `1.x` → `yarn deploy` (prod). Full details in `docs/deployment.md`.

## Architecture

**Static export.** `next.config.ts` sets `output: 'export'`, so this is a fully static site — no server, no API routes, no runtime data fetching. Everything is client-side. `images.unoptimized: true` and `trailingSlash: true` are required for GitHub Pages.

**`basePath` is environment-driven.** Production serves from a custom domain root (empty basePath); staging serves from a subpath and sets `NEXT_BASE_PATH=/ifdm_learning_apps_staging` in `build:staging`. If assets 404 in one environment but not the other, this is almost always the cause — never hardcode absolute asset paths.

**One calculator = one route = one file.** Each calculator lives at `app/interactives/<name>/page.tsx` and is a single self-contained `"use client"` component. They do **not** share calculation logic — each file owns its own state (all inputs held as `string` in `useState`), its own financial math, its own validation/error rules, and constant tables (frequency options, constraints) defined at the top of the file. When fixing a bug in one calculator, do not assume the fix applies elsewhere; check each file. `app/interactives/time-value-money-calculator/page.tsx` is the richest example of the established pattern (typed constants, a `CONSTRAINTS` object, `FieldError[]` validation).

Note the `-v2` variants (`mortgage-calculator-v2`, `present-value-calculator-v2`, `mortgage-refinancing-calculator-v2`) are the current versions; the un-suffixed ones are older and may be superseded — confirm which is linked/embedded before editing.

**The home page auto-discovers routes.** `app/page.tsx` reads the `app/` directory at build time (`fs.readdirSync`) and lists every subdirectory containing a `page.*` file. Adding a calculator directory automatically adds it to the index — no manual registration.

**Shared UI is shadcn/ui.** Reusable primitives live in `app/ui/components/` (button, card, input, select, slider, tabs, etc.), generated via shadcn (`components.json`, "new-york" style, lucide icons). Use `cn()` from `app/lib/utils.ts` (clsx + tailwind-merge) for class composition. Import via the `@/*` alias mapped to the repo root (e.g. `@/app/ui/components/card`).

## Styling conventions

- **Tailwind v4** with CSS-first theming. The brand palette (Stanford colors: `lagunita`, `berry`, `palo-verde`, `navy`, `error #8C1515`, etc.) is defined as CSS variables in `app/ui/globals.css` under `@theme inline`, plus a few legacy tokens in `tailwind.config.js`. Prefer the named tokens over raw hex/rgba.
- **Dark mode** is class-based (`darkMode: 'class'`). `app/lib/theme-toggle.tsx` toggles the `dark`/`light` class on `<html>` and persists to `localStorage`; it returns a placeholder until mounted to avoid hydration mismatch. Any color you add needs a dark-mode counterpart.
- Fonts (Open Sans, Poppins) come from `app/ui/fonts.ts` via `next/font/google`.

## Gotchas

- No-cache headers are set in `app/layout.tsx` metadata because embeds are served through iframes and stale caches were a recurring problem.
- Financial math is the sensitive surface here — the changelog shows repeated fixes to interest-rate solvers, edge cases (zero rate, high rate, cross-compounding frequency), and currency-input handling. Treat validation and solver edits carefully and test boundary values.
