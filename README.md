# Contour Analytics Engine

Contour is an offline-first real estate CRM and operating system for Zambia, built as a shared web + desktop TypeScript monorepo.

## Stack

- Web: Next.js 16
- Desktop: Electron
- Auth: Clerk
- Database: Neon Postgres with Prisma 7
- Shared packages: brand, auth policy, db config

## Local Setup

1. Copy `.env.example` to `.env.local` and fill in your Clerk and Neon values.
2. Install dependencies with `npm install`.
3. Start the web app with `npm run dev:web`.
4. Start the desktop shell with `npm run dev:desktop`.

The web app also loads `.env.local` and `.env.development.local` from the repo root, so keep the real Clerk and Neon files there during development.

## Useful Scripts

- `npm run dev:web`
- `npm run dev:desktop`
- `npm run build:web`
- `npm run build:desktop`
- `npm run seed:db`
- `npm run typecheck`
- `npm run typecheck:desktop`

## Database

- Prisma schema: `packages/db/prisma/schema.prisma`
- Prisma config: `packages/db/prisma.config.ts`
- Regenerate the client from `packages/db` with `npx prisma generate`
- Seed demo CRM data with `npm run seed:db`

## Environment Variables

- Clerk: `CONTOUR_AUTH_CLERK_SECRET_KEY`, `NEXT_PUBLIC_CONTOUR_AUTH_CLERK_PUBLISHABLE_KEY`
- Neon pooled app URL: `CONTOUR_DATABASE_URL`
- Neon direct URL for Prisma CLI: `CONTOUR_DATABASE_URL_UNPOOLED` or `CONTOUR_POSTGRES_URL_NON_POOLING`
- Web shell URL for desktop: `CONTOUR_WEB_URL` (defaults to `http://localhost:3000`)

## Notes

- The shell currently falls back to guest mode when Clerk env vars are not configured.
- The canonical product and UX docs live in `doc/`.
