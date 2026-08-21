# Desktop packaging

## Architecture decision

This project no longer ships a separate ASP.NET Core backend or a Tauri/Rust shell. The backend is
Prisma + SQLite running inside Next.js itself (see `BACKEND_INTEGRATION.md`), so there is nothing
external to bundle, start, or stop — a single Next.js server process serves both the UI and the
API, and reads/writes the SQLite file directly.

That removes the entire reason Tauri + a sidecar ASP.NET process existed in the first place (they
were there to spawn and manage the .NET backend alongside the frontend). Concretely, this repo no
longer has:

- `backend/` (the ASP.NET Core Clean-Architecture project)
- `@tauri-apps/api`, `@tauri-apps/cli`, `scripts/publish-backend.js`
- The `dev:all`, `build:backend`, `build:tauri`, `tauri`, `tauri:dev` npm scripts

## Running it

There is no desktop-specific build required to use the app — `npm run dev` / `npm run build && npm
run start` is a complete, self-contained server (UI + API + database).

## Optional: wrapping it as a desktop app with Electron

An `electron/` folder and the `electron` / `electron-builder` dev dependencies are still present
in `package.json` for teams that want a native window around the app later. That work has not been
done yet (`electron/main.js` is currently empty) — implementing it would mean:

1. Run `next build` to produce a production build.
2. Start the Next.js server (`next start`, or the standalone output) as a child process from
   Electron's main process, pointing `DATABASE_URL` at a writable path inside the user's app-data
   directory (SQLite files must live somewhere writable, not inside the packaged app bundle).
3. Load `http://localhost:<port>` in a `BrowserWindow` once the server is ready.
4. Package with `electron-builder`, including the compiled `.next` output and `prisma/` (schema +
   migrations, so `prisma migrate deploy` can run against the user's local `dev.db` on first
   launch).

This is meaningfully simpler than the previous Tauri + ASP.NET setup because there is only one
process to manage instead of two, and no cross-process port negotiation.
