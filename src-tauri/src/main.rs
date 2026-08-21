// Prevents an extra console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{WebviewUrl, WebviewWindowBuilder};

// Everything below is only needed for the production path (spawning the
// bundled Next.js server ourselves). In `tauri dev`, `beforeDevCommand`
// already has a dev server running on :3000, so none of this compiles in
// for debug builds — keeps dev builds warning-free.
#[cfg(not(debug_assertions))]
mod server {
    use std::net::TcpStream;
    use std::process::{Child, Command, Stdio};
    use std::sync::Mutex;
    use std::thread;
    use std::time::{Duration, Instant};
    use tauri::Manager;

    /// Fixed port for the embedded Next.js server. Change if it collides
    /// with something else on the user's machine, or make this dynamic.
    pub const PORT: u16 = 3579;

    /// Holds the child server process so we can kill it when the app exits.
    pub struct ServerHandle(pub Mutex<Option<Child>>);

    fn wait_for_port(port: u16, timeout: Duration) -> bool {
        let deadline = Instant::now() + timeout;
        while Instant::now() < deadline {
            if TcpStream::connect(("127.0.0.1", port)).is_ok() {
                return true;
            }
            thread::sleep(Duration::from_millis(250));
        }
        false
    }

    /// Spawns the bundled standalone Next.js server pointed at a writable
    /// per-user data dir (SQLite must not live inside the read-only app
    /// bundle), runs pending migrations, and returns once the port is up.
    pub fn start(handle: &tauri::AppHandle) -> String {
        let app_data_dir = handle
            .path()
            .app_data_dir()
            .expect("could not resolve app data dir");
        std::fs::create_dir_all(&app_data_dir).expect("could not create app data dir");

        let db_path = app_data_dir.join("hotel.db");
        let database_url = format!("file:{}", db_path.to_string_lossy());

        let resource_dir = handle
            .path()
            .resource_dir()
            .expect("could not resolve resource dir");
        let server_js = resource_dir
            .join("resources")
            .join("standalone")
            .join("server.js");
        let prisma_dir = resource_dir.join("resources").join("prisma");

        // Requires `npx` / system Node to be reachable — see
        // SETUP_TAURI.md for the sidecar alternative if you don't want to
        // depend on the end user having Node installed.
        let migrate = Command::new("npx")
            .args(["prisma", "migrate", "deploy"])
            .current_dir(&prisma_dir)
            .env("DATABASE_URL", &database_url)
            .status();
        if let Err(e) = migrate {
            eprintln!("prisma migrate deploy failed to run: {e}");
        }

        // Seed a default account if this is a brand-new database. Only
        // needed the FIRST time the app runs on a given machine — once
        // hotel.db exists with data, this becomes a harmless no-op
        // (or remove the seed's upsert-guard once you have real users).
        let seed = Command::new("npx")
            .args(["prisma", "db", "seed"])
            .current_dir(&prisma_dir)
            .env("DATABASE_URL", &database_url)
            .status();
        if let Err(e) = seed {
            eprintln!("prisma db seed failed to run: {e}");
        }

        let child = Command::new("node")
            .arg(&server_js)
            .env("PORT", PORT.to_string())
            .env("HOSTNAME", "127.0.0.1")
            .env("DATABASE_URL", &database_url)
            // TEMP DEBUG: inherit stdio so the Next.js server's own
            // console.log/error output shows up in your terminal. Switch
            // back to Stdio::null() once login works — a real desktop
            // app shouldn't need a visible console.
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .spawn()
            .expect("failed to start embedded Next.js server");

        handle.manage(ServerHandle(Mutex::new(Some(child))));

        if !wait_for_port(PORT, Duration::from_secs(20)) {
            eprintln!("server did not come up on :{PORT} in time");
        }

        format!("http://127.0.0.1:{PORT}")
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            #[cfg(debug_assertions)]
            let target_url = "http://localhost:3000".to_string();

            #[cfg(not(debug_assertions))]
            let target_url = server::start(&handle);

            WebviewWindowBuilder::new(
                &handle,
                "main",
                WebviewUrl::External(target_url.parse().expect("invalid target URL")),
            )
            .title("Hotel Aguelmam")
            .inner_size(1400.0, 900.0)
            .min_inner_size(1024.0, 700.0)
            .build()?;

            Ok(())
        })
        .on_window_event(|_window, _event| {
            // Kill the embedded server when the window closes so it
            // doesn't linger as an orphan process. No-op in dev builds,
            // where nothing was ever spawned/managed.
            #[cfg(not(debug_assertions))]
            {
                use tauri::Manager;
                if let tauri::WindowEvent::Destroyed = _event {
                    if let Some(state) = _window.try_state::<server::ServerHandle>() {
                        if let Some(mut child) = state.0.lock().unwrap().take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
