use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, Runtime};

// ── Shared state ─────────────────────────────────────────────
struct AppState {
    active_processes: HashMap<String, u32>,
    active_urls: HashSet<String>,
}

type State = Arc<Mutex<AppState>>;

// ── Types ─────────────────────────────────────────────────────
#[derive(Serialize, Deserialize, Clone)]
struct YtOutputPayload {
    id: String,
    text: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct DownloadFinishedPayload {
    id: String,
    success: bool,
    #[serde(rename = "exitCode")]
    exit_code: Option<i32>,
    #[serde(rename = "outPath")]
    out_path: String,
}

#[derive(Deserialize)]
struct StartDownloadArgs {
    url: String,
    #[serde(rename = "formatTag")]
    format_tag: String,
    #[serde(rename = "outputFilename")]
    output_filename: String,
    #[serde(rename = "savePath")]
    save_path: Option<String>,
}

// ── Helpers ───────────────────────────────────────────────────
fn get_bin_path<R: Runtime>(_app: &AppHandle<R>, name: &str) -> PathBuf {
    if cfg!(debug_assertions) {
        let mut p = std::env::current_dir().unwrap_or_default();
        p.push("bin");
        p.push(format!("{}.exe", name));
        p
    } else {
        // Look in bin/ subfolder beside the exe for portable layout
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|e| e.parent().map(|p| p.to_path_buf()))
            .unwrap_or_default();
        exe_dir.join("bin").join(format!("{}.exe", name))
    }
}

fn unique_id() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

fn clean_part_files(out_path: &str) {
    let path = std::path::Path::new(out_path);
    let dir = match path.parent() { Some(d) => d, None => return };
    let base = match path.file_name().and_then(|n| n.to_str()) { Some(n) => n, None => return };
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let name = entry.file_name();
            let name = name.to_string_lossy();
            if name.starts_with(base) && name.ends_with(".part") {
                let _ = std::fs::remove_file(entry.path());
            }
        }
    }
}

// ── Commands ──────────────────────────────────────────────────

#[tauri::command]
fn get_app_version(app: AppHandle) -> String {
    app.config().version.clone().unwrap_or_else(|| "0.0.0".to_string())
}

#[tauri::command]
async fn fetch_metadata(app: AppHandle, url: String) -> Result<serde_json::Value, String> {
    let ytdlp = get_bin_path(&app, "yt-dlp");

    let mut cmd = tokio::process::Command::new(&ytdlp);
    cmd.args(["-j", "--no-playlist", &url])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);

    let output = cmd.output().await
        .map_err(|e| format!("Failed to spawn yt-dlp: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let first_line = stdout.lines().find(|l| !l.trim().is_empty()).unwrap_or("");
        serde_json::from_str(first_line)
            .map_err(|e| format!("Parse error: {}", e))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(stderr)
    }
}

#[tauri::command]
async fn start_download<R: Runtime>(
    app: AppHandle<R>,
    state: tauri::State<'_, State>,
    args: StartDownloadArgs,
) -> Result<serde_json::Value, String> {
    {
        let mut s = state.lock().unwrap();
        if s.active_urls.contains(&args.url) {
            return Ok(serde_json::json!({ "success": false, "error": "already-downloading" }));
        }
        s.active_urls.insert(args.url.clone());
    }

    let download_id = unique_id();
    let ytdlp  = get_bin_path(&app, "yt-dlp");
    let ffmpeg = get_bin_path(&app, "ffmpeg");

    let base_dir = args.save_path.clone().unwrap_or_else(|| {
        app.path().download_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| ".".to_string())
    });

    let out_path = format!("{}/{}", base_dir.trim_end_matches('/').trim_end_matches('\\'), args.output_filename);

    let format_args: Vec<String> = if args.format_tag == "audio" {
        vec![
            "-f".into(), "bestaudio".into(),
            "--extract-audio".into(),
            "--audio-format".into(), "mp3".into(),
        ]
    } else {
        vec![
            "-f".into(),
            format!("bestvideo[height<={}]+bestaudio[ext=m4a]/bestvideo[height<={}]+bestaudio/best",
                args.format_tag, args.format_tag),
            "--merge-output-format".into(), "mp4".into(),
        ]
    };

    let ytdlp_out = if args.format_tag == "audio" {
        out_path.trim_end_matches(".mp3").to_string()
    } else {
        out_path.clone()
    };

    let mut cmd_args: Vec<String> = format_args;
    cmd_args.extend([
        "--ffmpeg-location".into(), ffmpeg.to_string_lossy().to_string(),
        "--newline".into(),
        "--no-playlist".into(),
        "-o".into(), ytdlp_out.clone(),
        args.url.clone(),
    ]);

    let mut spawn_cmd = tokio::process::Command::new(&ytdlp);
    spawn_cmd.args(&cmd_args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(target_os = "windows")]
    spawn_cmd.creation_flags(0x08000000);

    let mut child = match spawn_cmd.spawn() {
        Ok(c) => c,
        Err(e) => {
            state.lock().unwrap().active_urls.remove(&args.url);
            return Ok(serde_json::json!({ "success": false, "error": e.to_string() }));
        }
    };

    let pid = child.id().unwrap_or(0);
    {
        let mut s = state.lock().unwrap();
        s.active_processes.insert(download_id.clone(), pid);
    }

    let app_clone   = app.clone();
    let id_clone    = download_id.clone();
    let out_clone   = out_path.clone();
    let url_clone   = args.url.clone();
    let state_clone = state.inner().clone();

    tokio::spawn(async move {
        use tokio::io::{AsyncBufReadExt, BufReader};

        if let Some(stdout) = child.stdout.take() {
            let mut lines = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_clone.emit("yt-output", YtOutputPayload {
                    id: id_clone.clone(),
                    text: line,
                });
            }
        }
        if let Some(stderr) = child.stderr.take() {
            let mut lines = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_clone.emit("yt-output", YtOutputPayload {
                    id: id_clone.clone(),
                    text: format!("ERROR: {}", line),
                });
            }
        }

        let status = child.wait().await;
        let exit_code = status.ok().and_then(|s| s.code());
        let success = exit_code == Some(0);

        if !success { clean_part_files(&out_clone); }

        {
            let mut s = state_clone.lock().unwrap();
            s.active_processes.remove(&id_clone);
            s.active_urls.remove(&url_clone);
        }

        let _ = app_clone.emit("download-finished", DownloadFinishedPayload {
            id: id_clone,
            success,
            exit_code,
            out_path: out_clone,
        });
    });

    Ok(serde_json::json!({ "success": true, "id": download_id }))
}

#[tauri::command]
async fn cancel_download(state: tauri::State<'_, State>, id: String) -> Result<bool, String> {
    let pid = {
        let s = state.lock().unwrap();
        s.active_processes.get(&id).copied()
    };
    if let Some(pid) = pid {
        #[cfg(target_os = "windows")]
        {
            let mut kill_cmd = std::process::Command::new("taskkill");
            kill_cmd.args(["/PID", &pid.to_string(), "/T", "/F"]);
            #[cfg(target_os = "windows")]
            kill_cmd.creation_flags(0x08000000);
            let _ = kill_cmd.spawn();
        }
        #[cfg(not(target_os = "windows"))]
        {
            unsafe { libc::kill(pid as i32, libc::SIGKILL); }
        }

        state.lock().unwrap().active_processes.remove(&id);
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
async fn open_folder(app: AppHandle, path: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app.opener()
        .reveal_item_in_dir(&path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn open_file(app: AppHandle, path: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app.opener()
        .open_path(&path, None::<&str>)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn select_folder(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let folder = app.dialog().file().blocking_pick_folder();
    Ok(folder.map(|p| p.to_string()))
}

#[tauri::command]
async fn delete_file(path: String) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    if p.exists() {
        std::fs::remove_file(p).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

#[tauri::command]
async fn read_clipboard(app: AppHandle) -> Result<String, String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    app.clipboard().read_text().map_err(|e| e.to_string())
}

// ── Entry point ───────────────────────────────────────────────
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state: State = Arc::new(Mutex::new(AppState {
        active_processes: HashMap::new(),
        active_urls: HashSet::new(),
    }));

    tauri::Builder::default()
        .manage(state)
        .setup(|app| {
            let win = app.get_webview_window("main").unwrap();
            win.set_resizable(false)?;
            win.set_maximizable(false)?;
            // Set window icon from the bundled icon file
            if let Ok(icon) = app.default_window_icon().cloned().ok_or(()) {
                let _ = win.set_icon(icon);
            }
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build())
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            fetch_metadata,
            start_download,
            cancel_download,
            open_folder,
            open_file,
            select_folder,
            read_clipboard,
            delete_file,
        ])
        .run(tauri::generate_context!())
        .expect("error running app");
}
