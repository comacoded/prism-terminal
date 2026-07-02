# PRISM — Feature Reference

PRISM is a macOS terminal built for supervising AI coding agents. It pairs a
glass, native-vibrancy aesthetic with agent awareness no other terminal has:
it knows when an agent is working, what files it touched, and when it needs
you. Terminal emulation is provided by xterm.js (the engine inside VS Code's
integrated terminal), so compatibility tracks the most battle-tested web
terminal in the world.

Stack: Tauri 2 (Rust backend, WKWebView frontend), xterm.js 6 with WebGL
rendering, portable-pty, zsh shell integration injected via ZDOTDIR.

---

## Agent awareness (the differentiator)

- **Agent detection.** The Rust backend polls the process tree (every 400ms)
  and recognizes `claude`, `codex`, and `bob` as foreground agents in any tab.
- **Work glow.** While an agent is actively generating, the window wears an
  animated conic-gradient border (Siri style). Detection scans the live
  screen for the agent's spinner line every 400ms, so the glow holds steady
  for the entire turn and drops when the agent goes quiet.
- **Tab states.** Each tab's dot reflects its session: violet = agent working,
  blue = agent running but idle (waiting on you), gray = plain shell,
  red = exited.
- **Artifacts rail** (Cmd+Shift+A). While an agent is active, PRISM watches
  the session's working directory and lists every file the agent creates or
  edits, newest first, with relative timestamps. Click any entry to reveal it
  in Finder. The rail button pulses when new artifacts land.
- **Mission control** (Cmd+E). A grid of every session: title, state and how
  long it has been in that state, working directory, git branch, and the last
  files touched. Working sessions get a violet border. Click a card to jump
  to that session.

## Terminal features

- **Tabs** with native-feel pills in the titlebar (Cmd+T new, Cmd+W close,
  Cmd+Shift+{ / } to cycle, Cmd+1..9 direct jump).
- **Tab groups** (Chrome-style). Right-click a tab to start a group or join
  an existing one; groups get a colored chip in the strip with a name and a
  nine-color picker (right-click the chip to edit or ungroup). Clicking a
  chip collapses the group into it, click again (or activate a member tab)
  to expand. Member tabs wear the group color, stay contiguous, and groups
  persist across launches. Mission control shows each tab's group.
- **Rename tabs.** Double-click a tab (or right-click, Rename) to give it a
  custom name; clearing the name reverts to the shell-reported title. Names
  persist across launches.
- **Iconography**: Phosphor icons throughout the chrome (single filled
  paths, crisp at any size).
- **Session restore.** Tab working directories and the active tab persist
  across launches (up to 8 tabs).
- **Scrollback search** (Cmd+F). Incremental highlight-as-you-type, match
  counter, Enter / Shift+Enter to step, scrollbar match markers,
  10,000 lines of scrollback.
- **Command palette** (Cmd+P). Fuzzy-filterable actions plus "go to" entries
  for every open tab.
- **Prompt navigation** (Cmd+Up / Cmd+Down). Jump between shell prompts in
  scrollback using OSC 133 semantic marks.
- **Per-command telemetry.** The footer shows the last command's exit status
  and duration (green check or red cross). Commands that run longer than 15
  seconds fire a macOS notification if you are in another tab or app.
- **Progress in tabs.** Programs that emit ConEmu OSC 9;4 progress render a
  hairline progress bar along the tab's bottom edge (red on error, pulsing
  when indeterminate).
- **Clickable URLs.** Cmd-less click opens links in the default browser
  (http/https only).
- **Drag and drop.** Drop files onto the window to paste shell-escaped paths
  at the cursor.
- **Global summon.** Ctrl+` toggles PRISM from anywhere in macOS
  (quick-terminal style).
- **Settings** (Cmd+, or the gear button). Text size (10 to 20, also
  Cmd+plus / Cmd+minus / Cmd+0 to reset), glass darkness, work-glow toggle,
  and a reset-to-defaults button. Persisted across launches.
- **Fast scrolling.** 8x wheel scrolling; hold Alt for 20x.
- **GPU rendering.** WebGL renderer with automatic DOM-renderer fallback.
- **Footer context.** Working directory (tilde-shortened), git branch,
  foreground process, session uptime, live-updated.

## Shell integration (zsh, automatic)

PRISM injects a ZDOTDIR bootstrap that sources your real zsh config
untouched, then registers hooks. No dotfile edits required. Nested shells
and other terminals are unaffected.

Emitted marks:

| Sequence | Meaning | Powers |
|---|---|---|
| OSC 133;A | Prompt start | Prompt jumping |
| OSC 133;C | Command started | Duration timing, output extraction |
| OSC 133;D;code | Command finished + exit code | Footer chip, notifications |
| OSC 7 (file:// URL) | Working directory changed | Instant footer/restore cwd, works over ssh |

Identity: spawned shells get `TERM=xterm-256color`, `COLORTERM=truecolor`,
`TERM_PROGRAM=PRISM`, and `TERM_PROGRAM_VERSION` so scripts and agents can
detect PRISM.

## VT / protocol support

Core emulation is xterm.js: the xterm-compatible control-sequence surface
(CSI/OSC/DCS), alternate screen, 256-color and truecolor, all common mouse
reporting modes (including SGR), bracketed paste, window title reporting,
and DECSET private modes, exercised daily against vim, tmux, htop, fzf, and
friends inside VS Code.

On top of that, PRISM enables or implements:

| Protocol | Support | Notes |
|---|---|---|
| OSC 8 hyperlinks | Yes | Native xterm.js |
| OSC 52 clipboard | Yes | Copy from remote/ssh/tmux sessions |
| Sixel images | Yes | @xterm/addon-image |
| iTerm inline images (IIP) | Yes | @xterm/addon-image |
| Unicode grapheme clustering | Yes | Correct widths for complex emoji/scripts |
| OSC 7 cwd reporting | Yes | Custom handler |
| OSC 133 semantic prompts | Yes | Custom handler + injected zsh hooks |
| OSC 9 notifications | Yes | ConEmu/iTerm style toast → macOS notification |
| OSC 9;4 progress | Yes | Tab progress bar |
| OSC 777;notify | Yes | urxvt style title;body → macOS notification |
| Kitty graphics protocol | No | Not supported by xterm.js |
| Kitty keyboard protocol | No | Not supported by xterm.js |
| Ligatures | No | Not supported with the WebGL renderer |

Notifications from OSC 9/777 only fire when the tab is inactive or PRISM is
unfocused, so foreground work never spams you.

## Keyboard reference

| Keys | Action |
|---|---|
| Cmd+T | New tab (inherits current directory) |
| Cmd+W | Close tab |
| Cmd+Shift+{ / Cmd+Shift+} | Previous / next tab |
| Cmd+1..9 | Jump to tab by position |
| Cmd+E | Mission control |
| Cmd+F | Find in scrollback |
| Cmd+P | Command palette |
| Cmd+K | Clear terminal |
| Cmd+Up / Cmd+Down | Previous / next prompt |
| Cmd+Shift+A | Toggle artifacts rail |
| Cmd+, | Settings |
| Cmd+plus / Cmd+minus | Text size up / down |
| Cmd+0 | Reset text size |
| Ctrl+` | Summon / dismiss PRISM (global) |
| Alt+scroll | Fast scroll (20x) |
| Esc | Close find / palette / mission control |

## Theming

- Native macOS vibrancy (HudWindow material) with a dark tint so text stays
  readable over light wallpapers.
- JetBrains Mono for terminal text; Raleway Thin for the splash.
- Startup splash: lowercase "prism", staggered letter fade in/out.
- Working glow: conic-gradient border in the Siri palette, two blurred glow
  layers plus a crisp border layer.

## Known limits

- macOS only (vibrancy, lsof, osascript, and `open` are macOS paths).
- Shell integration is zsh only; bash/fish sessions still work but lose
  prompt marks, duration chips, and OSC 7 (cwd falls back to lsof polling).
- No splits yet (planned; the largest structural gap vs Ghostty).
- Settings cover text size, glass darkness, and the work glow; fonts,
  color themes, and hotkeys are not yet configurable.
- Ad-hoc code signing: fine locally, needs Developer ID + notarization to
  distribute.

## Architecture notes

- `src-tauri/src/main.rs`: PTY spawn/IO (portable-pty), process-tree polling
  (agent detection), cwd/branch footer loop, recursive fs watcher for
  artifacts, zsh integration file generation, notifications, global hotkey.
- `src/main.js`: xterm.js setup + addons, OSC handlers, tabs, glow scanner,
  overlays (find/palette/mission), session persistence.
- `src/styles.css`: all chrome styling.
- Addons vendored in `src/vendor/` (fit, search, webgl, clipboard, image,
  unicode-graphemes, web-links); npm packages exist only to source them.
