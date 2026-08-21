# Backend Integration

## Architecture decision

This project has one backend: **Next.js Route Handlers** under `src/app/api/**`, talking directly
to a **SQLite** database through **Prisma**. There is no separate process to run, no CORS to
configure, and no proxy/rewrite layer — the frontend and backend are deployed together as a single
Next.js app.

This replaces an earlier, now-removed approach that ran a separate ASP.NET Core Web API (`backend/`)
alongside the Next.js frontend, connected through `next.config.ts` rewrites. That setup required a
.NET SDK, a second running process, and a rewrite proxy purely to work around CORS — all of which
disappear once the API lives inside the same Next.js server. See `DESKTOP_BUILD.md` for how this
affects desktop packaging.

## Stack

- **Database**: SQLite (`prisma/dev.db`), defined by `prisma/schema.prisma`
- **ORM**: Prisma 5 (`src/lib/db.ts` exports a singleton `PrismaClient`)
- **Auth**: JWT (`jose`) stored in an `httpOnly` cookie named `session`, verified on every request
  by `proxy.ts` (project root) and by each Route Handler via `src/lib/api-auth.ts`
- **Password hashing**: `bcryptjs`

## Project structure

```
hotel-management-system/
├── prisma/
│   ├── schema.prisma        # Data model
│   ├── migrations/          # Applied migrations
│   └── seed.ts              # Creates the admin user + sample rooms/settings
├── src/
│   ├── app/
│   │   ├── api/             # Route Handlers (the backend)
│   │   ├── (app)/            # Protected pages (dashboard, rooms, guests, ...)
│   │   └── login/
│   ├── lib/
│   │   ├── db.ts            # PrismaClient singleton
│   │   ├── auth.ts          # JWT signing/verification, password hashing, cookie helpers
│   │   ├── api-auth.ts       # requireSession() helper used by Route Handlers
│   │   ├── settings.ts       # Typed get/set helpers over the Setting key/value table
│   │   ├── serializers.ts     # Prisma model -> frontend DTO shape
│   │   └── ids.ts            # Reservation/payment number generators
│   └── services/             # Client-side fetch wrappers (unchanged — they already called `/api/*`)
└── proxy.ts                  # Route protection (Next.js 16 "Proxy", formerly "Middleware")
```

## Setup

```bash
npm install
cp .env.example .env      # set DATABASE_URL and a real JWT_SECRET
npx prisma migrate dev    # creates prisma/dev.db and applies migrations
npm run prisma:seed       # creates the admin user + sample rooms/settings
npm run dev
```

Default admin login after seeding: `admin@hotel.com` / `Admin@123`.

## API surface

All endpoints live under `/api` and require an authenticated session (via the `session` cookie),
except `POST /api/auth/login`. Each module the frontend uses has a matching set of handlers:

- `auth`: login, logout, me, change-password
- `users`: CRUD, profile, preferences
- `guests`: CRUD, search
- `room-types`: CRUD
- `rooms`: CRUD, status update, availability search
- `reservations`: CRUD, pagination, search, by-guest, by-status, status update
- `payments`: CRUD, pending balances, receive payment, refund
- `settings`: hotel / reservations / payments / system settings (stored as JSON blobs in the
  `Setting` table), export/import/backup
- `dashboard`: stats, revenue, occupancy, recent activity
- `notifications`: list, unread, mark read, delete

Known gap: identity-document upload (`src/services/identityDocument.service.ts`) and the PDF
"current guests" report (`reports/page.tsx`) still point at endpoints that don't exist in this
Prisma backend — they were out of scope for this migration and are not wired to any Prisma model.

## Database schema

See `prisma/schema.prisma`. Entities: `User`, `RoomType`, `Room`, `Guest`, `Reservation`,
`ReservationRoom` (join table for rooms per reservation), `Payment`, `Setting`, `Notification`.
IDs are auto-incrementing integers to match the numeric IDs the existing frontend service layer
already expects (`CreateRoomRequest.roomTypeId: number`, etc.).

## Making schema changes

```bash
# after editing prisma/schema.prisma
npx prisma migrate dev --name <description>
```
