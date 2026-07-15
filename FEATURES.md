# PRISM: Feature Reference

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
- **Artifacts rail** (automatic; Cmd+Shift+A to override). While an agent is
  active, PRISM watches the session's working directory and lists every file
  the agent creates or edits, newest first, with relative timestamps and the
  working folder in the header. The rail opens itself when the active tab's
  agent produces files, follows you between tabs (open where there are
  artifacts, closed where there aren't), and stays closed for a session once
  you dismiss it manually. Click any entry to reveal it in Finder; hover for
  Quick Look and a git-diff overlay of that file's uncommitted changes.
- **Mission control** (Cmd+E). A grid of every session: title, state and how
  long it has been in that state, working directory, git branch, and the last
  files touched. Working sessions get a violet border. Click a card to jump
  to that session.

## Terminal features

- **Tabs** with native-feel pills in the titlebar (Cmd+T new, Cmd+W close,
  Cmd+Shift+{ / } to cycle, Cmd+1..9 direct jump).
- **Split panes and grids.** Cmd+D splits the focused pane right,
  Cmd+Shift+D splits it down; directions mix and nest freely (tmux-style
  trees), so 2x2 grids and asymmetric layouts work, up to six panes per
  tab. Right-click a tab for the same splits, or drag a tab onto any edge
  of any pane in the visible tab: a highlight previews the half it will
  occupy, and dropping merges it into the layout right there. Click a pane
  to focus it; the focused pane wears an accent border, gets Cmd+W'd first,
  and drives the footer, artifacts rail, and search. Drag any divider to
  resize its two neighbors. Cmd+Shift+Enter zooms the focused pane to fill
  the tab (toggle). Cmd+Shift+B broadcasts typed input to every pane in the
  tab. Cmd+Shift+W closes just the focused split (never the whole tab);
  right-click a split pane to move it out into its own tab. Grid layouts
  and pane sizes persist across launches. Every pane is its own shell with
  independent agent detection, so the glow and tab state aggregate across
  panes.
- **Needs-you notifications.** When an agent stops generating while you are
  in another tab or app, PRISM notifies you, pulses that tab's dot amber,
  and badges the Dock with the count of waiting agents.
- **Semantic history.** Cmd-click any file path printed in the terminal to
  open it in your editor (VS Code, Cursor, Zed, or system default; chosen
  in settings). path:line jumps to the line.
- **Command history.** Shell integration records commands; the palette
  lists recent ones for one-keystroke re-run, persisted across launches.
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
- **Session restore.** Relaunching PRISM brings back your tabs, split
  layouts, working directories, groups, and names, so your whole workspace
  reopens in place with fresh prompts. (Terminal contents are not replayed:
  a saved snapshot is a dead picture, not a live session, and full-screen
  agents clear the screen on start anyway.)
- **Socket API + `prism` CLI.** Every shell gets `$PRISM_SOCKET` (a Unix
  socket) and a `prism` command: `prism list` (tabs, panes, agent states),
  `prism new-tab [dir]`, `prism split [row|column]`, `prism read <pane>
  [lines]`, `prism send <pane> <text>`, `prism activate <pane>`,
  `prism notify <text>`, or raw JSON. Agents running inside PRISM can open
  panes, read screens, and drive the terminal programmatically.
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
- **Self-updating.** PRISM checks its update feed after launch and notifies
  when a new version exists; Settings → Updates installs the signed build
  and relaunches with the session intact (session restore covers the
  restart). Also drivable via the socket API (check-update /
  install-update).
- **Drag to reorder and regroup.** Drag tabs to rearrange them; drop a tab
  between two tabs of a group (or onto the group's chip) to join that group,
  drag it out to leave. A drop indicator marks the target slot.
- **Settings** (Cmd+, or the gear button; Primer-informed UI). Ten color
  themes chosen from Warp-style preview cards (PRISM, Dark, Light, Dracula,
  Cyber Wave, Nord, One Dark, Solarized Dark, Gruvbox Dark, Catppuccin
  Mocha, plus imported iTerm .itermcolors and Ghostty theme files); the
  Light theme flips the entire chrome to a light appearance.
  Plus text size (10 to 20, also Cmd+plus / Cmd+minus / Cmd+0), glass tint,
  cursor style (bar / block / underline) and blink, work-glow toggle, a
  reset-to-defaults button, and a full shortcuts reference. Persisted
  across launches.
- **Terminal fonts.** Bundled JetBrains Mono, Fira Code, Iosevka, and
  Monocraft, plus your own: import a .ttf/.otf/.woff2 file (stored in app
  data, loads on every launch) or add any installed system font by name.
- **Fast scrolling.** 8x wheel scrolling; hold Alt for 20x.
- **GPU rendering.** WebGL renderer with automatic DOM-renderer fallback.
- **Footer context.** Working directory (tilde-shortened), git branch,
  foreground process, session uptime, live-updated.

## Shell integration (zsh + bash, automatic)

zsh sessions get a ZDOTDIR bootstrap that sources your real zsh config
untouched, then registers hooks. bash sessions launch with an init file
that emulates a login shell (profiles) before hooking PROMPT_COMMAND and
PS0 (bash 4.4+; on the ancient macOS 3.2 the command-start mark degrades
gracefully). No dotfile edits required, and other terminals are unaffected.

Nested shells: every PRISM pane exports `PRISM_INTEGRATION_DIR`, and a zsh
started from a non-zsh default shell picks the hooks up automatically via
ZDOTDIR. Any other nested shell can load them manually:

```sh
source "$PRISM_INTEGRATION_DIR/prism.zsh"    # nested zsh
source "$PRISM_INTEGRATION_DIR/prism.bash"   # nested bash
```

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
| OSC 133 semantic prompts | Yes | Custom handler + injected zsh/bash hooks |
| OSC 9 notifications | Yes | ConEmu/iTerm style toast → macOS notification |
| OSC 9;4 progress | Yes | Tab progress bar |
| OSC 777;notify | Yes | urxvt style title;body → macOS notification |
| Kitty graphics protocol | Yes | Custom APC interceptor + overlay renderer: PNG/RGB/RGBA, direct + file + temp-file media, chunking, zlib, queries (kitten icat works), delete; video via rapid frame replacement (mpv --vo=kitty, timg) |
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
| Cmd+Shift+Enter | Zoom focused pane |
| Cmd+Shift+B | Broadcast input to panes |
| Cmd+click path | Open file in editor |
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

- macOS only (universal binary: Apple silicon + Intel). Vibrancy, lsof, osascript, and `open` are macOS paths; Linux is planned for v0.3.
- Shell integration is zsh + bash; fish sessions still work but lose
  prompt marks, duration chips, and OSC 7 (cwd falls back to lsof polling).
- Kitty graphics: no Unicode placeholders, animation frames (a=f), or
  shared-memory transfers; kitty keyboard protocol still unsupported.
- Ligatures are not supported with the WebGL renderer.

## Architecture notes

- `src-tauri/src/main.rs`: PTY spawn/IO (portable-pty), process-tree polling
  (agent detection), cwd/branch footer loop, recursive fs watcher for
  artifacts, zsh integration file generation, notifications, global hotkey.
- `src/main.js`: xterm.js setup + addons, OSC handlers, tabs, glow scanner,
  overlays (find/palette/mission), session persistence.
- `src/styles.css`: all chrome styling.
- Addons vendored in `src/vendor/` (fit, search, webgl, clipboard, image,
  unicode-graphemes, web-links); npm packages exist only to source them.
