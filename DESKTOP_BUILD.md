# Hotel Aguelmam desktop build

The desktop application uses **Tauri 2 + Next.js standalone + Prisma + SQLite**.

## Production architecture

```text
Tauri desktop executable
        |
        +--> bundled Node runtime (node.exe)
        |        |
        |        +--> .next/standalone/server.js
        |
        +--> writable AppData
                 |
                 +--> hotel.db
                 +--> jwt-secret

Next.js server: 127.0.0.1:3579
Prisma: DATABASE_URL=file:<AppData>/hotel.db
```

The installed application does **not** require Node.js, npm, npx, or the Prisma CLI to be installed on the user's PC.

## Build

From the repository root on Windows:

```powershell
npm ci
npm run build:tauri
```

`tauri.conf.json` runs:

```text
npm run build
node scripts/prepare-standalone.js
```

The preparation script creates these packaged resources:

- `src-tauri/resources/standalone/server.js`
- `src-tauri/resources/standalone/.next/static/**`
- `src-tauri/resources/standalone/public/**`
- `src-tauri/resources/prisma/**`
- `src-tauri/resources/prisma/production.db`
- `src-tauri/resources/node/node.exe`

`production.db` is created at build time from the committed Prisma migration and seed. On first launch it is copied to the user's writable Tauri AppData directory. Existing databases are never overwritten, so application data persists across restarts and upgrades.

## Development

These commands remain unchanged:

```powershell
npm run dev
npm run tauri:dev
```

Development Tauri continues to load `http://localhost:3000` and does not start the production server.

## Production startup

Release Tauri starts the bundled `node.exe` directly and passes:

```text
NODE_ENV=production
HOSTNAME=127.0.0.1
PORT=3579
DATABASE_URL=file:<AppData>/hotel.db
JWT_SECRET=<persistent random secret>
```

The window is created only after TCP readiness on `127.0.0.1:3579` succeeds. If the server cannot start, Tauri fails during startup instead of opening a WebView that only shows `ERR_CONNECTION_REFUSED`.

## Login

The first-run production database is seeded with:

```text
Email:    admin@hotel.com
Password: Admin@123
```

## Windows installer

The installer is produced under:

```text
src-tauri/target/release/bundle/nsis/
src-tauri/target/release/bundle/msi/
```

A GitHub Actions workflow also builds the Windows installer on the `fix/tauri-production-runtime` branch and verifies that the standalone server, production database template, and bundled Node runtime are present before uploading the installers as artifacts.
