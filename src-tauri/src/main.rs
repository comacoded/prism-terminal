#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::io::{Read, Write};
use std::process::Command;
use std::sync::{Arc, Mutex, OnceLock};
use std::thread;
use std::time::Duration;

use base64::Engine;
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use tauri::{Emitter, Manager};

#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};

/// Foreground processes that count as an "agent" (drive the glow), mirrored
/// from the Electron main process.
const AGENTS: [&str; 3] = ["claude", "codex", "bob"];

struct Session {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
    pid: u32,
    proc: String,
    agent_active: bool,
    watcher: Option<notify::RecommendedWatcher>,
    watch_dir: Option<String>,
    artifacts: HashMap<String, (String, u64)>, // abs path -> (tool, time_ms)
    artifacts_dirty: bool,
}

#[derive(Default)]
struct AppState {
    sessions: Mutex<HashMap<u32, Session>>,
    next_id: Mutex<u32>,
    active: Mutex<Option<u32>>,
    api_pending: Mutex<HashMap<u64, std::sync::mpsc::Sender<String>>>,
    api_counter: Mutex<u64>,
}

#[derive(Clone, Serialize)]
struct DataPayload {
    id: u32,
    data: String,
}
#[derive(Clone, Serialize)]
struct IdPayload {
    id: u32,
}
#[derive(Clone, Serialize)]
struct ProcPayload {
    id: u32,
    proc: String,
    active: bool,
}
#[derive(Clone, Serialize)]
struct FooterPayload {
    id: u32,
    cwd: String,
    branch: String,
}
#[derive(Clone, Serialize)]
struct ArtifactRecord {
    path: String,
    tool: String,
    time: u64,
}
#[derive(Clone, Serialize)]
struct ArtifactsPayload {
    id: u32,
    list: Vec<ArtifactRecord>,
}
#[derive(Clone, Serialize)]
struct ApiRequest {
    id: u64,
    req: String,
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Directories/files we never treat as artifacts (mirrors the Electron regex).
fn ignored(path: &str) -> bool {
    const SKIP: [&str; 15] = [
        "node_modules", ".git", ".next", ".cache", ".turbo", "dist", "build", "out",
        "coverage", ".venv", "venv", "__pycache__", ".DS_Store", ".idea", ".vscode",
    ];
    path.split('/').any(|seg| SKIP.contains(&seg))
}

fn home() -> String {
    std::env::var("HOME").unwrap_or_else(|_| "/".into())
}

/// Shell integration scripts. zsh loads automatically via ZDOTDIR stubs; bash
/// loads via --init-file. Both hook files are standalone and idempotent, so a
/// nested or oddly-launched shell can always load them by hand:
///   zsh:  source "$PRISM_INTEGRATION_DIR/prism.zsh"
///   bash: source "$PRISM_INTEGRATION_DIR/prism.bash"
/// The hooks emit OSC 133 semantic prompt marks (prompt start, command start,
/// command end + exit code), OSC 7 cwd reports, and OSC 633;E command text.
const PRISM_ZSH: &str = r#"# PRISM shell integration for zsh (auto-generated).
# Safe to source manually in any zsh:  source "$PRISM_INTEGRATION_DIR/prism.zsh"
[[ -o interactive ]] || return 0
[[ -n "$PRISM_SOCKET" ]] || return 0
[[ -n "$__PRISM_ZSH_HOOKED" ]] && return 0
typeset -g __PRISM_ZSH_HOOKED=1

__prism_preexec() {
  printf '\033]133;C\007'
  # command text for the palette's history (newlines flattened)
  local _c="${1//$'\n'/ }"
  printf '\033]633;E;%s\007' "$_c"
}
__prism_precmd()  { printf '\033]133;D;%s\007\033]133;A\007' "$?"; }
# OSC 7: report the cwd as a percent-encoded file:// URL on every directory change.
__prism_osc7() {
  local url="file://$HOST" c
  for c in ${(s::)PWD}; do
    case "$c" in
      [A-Za-z0-9/._~-]) url+="$c" ;;
      *) url+="$(printf '%%%02X' "'$c")" ;;
    esac
  done
  printf '\033]7;%s\033\\' "$url"
}
autoload -Uz add-zsh-hook
add-zsh-hook preexec __prism_preexec
add-zsh-hook precmd  __prism_precmd
add-zsh-hook chpwd   __prism_osc7
__prism_osc7
# Pasted text renders as plain text (zsh's default standout/reverse highlight
# can be unreadable on a translucent background). Respect a user override.
(( ${+zle_highlight} )) || zle_highlight=(region:standout special:standout suffix:bold isearch:underline paste:none)

# `prism` CLI: drive PRISM over its socket API from any pane (agents included).
prism() {
  if [[ -z "$PRISM_SOCKET" ]]; then echo "prism: not inside PRISM" >&2; return 1; fi
  local sub="$1"; (( $# > 0 )) && shift
  local json
  case "$sub" in
    list)     json='{"cmd":"list"}' ;;
    new-tab)  json="{\"cmd\":\"new-tab\",\"cwd\":\"${1:-$PWD}\"}" ;;
    split)    json="{\"cmd\":\"split\",\"dir\":\"${1:-row}\"}" ;;
    read)     json="{\"cmd\":\"read\",\"id\":${1:?pane id},\"lines\":${2:-50}}" ;;
    activate) json="{\"cmd\":\"activate\",\"id\":${1:?pane id}}" ;;
    send)     local _pid="${1:?pane id}"; shift
              json="{\"cmd\":\"send\",\"id\":${_pid},\"data\":$(printf '%s' "$*" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()+"\n"))')}" ;;
    notify)   json="{\"cmd\":\"notify\",\"title\":\"PRISM\",\"body\":$(printf '%s' "$*" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}" ;;
    ''|help)  echo "usage: prism list|new-tab [dir]|split [row|column]|read <pane> [lines]|send <pane> <text>|activate <pane>|notify <text>|'<raw json>'" >&2; return 1 ;;
    *)        json="$sub" ;;
  esac
  printf '%s\n' "$json" | nc -U "$PRISM_SOCKET"
}
"#;

/// bash integration: precmd via a prepended PROMPT_COMMAND (so $? is intact),
/// preexec via PS0 (bash 4.4+; on 3.2 the C/E marks degrade gracefully —
/// prompt marks and cwd reports still work).
const PRISM_BASH: &str = r#"# PRISM shell integration for bash (auto-generated).
# Safe to source manually in any bash:  source "$PRISM_INTEGRATION_DIR/prism.bash"
case "$-" in *i*) ;; *) return 0 ;; esac
[ -n "$PRISM_SOCKET" ] || return 0
[ -n "$__PRISM_BASH_HOOKED" ] && return 0
__PRISM_BASH_HOOKED=1

__prism_osc7() {
  local url="file://$HOSTNAME" out="" c i
  for (( i = 0; i < ${#PWD}; i++ )); do
    c="${PWD:$i:1}"
    case "$c" in
      [A-Za-z0-9/._~-]) out+="$c" ;;
      *) printf -v c '%%%02X' "'$c"; out+="$c" ;;
    esac
  done
  printf '\033]7;%s%s\033\\' "$url" "$out"
}
# D is emitted unconditionally: the frontend pairs it with the last C mark
# and ignores an unpaired D (e.g. the first prompt, or an empty enter).
__prism_precmd() {
  local ec=$?
  printf '\033]133;D;%s\007\033]133;A\007' "$ec"
  __prism_osc7
}
# PS0 expands after a command is read, before it runs: the natural preexec.
# It runs in a subshell, so it must not rely on setting parent-shell state.
__prism_preexec() {
  printf '\033]133;C\007'
  local c
  c="$(HISTTIMEFORMAT='' builtin history 1 2>/dev/null | sed 's/^ *[0-9]* *//')"
  printf '\033]633;E;%s\007' "${c//$'\n'/ }"
}
if [ "${BASH_VERSINFO[0]:-0}" -gt 4 ] || { [ "${BASH_VERSINFO[0]:-0}" -eq 4 ] && [ "${BASH_VERSINFO[1]:-0}" -ge 4 ]; }; then
  PS0='$(__prism_preexec)'"$PS0"
fi
if [[ "$(declare -p PROMPT_COMMAND 2>/dev/null)" == "declare -a"* ]]; then
  PROMPT_COMMAND=(__prism_precmd "${PROMPT_COMMAND[@]}")
else
  PROMPT_COMMAND="__prism_precmd${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
fi

# `prism` CLI: drive PRISM over its socket API from any pane (agents included).
prism() {
  if [ -z "$PRISM_SOCKET" ]; then echo "prism: not inside PRISM" >&2; return 1; fi
  local sub="$1"; [ $# -gt 0 ] && shift
  local json
  case "$sub" in
    list)     json='{"cmd":"list"}' ;;
    new-tab)  json="{\"cmd\":\"new-tab\",\"cwd\":\"${1:-$PWD}\"}" ;;
    split)    json="{\"cmd\":\"split\",\"dir\":\"${1:-row}\"}" ;;
    read)     json="{\"cmd\":\"read\",\"id\":${1:?pane id},\"lines\":${2:-50}}" ;;
    activate) json="{\"cmd\":\"activate\",\"id\":${1:?pane id}}" ;;
    send)     local _pid="${1:?pane id}"; shift
              json="{\"cmd\":\"send\",\"id\":${_pid},\"data\":$(printf '%s' "$*" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()+"\n"))')}" ;;
    notify)   json="{\"cmd\":\"notify\",\"title\":\"PRISM\",\"body\":$(printf '%s' "$*" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}" ;;
    ''|help)  echo "usage: prism list|new-tab [dir]|split [row|column]|read <pane> [lines]|send <pane> <text>|activate <pane>|notify <text>|'<raw json>'" >&2; return 1 ;;
    *)        json="$sub" ;;
  esac
  printf '%s\n' "$json" | nc -U "$PRISM_SOCKET"
}
"#;

/// Passed to bash as --init-file: emulate a login shell (profiles), then hook.
const BASH_INIT: &str = r#"# PRISM bash bootstrap (auto-generated).
if [ -f /etc/profile ]; then . /etc/profile; fi
for __prism_f in "$HOME/.bash_profile" "$HOME/.bash_login" "$HOME/.profile"; do
  if [ -f "$__prism_f" ]; then . "$__prism_f"; break; fi
done
unset __prism_f
if [ -n "$PRISM_INTEGRATION_DIR" ] && [ -f "$PRISM_INTEGRATION_DIR/prism.bash" ]; then
  . "$PRISM_INTEGRATION_DIR/prism.bash"
fi
"#;

/// zsh startup stubs, injected via ZDOTDIR: each one sources the user's own
/// config, then .zshrc loads prism.zsh. ZDOTDIR is exported for every PTY
/// (bash ignores it), so a zsh nested under bash still auto-loads integration.
const ZSHENV: &str = r#"# PRISM shell integration bootstrap (auto-generated).
PRISM_ZDOTDIR="$ZDOTDIR"
if [[ -f "${PRISM_USER_ZDOTDIR:-$HOME}/.zshenv" ]]; then
  ZDOTDIR="${PRISM_USER_ZDOTDIR:-$HOME}"
  . "${PRISM_USER_ZDOTDIR:-$HOME}/.zshenv"
  ZDOTDIR="$PRISM_ZDOTDIR"
fi
"#;
const ZPROFILE: &str = r#"if [[ -f "${PRISM_USER_ZDOTDIR:-$HOME}/.zprofile" ]]; then
  ZDOTDIR="${PRISM_USER_ZDOTDIR:-$HOME}"
  . "${PRISM_USER_ZDOTDIR:-$HOME}/.zprofile"
  ZDOTDIR="$PRISM_ZDOTDIR"
fi
"#;
const ZSHRC: &str = r#"# PRISM: source the user's zshrc, then load PRISM shell integration.
if [[ -f "${PRISM_USER_ZDOTDIR:-$HOME}/.zshrc" ]]; then
  ZDOTDIR="${PRISM_USER_ZDOTDIR:-$HOME}"
  . "${PRISM_USER_ZDOTDIR:-$HOME}/.zshrc"
fi
if [[ "${PRISM_USER_ZDOTDIR:-$HOME}" == "$HOME" ]]; then unset ZDOTDIR; else ZDOTDIR="$PRISM_USER_ZDOTDIR"; fi
if [[ -n "$PRISM_INTEGRATION_DIR" && -f "$PRISM_INTEGRATION_DIR/prism.zsh" ]]; then
  . "$PRISM_INTEGRATION_DIR/prism.zsh"
elif [[ -n "$PRISM_ZDOTDIR" && -f "${PRISM_ZDOTDIR:h}/prism.zsh" ]]; then
  . "${PRISM_ZDOTDIR:h}/prism.zsh"
fi
"#;
const ZLOGIN: &str = r#"if [[ -f "${PRISM_USER_ZDOTDIR:-$HOME}/.zlogin" ]]; then
  . "${PRISM_USER_ZDOTDIR:-$HOME}/.zlogin"
fi
"#;

fn app_data_dir(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    let dir = app.path().app_data_dir().ok()?;
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir)
}
fn api_socket_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    Some(app_data_dir(app)?.join("prism.sock"))
}

/// Full session snapshot (tabs, panes, serialized scrollback) lives on disk;
/// it can reach megabytes, which is too big for localStorage.
#[tauri::command]
fn session_save(app: tauri::AppHandle, data: String) -> Result<(), String> {
    let dir = app_data_dir(&app).ok_or("no data dir")?;
    std::fs::write(dir.join("session.json"), data).map_err(|e| e.to_string())
}
#[tauri::command]
fn session_load(app: tauri::AppHandle) -> Option<String> {
    std::fs::read_to_string(app_data_dir(&app)?.join("session.json")).ok()
}

/// Socket API: newline-delimited JSON over a Unix socket. Requests are
/// forwarded to the webview (which owns tabs, panes, and screen contents)
/// and the response is routed back to the caller.
#[tauri::command]
fn api_respond(state: tauri::State<'_, Arc<AppState>>, id: u64, data: String) {
    if let Some(tx) = state.api_pending.lock().unwrap().remove(&id) {
        let _ = tx.send(data);
    }
}
fn spawn_api_loop(app: tauri::AppHandle, state: Arc<AppState>) {
    let Some(path) = api_socket_path(&app) else { return };
    let _ = std::fs::remove_file(&path);
    let listener = match std::os::unix::net::UnixListener::bind(&path) {
        Ok(l) => l,
        Err(_) => return,
    };
    thread::spawn(move || {
        for stream in listener.incoming() {
            let Ok(stream) = stream else { continue };
            let app = app.clone();
            let state = state.clone();
            thread::spawn(move || {
                use std::io::{BufRead, BufReader};
                let Ok(read_half) = stream.try_clone() else { return };
                let mut writer = stream;
                for line in BufReader::new(read_half).lines() {
                    let Ok(line) = line else { break };
                    if line.trim().is_empty() {
                        continue;
                    }
                    let (tx, rx) = std::sync::mpsc::channel();
                    let id = {
                        let mut c = state.api_counter.lock().unwrap();
                        *c += 1;
                        *c
                    };
                    state.api_pending.lock().unwrap().insert(id, tx);
                    let _ = app.emit("api://request", ApiRequest { id, req: line });
                    let resp = rx
                        .recv_timeout(Duration::from_secs(5))
                        .unwrap_or_else(|_| "{\"error\":\"timeout\"}".into());
                    state.api_pending.lock().unwrap().remove(&id);
                    if writeln!(writer, "{}", resp).is_err() {
                        break;
                    }
                }
            });
        }
    });
}

/// Write the integration scripts once per launch; returns the dir holding
/// prism.zsh / prism.bash / bash-init.sh and the zdotdir/ stubs.
fn shell_integration_dir(app: &tauri::AppHandle) -> Option<String> {
    static DIR: OnceLock<Option<String>> = OnceLock::new();
    DIR.get_or_init(|| {
        let dir = app.path().app_data_dir().ok()?.join("shell-integration");
        let zdot = dir.join("zdotdir");
        std::fs::create_dir_all(&zdot).ok()?;
        std::fs::write(dir.join("prism.zsh"), PRISM_ZSH).ok()?;
        std::fs::write(dir.join("prism.bash"), PRISM_BASH).ok()?;
        std::fs::write(dir.join("bash-init.sh"), BASH_INIT).ok()?;
        std::fs::write(zdot.join(".zshenv"), ZSHENV).ok()?;
        std::fs::write(zdot.join(".zprofile"), ZPROFILE).ok()?;
        std::fs::write(zdot.join(".zshrc"), ZSHRC).ok()?;
        std::fs::write(zdot.join(".zlogin"), ZLOGIN).ok()?;
        Some(dir.to_string_lossy().into_owned())
    })
    .clone()
}

#[tauri::command]
fn app_home() -> String {
    home()
}

#[tauri::command]
fn pty_spawn(
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<AppState>>,
    cwd: Option<String>,
    rows: u16,
    cols: u16,
) -> Result<u32, String> {
    let pair = native_pty_system()
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    // Open in the requested directory when it is real, else HOME.
    let start_dir = match cwd {
        Some(d) if std::path::Path::new(&d).is_dir() => d,
        _ => home(),
    };
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into());
    let shell_name = shell.rsplit('/').next().unwrap_or("");
    let integ = shell_integration_dir(&app);
    let mut cmd = CommandBuilder::new(&shell);
    // bash: --init-file replaces -l; the init script emulates a login shell
    // (profiles) and then loads prism.bash. Everything else stays a login shell.
    match (shell_name, &integ) {
        ("bash", Some(dir)) => {
            cmd.arg("--init-file");
            cmd.arg(format!("{}/bash-init.sh", dir));
        }
        _ => {
            cmd.arg("-l");
        }
    }
    cmd.cwd(start_dir);
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    cmd.env("TERM_PROGRAM", "PRISM");
    cmd.env("TERM_PROGRAM_VERSION", env!("CARGO_PKG_VERSION"));
    if let Some(sock) = api_socket_path(&app) {
        cmd.env("PRISM_SOCKET", sock);
    }
    if let Some(dir) = &integ {
        // Exported for every shell: nested shells (e.g. zsh under bash) can be
        // hooked manually via `source "$PRISM_INTEGRATION_DIR/prism.zsh"`, and
        // ZDOTDIR makes a zsh started from a non-zsh default pick it up alone.
        cmd.env("PRISM_INTEGRATION_DIR", dir.as_str());
        let orig = std::env::var("ZDOTDIR").unwrap_or_default();
        cmd.env("PRISM_USER_ZDOTDIR", if orig.is_empty() { home() } else { orig });
        cmd.env("ZDOTDIR", format!("{}/zdotdir", dir));
    }

    let mut child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    let pid = child.process_id().unwrap_or(0);
    drop(pair.slave);

    let id = {
        let mut n = state.next_id.lock().unwrap();
        *n += 1;
        *n
    };

    // Register the session before the reader thread starts, so an instantly
    // dying shell can't have its exit cleanup race ahead of the insert.
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    state.sessions.lock().unwrap().insert(
        id,
        Session {
            writer,
            master: pair.master,
            pid,
            proc: String::new(),
            agent_active: false,
            watcher: None,
            watch_dir: None,
            artifacts: HashMap::new(),
            artifacts_dirty: false,
        },
    );

    // Reader thread: PTY output -> webview (base64, exit on EOF).
    let app_read = app.clone();
    let state_read = state.inner().clone();
    thread::spawn(move || {
        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let data = base64::engine::general_purpose::STANDARD.encode(&buf[..n]);
                    let _ = app_read.emit("pty://data", DataPayload { id, data });
                }
            }
        }
        // Drop the session (writer, master, watcher) so exited shells don't linger.
        state_read.sessions.lock().unwrap().remove(&id);
        let _ = app_read.emit("pty://exit", IdPayload { id });
    });

    // Wait thread: reap the shell so it never becomes a zombie.
    thread::spawn(move || {
        let _ = child.wait();
    });

    Ok(id)
}

#[tauri::command]
fn pty_write(state: tauri::State<'_, Arc<AppState>>, id: u32, data: String) -> Result<(), String> {
    if let Some(s) = state.sessions.lock().unwrap().get_mut(&id) {
        s.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
        s.writer.flush().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn pty_resize(
    state: tauri::State<'_, Arc<AppState>>,
    id: u32,
    rows: u16,
    cols: u16,
) -> Result<(), String> {
    if let Some(s) = state.sessions.lock().unwrap().get(&id) {
        s.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn pty_kill(state: tauri::State<'_, Arc<AppState>>, id: u32) {
    // Dropping the session closes the PTY; the shell gets SIGHUP and exits,
    // the reader thread sees EOF and emits pty://exit.
    state.sessions.lock().unwrap().remove(&id);
}

#[tauri::command]
fn set_active(state: tauri::State<'_, Arc<AppState>>, id: u32) {
    *state.active.lock().unwrap() = Some(id);
}

#[tauri::command]
fn artifact_reveal(path: String) {
    let _ = Command::new("open").arg("-R").arg(path).spawn();
}

#[tauri::command]
fn open_url(url: String) {
    if url.starts_with("http://") || url.starts_with("https://") {
        let _ = Command::new("open").arg(url).spawn();
    }
}

#[tauri::command]
fn quicklook(path: String) {
    if std::path::Path::new(&path).exists() {
        let _ = Command::new("qlmanage").arg("-p").arg(path).spawn();
    }
}

/// Unstaged diff for one file (falls back to diff vs HEAD for staged edits).
#[tauri::command]
fn artifact_diff(cwd: String, path: String) -> String {
    let run = |args: &[&str]| {
        Command::new("git")
            .arg("-C").arg(&cwd)
            .args(args)
            .arg("--").arg(&path)
            .output()
            .ok()
            .map(|o| String::from_utf8_lossy(&o.stdout).into_owned())
            .unwrap_or_default()
    };
    let mut out = run(&["diff", "--no-color"]);
    if out.trim().is_empty() {
        out = run(&["diff", "--no-color", "HEAD"]);
    }
    if out.trim().is_empty() {
        "(no uncommitted changes for this file)".into()
    } else {
        out
    }
}

// --- Custom terminal fonts ----------------------------------------------------
fn user_fonts_dir(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    let dir = app_data_dir(app)?.join("user-fonts");
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir)
}

#[tauri::command]
fn font_save(app: tauri::AppHandle, name: String, data_b64: String) -> Result<String, String> {
    let safe: String = name
        .chars()
        .map(|c| if c.is_alphanumeric() || "._- ".contains(c) { c } else { '_' })
        .collect();
    if safe.is_empty() || safe.starts_with('.') {
        return Err("bad font file name".into());
    }
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data_b64)
        .map_err(|e| e.to_string())?;
    if bytes.len() > 40_000_000 {
        return Err("font file too large".into());
    }
    let dir = user_fonts_dir(&app).ok_or("no data dir")?;
    std::fs::write(dir.join(&safe), bytes).map_err(|e| e.to_string())?;
    Ok(safe)
}

#[tauri::command]
fn font_load(app: tauri::AppHandle, file: String) -> Result<String, String> {
    if file.contains('/') || file.starts_with('.') {
        return Err("bad font file name".into());
    }
    let dir = user_fonts_dir(&app).ok_or("no data dir")?;
    let bytes = std::fs::read(dir.join(&file)).map_err(|e| e.to_string())?;
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

#[tauri::command]
fn font_delete(app: tauri::AppHandle, file: String) -> Result<(), String> {
    if file.contains('/') || file.starts_with('.') {
        return Err("bad font file name".into());
    }
    let dir = user_fonts_dir(&app).ok_or("no data dir")?;
    std::fs::remove_file(dir.join(&file)).map_err(|e| e.to_string())
}

/// Kitty graphics t=f / t=t media: read a file the client asked us to display.
/// `delete` honors t=t semantics but only for the protocol's own temp files.
#[tauri::command]
fn read_file_b64(path: String, max: Option<u64>, delete: Option<bool>) -> Result<String, String> {
    let meta = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    if !meta.is_file() {
        return Err("not a file".into());
    }
    if meta.len() > max.unwrap_or(64_000_000) {
        return Err("file too large".into());
    }
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    if delete.unwrap_or(false) && path.contains("tty-graphics-protocol") {
        let _ = std::fs::remove_file(&path);
    }
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

/// Cmd-click semantic history: open a path (optionally file:line) in the
/// configured editor, falling back to the system opener.
#[tauri::command]
fn open_in_editor(cwd: String, path: String, line: Option<u32>, editor: String) {
    let mut p = path;
    if let Some(rest) = p.clone().strip_prefix("~/") {
        p = format!("{}/{}", home(), rest);
    }
    let abs = if p.starts_with('/') {
        std::path::PathBuf::from(&p)
    } else {
        std::path::Path::new(&cwd).join(&p)
    };
    let Ok(abs) = abs.canonicalize() else { return };
    if !abs.exists() {
        return;
    }
    if abs.is_dir() {
        let _ = Command::new("open").arg(&abs).spawn();
        return;
    }
    let target = match line {
        Some(l) => format!("{}:{}", abs.display(), l),
        None => abs.display().to_string(),
    };
    let spawned = match editor.as_str() {
        "code" | "cursor" => Command::new(&editor).arg("-g").arg(&target).spawn(),
        "zed" => Command::new("zed").arg(&target).spawn(),
        _ => Command::new("open").arg(&abs).spawn(),
    };
    if spawned.is_err() {
        let _ = Command::new("open").arg(&abs).spawn();
    }
}

/// Dock badge with the count of agents waiting on the user.
#[tauri::command]
fn set_badge(app: tauri::AppHandle, count: i64) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.set_badge_count(if count > 0 { Some(count) } else { None });
    }
}

#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").into()
}

/// Re-register the global summon shortcut (the frontend owns the persisted value).
#[tauri::command]
fn set_summon_shortcut(app: tauri::AppHandle, shortcut: String) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    let gs = app.global_shortcut();
    gs.unregister_all().map_err(|e| e.to_string())?;
    gs.register(shortcut.as_str()).map_err(|e| e.to_string())
}

/// Ask the update endpoint whether a newer build exists.
#[tauri::command]
async fn check_update(app: tauri::AppHandle) -> Result<Option<serde_json::Value>, String> {
    use tauri_plugin_updater::UpdaterExt;
    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await.map_err(|e| e.to_string())? {
        Some(u) => Ok(Some(serde_json::json!({
            "version": u.version,
            "notes": u.body,
        }))),
        None => Ok(None),
    }
}

/// Download, verify, swap the app bundle, and relaunch.
#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    let updater = app.updater().map_err(|e| e.to_string())?;
    let Some(update) = updater.check().await.map_err(|e| e.to_string())? else {
        return Err("no update available".into());
    };
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|e| e.to_string())?;
    app.restart();
}

#[tauri::command]
fn notify_user(title: String, body: String) {
    let script = format!(
        "display notification \"{}\" with title \"{}\"",
        body.replace('\\', "\\\\").replace('"', "\\\""),
        title.replace('\\', "\\\\").replace('"', "\\\"")
    );
    let _ = Command::new("osascript").arg("-e").arg(script).spawn();
}

/// `lsof` the session's cwd (same trick as the Electron app).
fn get_cwd(pid: u32) -> String {
    let out = Command::new("lsof")
        .args(["-a", "-d", "cwd", "-p", &pid.to_string(), "-Fn"])
        .output();
    if let Ok(o) = out {
        for line in String::from_utf8_lossy(&o.stdout).lines() {
            if let Some(rest) = line.strip_prefix('n') {
                return rest.to_string();
            }
        }
    }
    String::new()
}

fn get_branch(cwd: &str) -> String {
    if cwd.is_empty() {
        return String::new();
    }
    let out = Command::new("git")
        .args(["-C", cwd, "rev-parse", "--abbrev-ref", "HEAD"])
        .output();
    if let Ok(o) = out {
        let b = String::from_utf8_lossy(&o.stdout).trim().to_string();
        if b != "HEAD" {
            return b;
        }
    }
    String::new()
}

/// Poll the process tree to detect which agent (if any) runs in each session,
/// mirroring the Electron main-process scanner.
fn spawn_proc_loop(app: tauri::AppHandle, state: Arc<AppState>) {
    thread::spawn(move || loop {
        thread::sleep(Duration::from_millis(400));
        let out = match Command::new("ps").args(["-Ao", "pid=,ppid=,comm="]).output() {
            Ok(o) => o,
            Err(_) => continue,
        };
        // ppid -> child command basenames
        let mut children: HashMap<u32, Vec<String>> = HashMap::new();
        for line in String::from_utf8_lossy(&out.stdout).lines() {
            let mut it = line.trim().splitn(3, char::is_whitespace);
            let (Some(_pid), Some(ppid), Some(comm)) = (it.next(), it.next(), it.next()) else {
                continue;
            };
            if let Ok(ppid) = ppid.trim().parse::<u32>() {
                let base = comm.trim().rsplit('/').next().unwrap_or(comm).to_string();
                children.entry(ppid).or_default().push(base);
            }
        }
        let mut rising = Vec::new();
        {
            let mut sessions = state.sessions.lock().unwrap();
            for (id, s) in sessions.iter_mut() {
                let kids = children.get(&s.pid);
                let agent =
                    kids.and_then(|k| k.iter().find(|c| AGENTS.contains(&c.as_str())).cloned());
                let proc = agent
                    .clone()
                    .or_else(|| kids.and_then(|k| k.last().cloned()))
                    .unwrap_or_else(|| "shell".into());
                let active = agent.is_some();
                if proc != s.proc || active != s.agent_active {
                    let rose = active && !s.agent_active;
                    s.proc = proc.clone();
                    s.agent_active = active;
                    let _ = app.emit("pty://proc", ProcPayload { id: *id, proc, active });
                    if rose {
                        rising.push(*id);
                    }
                }
            }
        }
        // Each time an agent starts, (re)point the watcher at the current cwd.
        for id in rising {
            ensure_watch(&app, &state, id);
        }
    });
}

/// Watch the session's cwd for files an agent writes/edits, while it is active.
fn ensure_watch(_app: &tauri::AppHandle, state: &Arc<AppState>, id: u32) {
    let (pid, current) = {
        let sessions = state.sessions.lock().unwrap();
        match sessions.get(&id) {
            Some(s) => (s.pid, s.watch_dir.clone()),
            None => return,
        }
    };
    let cwd = get_cwd(pid);
    // Refuse overly broad roots.
    if cwd.is_empty() || cwd == "/" || cwd == home() || !std::path::Path::new(&cwd).is_dir() {
        return;
    }
    if current.as_deref() == Some(cwd.as_str()) {
        return; // already watching this dir
    }

    let st = state.clone();
    let watch_cwd = cwd.clone();
    let mut watcher = match notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
        use notify::EventKind;
        let Ok(event) = res else { return };
        if !matches!(event.kind, EventKind::Create(_) | EventKind::Modify(_)) {
            return;
        }
        let mut sessions = st.sessions.lock().unwrap();
        let Some(s) = sessions.get_mut(&id) else { return };
        if !s.agent_active {
            return; // only while an agent is the foreground process
        }
        let now = now_ms();
        let mut changed = false;
        for p in &event.paths {
            if !p.is_file() {
                continue;
            }
            let ps = p.to_string_lossy().to_string();
            if ignored(&ps) {
                continue;
            }
            s.artifacts.insert(ps, ("edit".into(), now));
            changed = true;
        }
        if changed {
            s.artifacts_dirty = true;
        }
    }) {
        Ok(w) => w,
        Err(_) => return,
    };

    use notify::Watcher;
    if watcher
        .watch(std::path::Path::new(&watch_cwd), notify::RecursiveMode::Recursive)
        .is_err()
    {
        return;
    }
    let mut sessions = state.sessions.lock().unwrap();
    if let Some(s) = sessions.get_mut(&id) {
        s.watcher = Some(watcher);
        s.watch_dir = Some(watch_cwd);
    }
}

/// Debounce + push artifact lists to the webview (coalesces bursty fs events).
fn spawn_artifacts_loop(app: tauri::AppHandle, state: Arc<AppState>) {
    thread::spawn(move || loop {
        thread::sleep(Duration::from_millis(300));
        let mut updates = Vec::new();
        {
            let mut sessions = state.sessions.lock().unwrap();
            for (id, s) in sessions.iter_mut() {
                if s.artifacts_dirty {
                    s.artifacts_dirty = false;
                    let mut list: Vec<ArtifactRecord> = s
                        .artifacts
                        .iter()
                        .map(|(p, (tool, time))| ArtifactRecord {
                            path: p.clone(),
                            tool: tool.clone(),
                            time: *time,
                        })
                        .collect();
                    list.sort_by(|a, b| b.time.cmp(&a.time));
                    updates.push((*id, list));
                }
            }
        }
        for (id, list) in updates {
            let _ = app.emit("artifacts://update", ArtifactsPayload { id, list });
        }
    });
}

/// Push cwd + git branch for the active session into the footer.
fn spawn_footer_loop(app: tauri::AppHandle, state: Arc<AppState>) {
    thread::spawn(move || loop {
        thread::sleep(Duration::from_millis(1500));
        let active = *state.active.lock().unwrap();
        let Some(id) = active else { continue };
        let pid = state.sessions.lock().unwrap().get(&id).map(|s| s.pid);
        let Some(pid) = pid else { continue };
        let cwd = get_cwd(pid);
        if cwd.is_empty() {
            continue; // lsof hiccup; keep whatever the footer already shows
        }
        let branch = get_branch(&cwd);
        let _ = app.emit("footer://update", FooterPayload { id, cwd, branch });
    });
}

fn main() {
    let state = Arc::new(AppState::default());
    tauri::Builder::default()
        .manage(state.clone())
        // Global summon: Ctrl+` toggles PRISM from anywhere (quick-terminal style).
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcuts(["ctrl+`"])
                .expect("failed to parse global shortcut")
                .with_handler(|app, _shortcut, event| {
                    use tauri_plugin_global_shortcut::ShortcutState;
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    if let Some(w) = app.get_webview_window("main") {
                        let front = w.is_visible().unwrap_or(false) && w.is_focused().unwrap_or(false);
                        if front {
                            let _ = w.hide();
                        } else {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Remember window size/position across launches.
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            app_home,
            pty_spawn,
            pty_write,
            pty_resize,
            pty_kill,
            set_active,
            artifact_reveal,
            quicklook,
            artifact_diff,
            open_in_editor,
            set_badge,
            notify_user,
            open_url,
            session_save,
            session_load,
            api_respond,
            app_version,
            set_summon_shortcut,
            check_update,
            install_update,
            font_save,
            font_load,
            font_delete,
            read_file_b64
        ])
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap();
            #[cfg(target_os = "macos")]
            apply_vibrancy(
                &window,
                NSVisualEffectMaterial::HudWindow,
                Some(NSVisualEffectState::Active),
                Some(16.0),
            )
            .expect("failed to apply window vibrancy");

            spawn_proc_loop(app.handle().clone(), state.clone());
            spawn_footer_loop(app.handle().clone(), state.clone());
            spawn_artifacts_loop(app.handle().clone(), state.clone());
            spawn_api_loop(app.handle().clone(), state.clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running PRISM");
}
