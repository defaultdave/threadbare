# Threadbare

A todo/task management application for a clothing retail storefront.

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

## Getting Started

```bash
pnpm install
cp .env.example .env  # Fill in your database credentials
pnpm prisma migrate dev
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Prisma connection string |
| `DIRECT_DATABASE_URL` | Direct PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 in dev) |
| `NEXTAUTH_SECRET` | Secret for session encryption |

## Database Schema

### Models

**Task** — Core unit of work in the store.

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| id | String (CUID) | auto | Primary key |
| title | String | — | Required |
| description | String? | null | Optional details |
| status | Status | `todo` | Current state |
| priority | Priority | `medium` | Urgency level |
| dueDate | DateTime? | null | Optional deadline |
| categoryId | String | — | FK to Category |
| createdAt | DateTime | now | Auto-set |
| updatedAt | DateTime | auto | Auto-updated |

**Category** — Groups tasks by store function.

| Field | Type | Notes |
|-------|------|-------|
| id | String (CUID) | Primary key |
| name | String | Unique |
| color | String | Hex color code |
| icon | String | Lucide icon name |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-updated |

### Enums

- **Status**: `todo`, `in_progress`, `done`
- **Priority**: `low`, `medium`, `high`, `urgent`

### Seed Data (Categories)

| Name | Color | Icon |
|------|-------|------|
| Inventory | #3b82f6 | package |
| Restocking | #10b981 | refresh-cw |
| Display | #f59e0b | layout |
| Seasonal | #8b5cf6 | calendar |
| Operations | #ef4444 | settings |
| Customer Service | #ec4899 | users |

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm prisma migrate dev` | Run database migrations |
| `pnpm prisma db seed` | Seed the database |
| `pnpm prisma studio` | Open Prisma Studio |
