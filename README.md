# Hotel Aguelmam — Hotel Reception Management System

A full-module project skeleton for a premium hotel reception dashboard, built with
**Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**, in the dark purple
glassmorphism style from the brief.

This is a **skeleton**: every module in the spec has a real route, real navigation, and a
polished UI wired to typed mock data — but write actions (creating a reservation, saving
settings, etc.) are stubbed rather than hitting a database. See "Wiring up a real backend"
below for the fastest path to making it fully functional.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — it redirects to `/login`. Any email/password signs you in
(it's a UI demo; there's no real auth check yet).

```bash
npm run build   # production build — verified passing
npm run lint    # ESLint — verified passing
```

## What's implemented

| Module | Route | Notes |
|---|---|---|
| Login | `/login` | Glass card, animated gradient background, show/hide password, validation, mock loading state |
| Dashboard | `/dashboard` | 8 stat cards, revenue area chart, room-status donut chart, upcoming arrivals/departures, quick actions, recent activity feed |
| Reservations | `/reservations` | Searchable/filterable table, status + payment badges, row actions, pagination footer, PDF/Excel export buttons (UI only) |
| New Reservation | `/reservations/new` | Multi-section form (guest, booking, payment) with a live-calculated price summary (nights x rate, tax, discount, deposit) |
| Calendar | `/calendar` | Month grid with reservation chips + a 7-day room timeline strip (visual booking bars) |
| Rooms | `/rooms` | Grid/list toggle, room cards with status + cleaning state, search & status filter |
| Guests | `/guests` | Guest profile cards, VIP badges, stay/spend totals, search |
| Payments | `/payments` | Paid/Pending/Refunded stat cards, filterable transaction table |
| Reports | `/reports` | 6 report-type cards + revenue/occupancy charts |
| Users | `/users` | Staff table with role badges and active/disabled state |
| Settings | `/settings` | Tabbed: hotel info, room types, taxes/currency, appearance, backup/restore |

Shared design system: `glass-card`, `gradient-primary`, `btn-glow`, `card-lift` utility
classes in `src/app/globals.css`, driving every card, button, and hover state consistently.
Icons are from `lucide-react` (swap for `@fluentui/react-icons` if you want to match
"Fluent Icons" literally -- the icon usage is centralized enough to swap in an afternoon).

## Project structure

```
src/
  app/
    layout.tsx              root layout (fonts, metadata)
    page.tsx                redirects to /login
    login/page.tsx
    (app)/                  route group: authenticated shell (sidebar + navbar)
      layout.tsx
      dashboard/page.tsx
      reservations/page.tsx
      reservations/new/page.tsx
      calendar/page.tsx
      rooms/page.tsx
      guests/page.tsx
      payments/page.tsx
      reports/page.tsx
      users/page.tsx
      settings/page.tsx
  components/
    layout/Sidebar.tsx, Navbar.tsx
    ui/Button.tsx, Badge.tsx, StatCard.tsx, Input.tsx, PageHeader.tsx
    dashboard/RevenueChart.tsx, OccupancyChart.tsx, RecentActivity.tsx, QuickActions.tsx
  lib/
    types.ts                shared domain types (Reservation, Guest, Room, Payment, ...)
    mock-data.ts             sample data powering every page
    utils.ts                 cn(), formatCurrency(), formatDate(), initials()
prisma/
  schema.prisma              full DB schema for every entity in the brief (not yet wired)
```

## Wiring up a real backend

The `prisma/schema.prisma` file already models every entity from the brief -- `User`,
`Room`, `RoomType`, `Amenity`, `Guest`, `Reservation`, `ReservationRoom`, `Payment`,
`Invoice`, `Setting`, `AuditLog` -- with SQLite as the datasource (swap the provider for
Postgres/MySQL later with no schema changes beyond the connection string).

1. `npm install prisma @prisma/client`
2. `npx prisma migrate dev --name init`
3. Create `src/lib/db.ts` exporting a `PrismaClient` singleton
4. In each `page.tsx`, replace the `import { reservations } from "@/lib/mock-data"` style
   imports with a server-side fetch (these are all Server Components today except where
   marked `"use client"` for interactivity -- forms, filters, charts).
5. Add real auth (NextAuth.js or a custom session) behind `/login`, and move route
   protection into `(app)/layout.tsx`.

## Deliberately out of scope for this pass

To keep this a genuine "skeleton" rather than a half-finished attempt at everything:
- No drag-and-drop on the calendar (the timeline is a visual mock -- `react-big-calendar`
  or `@fullcalendar/react` are the two most common libraries to add this).
- No real PDF/Excel export (buttons are present; wire to `jspdf` / `exceljs` or a server
  route).
- No auth/session/role-gating yet -- every route is publicly reachable once you have the URL.
- Mobile: layout is responsive down to phone width, but the sidebar collapses without a
  drawer/bottom-nav yet (the hamburger icon in the navbar is a placeholder).

## Design tokens

```
Background   #120D24 -> #1B1033 -> #261046 (radial gradient)
Card         #201733, glass blur + 1px translucent purple border
Primary      #7C3AED -> #9333EA -> #A855F7 (gradient)
Accents      Amber #F59E0B - Green #10B981 - Blue #3B82F6 - Red #EF4444
Type         Plus Jakarta Sans (display/body) + JetBrains Mono (data, prices, IDs)
Radius       16-20px on cards, 12px on inputs/buttons
```
"# hotel-ah" 
