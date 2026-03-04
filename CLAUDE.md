# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm run dev          # Start development server with Turbopack
pnpm run build        # Production build
pnpm run lint         # ESLint (must have 0 warnings)
pnpm run typecheck    # TypeScript check
pnpm run format       # Format code with Biome
```

### Database (Prisma with PostgreSQL)

```bash
pnpm run db:generate  # Generate Prisma client
pnpm run db:push      # Push schema to database
pnpm run db:studio    # Open Prisma Studio
```

### Cloudflare Deployment

```bash
pnpm run cf:build     # Build for Cloudflare Pages
pnpm run cf:preview   # Local preview with Wrangler
pnpm run cf:deploy    # Deploy to Cloudflare Pages
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Runtime**: Node.js
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL via Prisma with pg adapter
- **Auth**: Better Auth (supports phone number, email/password, username)
- **API**: Hono (mounted at `/api/*`)
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Deployment**: Cloudflare Pages compatible (next-on-pages)

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated app routes (has sidebar/header layout)
│   ├── (login)/           # Auth pages (sign-in, sign-up, forgot-password)
│   ├── (marketing)/       # Public landing/marketing pages
│   └── api/[...route]/    # Hono API catch-all route
├── components/            # React components
│   └── ui/               # Base UI components (shadcn/ui style)
├── lib/                   # Client-side utilities
│   ├── config/           # Site configuration
│   ├── auth-client.ts    # Better Auth client
│   └── utils.ts          # Shared utilities (cn, getBaseUrl, getPublicUrl)
└── server/               # Server-side code
    ├── index.ts          # Hono app entry - all routes registered here
    ├── lib/              # Server utilities (auth, db, ai, storage, sms)
    ├── modules/          # API route handlers (auth, chat, private, upload)
    └── prisma/           # Prisma schema
```

### Key Patterns

**API Routes**: All backend routes go through Hono. Add new modules in `src/server/modules/` and register them in `src/server/index.ts`.

**URL Helpers**: Use `getBaseUrl()` for internal server calls (avoids SSL issues in Docker), use `getPublicUrl()` for client-facing URLs (CORS, auth callbacks, metadata).

**Database**: Prisma client uses a lazy proxy pattern in `src/server/lib/db.ts` to support edge runtime. Import `prisma` directly.

**Auth**: Server-side auth via `auth.api.getSession({ headers })`. Client-side via `authClient` from `@/lib/auth-client.ts`.

**Environment Variables**: Use `.env` files. Database schema path is `src/server/prisma/schema.prisma`.

### Path Aliases

- `@/*` maps to `./src/*`
