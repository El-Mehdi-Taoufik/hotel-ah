# Re-adding Tauri to hotel-m

`DESKTOP_BUILD.md` in the repo explains that Tauri was intentionally removed
once the backend moved into Next.js itself (Prisma + SQLite, no more
ASP.NET sidecar). This scaffold reverses that: it wraps the existing
Next.js + Prisma app in a Tauri shell the same way the doc's "Electron"
plan describes — spawn the server as a child process, point a native
window at `localhost`, keep the SQLite file in a writable app-data folder.

I could not run `cargo`/`npm`/`tauri build` myself — my sandbox has no
Rust toolchain installed and no network to reach crates.io — so
**none of this has been compiled or tested**. I did a manual line-by-line
audit against the Tauri 2 API and cleaned up what I could catch by
inspection (see "What I fixed on review" below), but I can't guarantee
zero compiler errors without actually running `cargo build`. Treat this
as a solid, carefully-checked starting point rather than a verified
build — paste me the first error you hit and I'll fix it immediately.

### What I fixed on review

- Gated the server-spawning code (`Command`, `Child`, `TcpStream`, the
  `wait_for_port` helper, `ServerHandle`) behind
  `#[cfg(not(debug_assertions))]` in its own module. Previously those
  were imported unconditionally, which would've thrown unused-import /
  dead-code warnings on every `tauri dev` run (since that path only
  spawns a server in release builds).
- Removed `panic = "abort"` from the release profile — it can conflict
  with how some platforms expect Tauri/webview panics to unwind; not
  worth the binary-size savings here.
- Confirmed `Manager::path()`, `app_data_dir()`, `resource_dir()`,
  `manage()`/`try_state()`, and `WindowEvent::Destroyed` all match the
  Tauri 2.x API as documented at the time of writing.

## 1. Drop in the files

Copy this scaffold's contents into your repo root so you get:

```
hotel-m/
  src-tauri/
    Cargo.toml
    build.rs
    tauri.conf.json
    capabilities/default.json
    src/main.rs
    icons/            <- you generate these, see step 4
  scripts/
    prepare-standalone.js
```

## 2. Set Next.js to standalone output

In `next.config.ts`:

```ts
const nextConfig = {
  output: "standalone",
  // ...existing config
};
```

This makes `next build` emit `.next/standalone/server.js`, a
self-contained Node server with only the deps it needs — that's what
gets bundled into the desktop app and spawned at runtime.

## 3. Install the Tauri CLI and Rust toolchain

You'll need Rust (`rustup`) plus the platform webview deps
([Tauri prerequisites](https://tauri.app/start/prerequisites/)), then:

```bash
npm install -D @tauri-apps/cli
```

Add to `package.json`:

```json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "build:tauri": "tauri build"
  }
}
```

(`tauri build` will itself run `beforeBuildCommand` from
`tauri.conf.json`, which runs `next build` and
`scripts/prepare-standalone.js` for you.)

## 4. Generate icons

```bash
npx tauri icon path/to/logo.png
```

This fills `src-tauri/icons/` with the sizes `tauri.conf.json` expects
(`.ico`, `.icns`, PNGs). Point it at the repo's existing `logo.jpeg`
(convert to PNG first if needed).

## 5. Dev mode

```bash
npm run tauri:dev
```

This runs `next dev` on `:3000` (via `beforeDevCommand`) and opens a
native window pointed at it — no server-spawning logic runs in dev,
`main.rs` just connects to the already-running dev server.

## 6. Production build

```bash
npm run build:tauri
```

This runs `next build` → `prepare-standalone.js` (copies
`.next/standalone`, `.next/static`, `public/`, and `prisma/` into
`src-tauri/resources/`) → `cargo build --release` → platform installer
(`.msi`/`.dmg`/`.AppImage`/`.deb` depending on your OS).

At runtime, the packaged app spawns `node server.js` from those bundled
resources, runs `prisma migrate deploy` against a SQLite file in the
OS's per-user app-data directory, waits for port 3579, then opens the
window.

## Known gaps / things to check on your machine

- **Bundled Node dependency.** `main.rs` currently shells out to the
  system's `node` and `npx` — it assumes the end user's machine has
  Node installed. That's a real limitation for distributing to
  non-developers. The proper fix is a Tauri **sidecar**: bundle a
  self-contained Node binary (or compile the server with something like
  `pkg`/`nexe`) and register it in `tauri.conf.json`'s
  `bundle.externalBin`. I didn't wire that up here since it needs
  testing against your actual build output.
- **Fixed port 3579.** Fine for a single-instance desktop app; make it
  dynamic if you ever need multiple windows/instances.
- **`prisma migrate deploy` via `npx`.** Same system-Node assumption as
  above. If you go the sidecar route, invoke migrations through the
  bundled Node binary instead.
- **Windows/macOS/Linux path quoting**, code signing, and
  `NSIS`/`WiX`/notarization are all untouched — out of scope for a first
  working build, but you'll hit them before shipping to end users.
- I have not verified `tauri.conf.json` against the exact Tauri version
  you install — the `$schema` URL and permission strings are correct for
  Tauri 2.x as of my training data, but re-run `npx tauri info` after
  install to confirm the CLI matches the config schema, and adjust if the
  CLI complains about unknown fields.

## First build checklist

Run these in order and expect to stop at each one:

```bash
npx tauri info        # confirms your installed Tauri CLI/Rust versions
                       # match what this scaffold assumes (2.x)
npm run tauri:dev      # dev mode — catches most Rust compile errors fast,
                       # since it doesn't need the standalone bundling step
npm run build:tauri    # full production build
```

If `tauri dev` errors on a missing method or type, it's almost certainly
a Tauri version mismatch (the 2.x API has moved fast) — check
`npx tauri info` against the crate versions in `src-tauri/Cargo.toml` and
paste me the exact error; I'll adjust the code to match your installed
version rather than guessing further blind.

## Optional: update DESKTOP_BUILD.md

Since this reverses the documented decision, worth adding a line noting
Tauri was re-introduced and why, so future contributors aren't confused
by the doc still saying "no longer ships a Tauri/Rust shell."
