// Prevents an extra console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{WebviewUrl, WebviewWindowBuilder};

#[cfg(not(debug_assertions))]
mod server {
    use rand::RngCore;
    use std::fs;
    use std::net::TcpStream;
    use std::path::PathBuf;
    use std::process::{Child, Command, Stdio};
    use std::sync::Mutex;
    use std::thread;
    use std::time::{Duration, Instant};
    use tauri::Manager;

    pub const PORT: u16 = 3579;
    const STARTUP_TIMEOUT: Duration = Duration::from_secs(30);

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

    fn ensure_database(app_data_dir: &PathBuf, resource_dir: &PathBuf) -> Result<PathBuf, String> {
        fs::create_dir_all(app_data_dir).map_err(|e| format!("cannot create app data directory: {e}"))?;

        let db_path = app_data_dir.join("hotel.db");
        if !db_path.exists() {
            let template = resource_dir
                .join("resources")
                .join("prisma")
                .join("production.db");
            fs::copy(&template, &db_path).map_err(|e| {
                format!("cannot initialize SQLite database from {}: {e}", template.display())
            })?;
        }

        Ok(db_path)
    }

    fn ensure_jwt_secret(app_data_dir: &PathBuf) -> Result<String, String> {
        let path = app_data_dir.join("jwt-secret");
        if let Ok(existing) = fs::read_to_string(&path) {
            let value = existing.trim().to_string();
            if value.len() >= 32 {
                return Ok(value);
            }
        }

        let mut bytes = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut bytes);
        let secret = bytes.iter().map(|b| format!("{b:02x}")).collect::<String>();
        fs::write(&path, &secret).map_err(|e| format!("cannot persist JWT secret: {e}"))?;
        Ok(secret)
    }

    pub fn start(handle: &tauri::AppHandle) -> Result<String, String> {
        let app_data_dir = handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("could not resolve app data dir: {e}"))?;
        let resource_dir = handle
            .path()
            .resource_dir()
            .map_err(|e| format!("could not resolve resource dir: {e}"))?;

        let db_path = ensure_database(&app_data_dir, &resource_dir)?;
        let jwt_secret = ensure_jwt_secret(&app_data_dir)?;

        let server_js = resource_dir
            .join("resources")
            .join("standalone")
            .join("server.js");
        let node_exe = resource_dir
            .join("resources")
            .join("node")
            .join(if cfg!(windows) { "node.exe" } else { "node" });

        if !node_exe.exists() {
            return Err(format!("bundled Node runtime not found: {}", node_exe.display()));
        }
        if !server_js.exists() {
            return Err(format!("bundled Next server not found: {}", server_js.display()));
        }

        let database_url = format!("file:{}", db_path.to_string_lossy().replace('\\', "/"));

        // No system Node/npm/npx is used here. Prisma migrations and seed are
        // already represented by the production.db template created during
        // packaging, while subsequent application data stays in AppData.
        let child = Command::new(&node_exe)
            .arg(&server_js)
            .env("NODE_ENV", "production")
            .env("PORT", PORT.to_string())
            .env("HOSTNAME", "127.0.0.1")
            .env("DATABASE_URL", &database_url)
            .env("JWT_SECRET", &jwt_secret)
            .current_dir(
                server_js
                    .parent()
                    .ok_or_else(|| "invalid standalone server path".to_string())?,
            )
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("failed to start bundled Next.js server: {e}"))?;

        handle.manage(ServerHandle(Mutex::new(Some(child))));

        if !wait_for_port(PORT, STARTUP_TIMEOUT) {
            if let Some(state) = handle.try_state::<ServerHandle>() {
                if let Some(mut child) = state.0.lock().map_err(|_| "server state lock poisoned")?.take() {
                    let _ = child.kill();
                    let _ = child.wait();
                }
            }
            return Err(format!(
                "Next.js server did not become ready on 127.0.0.1:{PORT} within {} seconds",
                STARTUP_TIMEOUT.as_secs()
            ));
        }

        Ok(format!("http://127.0.0.1:{PORT}"))
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            #[cfg(debug_assertions)]
            let target_url = "http://localhost:3000".to_string();

            #[cfg(not(debug_assertions))]
            let target_url = server::start(&handle).map_err(|error| {
                eprintln!("Hotel Aguelmam production startup failed: {error}");
                tauri::Error::Anyhow(anyhow::anyhow!(error))
            })?;

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
        .on_window_event(|window, event| {
            #[cfg(not(debug_assertions))]
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(state) = window.try_state::<server::ServerHandle>() {
                    if let Some(mut child) = state.0.lock().unwrap().take() {
                        let _ = child.kill();
                        let _ = child.wait();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
