# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages (`(login)`, `dashboard`, `chat`, API routes). UI tokens in `app/globals.css`.
- `src/components`: shared UI/business pieces.  
- `src/server`: Hono handlers in `modules/*`, middleware, storage/AI/auth helpers; Prisma schema in `server/prisma`.  
- `src/lib`: config, typed clients (`api-client.ts`, `auth-client.ts`), utilities. Assets in `public`; scripts in `scripts/`.

## Build, Test, and Development Commands
- `bun install` then `bun run db:generate` / `bun run db:push` to sync Prisma.  
- `bun dev` (Turbopack), `bun run build` + `bun start` for production bundle.  
- Quality gates: `bun run lint`, `bun run typecheck`, `bun run format:check`; `bun run format` fixes. Pre-commit uses `scripts/pre-commit.sh`.  
- Docker/Compose helpers via `Makefile` (`make dev/build/up/down/logs`); Cloudflare Pages via `bun run cf:build|cf:preview|cf:deploy`.

## Coding Style & Naming Conventions
- TypeScript + React, 2-space indent, double quotes, named exports for shared modules.  
- Components/hooks use `PascalCase`/`camelCase`; route files match paths (`app/api/chat/route.ts`). Env keys stay `UPPER_SNAKE_CASE`.  
- Keep server-only code inside `src/server`; prefer typed clients rather than raw fetch.

## Testing Guidelines
- No dedicated suite yet; run `lint`, `typecheck`, `build` before PRs.  
- Add new tests near features (e.g., `src/app/foo/__tests__`) using descriptive filenames like `feature-behavior.test.ts`.  
- Integration checks for new Hono routes and smoke flows for login/chat/dashboard are expected when adding features.

## Commit & Pull Request Guidelines
- History uses short imperative subjects (EN/ZH). Prefer `<scope>: <verb>` when scope helps.  
- Keep commits focused; include Prisma/client regen when schemas change.  
- PRs: explain intent, key changes, validation steps (`lint/typecheck/build`), link issues, and attach UI screenshots/GIFs when applicable.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`; never commit secrets. Required keys: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, AI/SMS creds, S3 params.  
- Local storage defaults to `storage/`; configure S3 creds to use object storage. Use `.env.production` for deploys.  
- After env changes, verify `/api/health` and login flow.
