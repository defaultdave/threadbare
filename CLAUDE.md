# Threadbare

A todo/task management application for a clothing retail storefront.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 | React framework (App Router) |
| PostgreSQL | Database |
| Prisma 7 | ORM |
| Tailwind CSS 4 | Styling |
| shadcn/ui | Component library |
| NextAuth | Authentication |
| Vitest | Unit testing |
| Zod | Validation |
| pnpm | Package manager |
| Vercel | Deployment |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & layouts
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # shadcn/ui components
│   └── shared/           # Reusable app components
├── lib/
│   ├── utils.ts          # Utility functions (cn helper)
│   └── validators/       # Zod schemas
├── hooks/                # Reusable React hooks
├── test/
│   └── setup.ts          # Vitest setup
└── generated/
    └── prisma/           # Generated Prisma client (gitignored)
prisma/
├── schema.prisma         # Database schema
└── migrations/           # Database migrations
```

## Development Guidelines

Tier: **Small App [S]** — See dev-team `memory/templates/tiers/small-app.md` for full standards.

- `strict: true` in tsconfig. No `any` types.
- Unit tests for business logic (Vitest).
- Test behavior, not implementation.
- Feature-based folder structure.
- Separate pure logic from framework code. Business logic in `lib/`, UI in `components/`.
- Server components by default. Client components only when necessary.
- Zod validation on all API inputs.
- Consistent error shapes: `{ error: string }`.
- Prisma ORM with CUID generation. `Decimal` for money values.
- Feature branches with PRs. Conventional commits.
- ESLint + Prettier configured.
- Semantic HTML elements. Keyboard navigation. ARIA labels where needed.
- Shared utilities in `lib/utils/`. Common components in `components/shared/`. Reusable hooks in `hooks/`.
- Pin major dependency versions. Review deps before adding.
- Lazy loading for non-critical UI.
- Console logging (no sensitive data). Validate env vars at startup.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm prisma migrate dev` | Run database migrations |
| `pnpm prisma studio` | Open Prisma Studio |

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL for NextAuth (http://localhost:3000 in dev) |
| `NEXTAUTH_SECRET` | Secret for NextAuth session encryption |

## Testing

- **Framework:** Vitest with jsdom environment
- **Config:** `vitest.config.ts`
- **Setup:** `src/test/setup.ts` (loads jest-dom matchers)
- **Run:** `pnpm test` (single run) or `pnpm test:watch` (watch mode)
- Write unit tests for all business logic in `lib/`
- Test API routes: happy path, validation error, auth error, not found
- Test components: renders correctly, user interactions, error states
- Use `describe`/`it` blocks with clear specification-style names

## Key Patterns

- **API Routes:** Use Next.js route handlers in `app/api/`. Validate inputs with Zod. Return `{ error: string }` on failure.
- **Database:** Use Prisma client from `@/generated/prisma`. Wrap multi-step ops in transactions.
- **Components:** Server components by default. Add `"use client"` only for hooks/event handlers/browser APIs.
- **Validation:** Define Zod schemas in `lib/validators/`. Share between client and server.
- **Styling:** Use Tailwind CSS classes. Use `cn()` from `lib/utils` for conditional classes.

## Agent Notes

- Working directory: `/Users/davidfleming/Workspace/threadbare`
- Dev-team memory: `/Users/davidfleming/Workspace/dev-team/memory/`
- Project memory: `/Users/davidfleming/Workspace/dev-team/memory/projects/threadbare/`
