const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

// Color themes: ANSI palettes over the transparent glass background.
// `bg` paints the settings preview card; `light` flips the whole chrome.
const THEMES = {
  prism: { label: 'PRISM', bg: '#0d1014', colors: {
    foreground: '#e8e8ea', cursor: '#ffffff', selectionBackground: 'rgba(120,160,255,0.35)',
    black: '#3a3a3c', red: '#ff6d6d', green: '#56d364', yellow: '#e3b341',
    blue: '#79b8ff', magenta: '#d2a8ff', cyan: '#76e3ea', white: '#d9d9de',
    brightBlack: '#6e6e73', brightRed: '#ff8585', brightGreen: '#7ee787',
    brightYellow: '#f2cc60', brightBlue: '#a5d2ff', brightMagenta: '#e0c4ff',
    brightCyan: '#9bf0f5', brightWhite: '#ffffff',
  } },
  dark: { label: 'Dark', bg: '#171c28', colors: {
    foreground: '#e3e6eb', cursor: '#e3e6eb', selectionBackground: 'rgba(74,158,255,0.35)',
    black: '#21262e', red: '#ff6b82', green: '#4be0a5', yellow: '#f5c96e',
    blue: '#4a9eff', magenta: '#d485ff', cyan: '#59d5e2', white: '#dfe3e8',
    brightBlack: '#575e6b', brightRed: '#ff8fa1', brightGreen: '#6ef0bb',
    brightYellow: '#ffd98c', brightBlue: '#74b6ff', brightMagenta: '#e2a6ff',
    brightCyan: '#7fe4ef', brightWhite: '#ffffff',
  } },
  light: { label: 'Light', bg: '#ffffff', light: true, colors: {
    foreground: '#1f2328', cursor: '#0969da', selectionBackground: 'rgba(9,105,218,0.22)',
    black: '#24292f', red: '#cf222e', green: '#116329', yellow: '#9a6700',
    blue: '#0969da', magenta: '#8250df', cyan: '#1b7c83', white: '#6e7781',
    brightBlack: '#57606a', brightRed: '#a40e26', brightGreen: '#1a7f37',
    brightYellow: '#bf8700', brightBlue: '#218bff', brightMagenta: '#a475f9',
    brightCyan: '#3192aa', brightWhite: '#8c959f',
  } },
  dracula: { label: 'Dracula', bg: '#282a36', colors: {
    foreground: '#f8f8f2', cursor: '#f8f8f2', selectionBackground: 'rgba(189,147,249,0.35)',
    black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
    blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
    brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94',
    brightYellow: '#ffffa5', brightBlue: '#d6acff', brightMagenta: '#ff92df',
    brightCyan: '#a4ffff', brightWhite: '#ffffff',
  } },
  cyberwave: { label: 'Cyber Wave', bg: '#150826', colors: {
    foreground: '#e8e6ff', cursor: '#ff2e97', selectionBackground: 'rgba(0,194,255,0.3)',
    black: '#2a2140', red: '#ff2e97', green: '#00ffa3', yellow: '#ffd319',
    blue: '#00c2ff', magenta: '#d642ff', cyan: '#00ffee', white: '#d8d4f2',
    brightBlack: '#574b7d', brightRed: '#ff64b4', brightGreen: '#5cffc4',
    brightYellow: '#ffe166', brightBlue: '#55d6ff', brightMagenta: '#e37fff',
    brightCyan: '#66fff4', brightWhite: '#ffffff',
  } },
  nord: { label: 'Nord', bg: '#2e3440', colors: {
    foreground: '#d8dee9', cursor: '#d8dee9', selectionBackground: 'rgba(129,161,193,0.35)',
    black: '#3b4252', red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b',
    blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0', white: '#e5e9f0',
    brightBlack: '#4c566a', brightRed: '#bf616a', brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b', brightBlue: '#81a1c1', brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb', brightWhite: '#eceff4',
  } },
  onedark: { label: 'One Dark', bg: '#282c34', colors: {
    foreground: '#abb2bf', cursor: '#abb2bf', selectionBackground: 'rgba(97,175,239,0.35)',
    black: '#3f4451', red: '#e06c75', green: '#98c379', yellow: '#e5c07b',
    blue: '#61afef', magenta: '#c678dd', cyan: '#56b6c2', white: '#d7dae0',
    brightBlack: '#4f5666', brightRed: '#ff7b86', brightGreen: '#b1e18b',
    brightYellow: '#efb074', brightBlue: '#67cdff', brightMagenta: '#e48bff',
    brightCyan: '#63d4e0', brightWhite: '#ffffff',
  } },
  solarized: { label: 'Solarized Dark', bg: '#002b36', colors: {
    foreground: '#9fb2b6', cursor: '#93a1a1', selectionBackground: 'rgba(38,139,210,0.35)',
    black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
    blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
    brightBlack: '#586e75', brightRed: '#cb4b16', brightGreen: '#859900',
    brightYellow: '#b58900', brightBlue: '#839496', brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1', brightWhite: '#fdf6e3',
  } },
  gruvbox: { label: 'Gruvbox Dark', bg: '#282828', colors: {
    foreground: '#ebdbb2', cursor: '#ebdbb2', selectionBackground: 'rgba(131,165,152,0.35)',
    black: '#3c3836', red: '#cc241d', green: '#98971a', yellow: '#d79921',
    blue: '#458588', magenta: '#b16286', cyan: '#689d6a', white: '#a89984',
    brightBlack: '#928374', brightRed: '#fb4934', brightGreen: '#b8bb26',
    brightYellow: '#fabd2f', brightBlue: '#83a598', brightMagenta: '#d3869b',
    brightCyan: '#8ec07c', brightWhite: '#ebdbb2',
  } },
  catppuccin: { label: 'Catppuccin Mocha', bg: '#1e1e2e', colors: {
    foreground: '#cdd6f4', cursor: '#f5e0dc', selectionBackground: 'rgba(137,180,250,0.35)',
    black: '#45475a', red: '#f38ba8', green: '#a6e3a1', yellow: '#f9e2af',
    blue: '#89b4fa', magenta: '#f5c2e7', cyan: '#94e2d5', white: '#bac2de',
    brightBlack: '#585b70', brightRed: '#f38ba8', brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af', brightBlue: '#89b4fa', brightMagenta: '#f5c2e7',
    brightCyan: '#94e2d5', brightWhite: '#a6adc8',
  } },
};
function allThemes() {
  const merged = { ...THEMES };
  for (const c of settings.custom || []) merged[c.key] = c;
  return merged;
}
function currentTheme() { return allThemes()[settings.theme] || THEMES.prism; }
function termTheme() {
  const t = currentTheme();
  return {
    background: 'rgba(0,0,0,0)',
    cursorAccent: t.light ? '#ffffff' : '#0a0a0a',
    ...t.colors,
  };
}

// Glow markers: the LLM work-spinner's live elapsed timer, e.g. "(6s · ..."
const WORK_RE = /\(\d+s[\s·)]|esc to interrupt/i;
const WORK_HOLD_MS = 2500; // bridge spinner redraws so the glow never flickers
const WORK_SCAN_MS = 400;
const NOTIFY_CMD_MS = 15000; // commands longer than this notify when you're away
const MAX_RESTORE_TABS = 8;
const MAX_PANES = 6;
let HOME = '';

const tabsEl = document.getElementById('tabs');
const panesEl = document.getElementById('panes');
const newTabBtn = document.getElementById('new-tab');
const toggleArtBtn = document.getElementById('toggle-artifacts');
const artBadge = document.getElementById('art-badge');
const artCount = document.getElementById('art-count');
const artCwd = document.getElementById('art-cwd');
const artList = document.getElementById('art-list');
const fCwd = document.getElementById('f-cwd');
const fBranch = document.getElementById('f-branch');
const fCmd = document.getElementById('f-cmd');
const fProc = document.getElementById('f-proc');
const fUp = document.getElementById('f-up');
const findBar = document.getElementById('find-bar');
const findInput = document.getElementById('find-input');
const findCount = document.getElementById('find-count');
const paletteEl = document.getElementById('palette');
const paletteInput = document.getElementById('palette-input');
const paletteList = document.getElementById('palette-list');
const missionEl = document.getElementById('mission');
const missionGrid = document.getElementById('mission-grid');
const ctxMenu = document.getElementById('ctx-menu');
const groupEditor = document.getElementById('group-editor');
const geName = document.getElementById('ge-name');
const geColors = document.getElementById('ge-colors');
const geUngroup = document.getElementById('ge-ungroup');
const settingsEl = document.getElementById('settings');
const settingsBtn = document.getElementById('toggle-settings');
const setFont = document.getElementById('set-font');
const setFontVal = document.getElementById('set-font-val');
const setTint = document.getElementById('set-tint');
const setTintVal = document.getElementById('set-tint-val');
const setGlow = document.getElementById('set-glow');
const setThemes = document.getElementById('set-themes');
const setCursor = document.getElementById('set-cursor');
const setBlink = document.getElementById('set-blink');
const setKeys = document.getElementById('set-keys');
const setEditor = document.getElementById('set-editor');
const setFontFamily = document.getElementById('set-font-family');
const setImport = document.getElementById('set-import');
const setImportFile = document.getElementById('set-import-file');
const setVersion = document.getElementById('set-version');
const setUpdate = document.getElementById('set-update');
const diffView = document.getElementById('diff-view');
const diffTitle = document.getElementById('diff-title');
const diffBody = document.getElementById('diff-body');
const EYE_ICON = '<svg viewBox="0 0 256 256"><path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"/></svg>';
const DIFF_ICON = '<svg viewBox="0 0 256 256"><path d="M112,152a8,8,0,0,0-8,8v28.69L66.34,151A8,8,0,0,1,64,145.37V95a32,32,0,1,0-16,0v50.38a23.85,23.85,0,0,0,7,17L92.69,200H64a8,8,0,0,0,0,16h48a8,8,0,0,0,8-8V160A8,8,0,0,0,112,152ZM40,64A16,16,0,1,1,56,80,16,16,0,0,1,40,64Zm168,97V110.63a23.85,23.85,0,0,0-7-17L163.31,56H192a8,8,0,0,0,0-16H144a8,8,0,0,0-8,8V96a8,8,0,0,0,16,0V67.31L189.66,105a8,8,0,0,1,2.34,5.66V161a32,32,0,1,0,16,0Zm-8,47a16,16,0,1,1,16-16A16,16,0,0,1,200,208Z"/></svg>';

const tabs = [];
let activeTab = null;
let tabCounter = 0;
let ready = false;

// Tab groups (Chrome-style): id -> { id, name, color, collapsed, chipEl }
const GROUP_COLORS = ['#79b8ff', '#b388ff', '#f5b9ea', '#ff6d6d', '#ffba71', '#e3b341', '#7ee787', '#76e3ea', '#9a9aa0'];
const groups = new Map();
let groupCounter = 0;
// Phosphor "x", used for every tab's close button.
const X_ICON = '<svg viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>';

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function tilde(p) { return HOME && p.startsWith(HOME) ? '~' + p.slice(HOME.length) : p; }
function relTime(ts) {
  const d = Date.now() - ts;
  if (d < 5000) return 'now';
  if (d < 60000) return Math.floor(d / 1000) + 's';
  if (d < 3600000) return Math.floor(d / 60000) + 'm';
  if (d < 86400000) return Math.floor(d / 3600000) + 'h';
  return Math.floor(d / 86400000) + 'd';
}
function uptime(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m`;
}
function fmtDur(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m${Math.round((ms % 60000) / 1000)}s`;
}
function copyText(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  });
}
function activePane() { return activeTab?.active ?? null; }

// --- Settings -----------------------------------------------------------------
const DEFAULT_SETTINGS = { fontSize: 13.5, tint: 45, glow: true, theme: 'prism', cursor: 'bar', blink: true, editor: 'code', custom: [], keys: {}, font: 'jetbrains', summon: 'ctrl+`', userFonts: [] };
// Bundled terminal fonts. Users can add their own: an imported font file
// (stored in app data, loaded as a FontFace) or any installed system font
// by family name. Those live in settings.userFonts as
// { key, label, family, kind: 'file'|'system', file? }.
const FONTS = {
  jetbrains: { label: 'JetBrains Mono', family: 'JetBrains Mono', css: "'JetBrains Mono', Menlo, monospace" },
  fira:      { label: 'Fira Code', family: 'Fira Code', css: "'Fira Code', 'JetBrains Mono', Menlo, monospace" },
  iosevka:   { label: 'Iosevka', family: 'Iosevka', css: "'Iosevka', 'JetBrains Mono', Menlo, monospace" },
  monocraft: { label: 'Monocraft', family: 'Monocraft', css: "'Monocraft', 'JetBrains Mono', Menlo, monospace" },
};
function allFonts() {
  const merged = { ...FONTS };
  for (const f of settings.userFonts || []) {
    merged[f.key] = {
      label: f.label, family: f.family, user: true,
      css: `'${f.family.replace(/'/g, '')}', 'JetBrains Mono', Menlo, monospace`,
    };
  }
  return merged;
}
function termFont() { return (allFonts()[settings.font] || FONTS.jetbrains).css; }
async function preloadTermFont() {
  const fam = (allFonts()[settings.font] || FONTS.jetbrains).family;
  if (!fam) return;
  try {
    await Promise.all([
      document.fonts.load(`400 14px "${fam}"`),
      document.fonts.load(`700 14px "${fam}"`),
    ]);
  } catch {}
}
// Imported font files load once per launch, from app data over IPC.
const loadedUserFonts = new Set();
async function loadUserFontFiles() {
  for (const f of settings.userFonts || []) {
    if (f.kind !== 'file' || loadedUserFonts.has(f.key)) continue;
    try {
      const b64 = await invoke('font_load', { file: f.file });
      const face = new FontFace(f.family, b64ToBytes(b64).buffer);
      await face.load();
      document.fonts.add(face);
      loadedUserFonts.add(f.key);
    } catch (err) {
      console.error('user font failed to load:', f.label, err);
    }
  }
}
// Installed-font probe: a real family renders at a different width than the
// generic fallback. (document.fonts.check lies for system fonts in WebKit.)
function fontInstalled(family) {
  const ctx = document.createElement('canvas').getContext('2d');
  const probe = 'mmmmwwwwiiiil10O#@PRISM';
  const widths = ['monospace', 'serif'].map((generic) => {
    ctx.font = `16px ${generic}`;
    const base = ctx.measureText(probe).width;
    ctx.font = `16px "${family.replace(/"/g, '')}", ${generic}`;
    return ctx.measureText(probe).width !== base;
  });
  return widths[0] || widths[1];
}
let settings = { ...DEFAULT_SETTINGS };
// Remappable actions: defaults here, user overrides live in settings.keys[id].
const DEFAULT_KEYMAP = {
  'new-tab':     { mods: 'meta', key: 't', label: 'New tab' },
  'close':       { mods: 'meta', key: 'w', label: 'Close pane / tab' },
  'split-right': { mods: 'meta', key: 'd', label: 'Split right' },
  'split-down':  { mods: 'meta+shift', key: 'd', label: 'Split down' },
  'zoom-pane':   { mods: 'meta+shift', key: 'enter', label: 'Zoom pane' },
  'broadcast':   { mods: 'meta+shift', key: 'b', label: 'Broadcast input' },
  'close-split': { mods: 'meta+shift', key: 'w', label: 'Close split pane' },
  'prev-tab':    { mods: 'meta+shift', key: '{', label: 'Previous tab' },
  'next-tab':    { mods: 'meta+shift', key: '}', label: 'Next tab' },
  'mission':     { mods: 'meta', key: 'e', label: 'Mission control' },
  'find':        { mods: 'meta', key: 'f', label: 'Find in scrollback' },
  'palette':     { mods: 'meta', key: 'p', label: 'Command palette' },
  'clear':       { mods: 'meta', key: 'k', label: 'Clear terminal' },
  'prev-prompt': { mods: 'meta', key: 'arrowup', label: 'Previous prompt' },
  'next-prompt': { mods: 'meta', key: 'arrowdown', label: 'Next prompt' },
  'artifacts':   { mods: 'meta+shift', key: 'a', label: 'Artifacts rail' },
  'settings':    { mods: 'meta', key: ',', label: 'Settings' },
  'font-up':     { mods: 'meta', key: '=', label: 'Text size up' },
  'font-down':   { mods: 'meta', key: '-', label: 'Text size down' },
  'font-reset':  { mods: 'meta', key: '0', label: 'Reset text size' },
};
const ACTION_RUN = {
  'new-tab': () => createTab(),
  'close': () => closeFocused(),
  'split-right': () => splitPane('row'),
  'split-down': () => splitPane('column'),
  'zoom-pane': () => toggleZoom(),
  'broadcast': () => toggleBroadcast(),
  'close-split': () => { if (activeTab && activeTab.panes.length > 1) closePane(activeTab, activeTab.active); },
  'prev-tab': () => cycleTab(-1),
  'next-tab': () => cycleTab(1),
  'mission': () => toggleMission(),
  'find': () => openFind(),
  'palette': () => togglePalette(),
  'clear': () => activePane()?.term.clear(),
  'prev-prompt': () => jumpPrompt(-1),
  'next-prompt': () => jumpPrompt(1),
  'artifacts': () => togglePanel(),
  'settings': () => toggleSettings(),
  'font-up': () => adjustFont(0.5),
  'font-down': () => adjustFont(-0.5),
  'font-reset': () => adjustFont(0),
};
// Bindings the recorder can't change: mouse gestures and OS-level keys.
const FIXED_KEYS = [
  ['⌘1…9', 'Jump to tab'],
  ['⌘ click path', 'Open file in editor'],
  ['⌥ scroll', 'Fast scroll'],
  ['right-click pane', 'Move pane to new tab'],
  ['double-click tab', 'Rename tab'], ['right-click tab', 'Split / group / tab menu'],
  ['click chip', 'Collapse or expand group'], ['right-click chip', 'Edit group'],
  ['drag tab', 'Reorder; drop into a group to join'],
  ['drag tab → pane', 'Split with the visible tab (drop on an edge)'],
];
function hotkeyOf(id) { return settings.keys[id] || DEFAULT_KEYMAP[id]; }
function comboOf(e) {
  const mods = [];
  if (e.metaKey) mods.push('meta');
  if (e.ctrlKey) mods.push('ctrl');
  if (e.altKey) mods.push('alt');
  if (e.shiftKey) mods.push('shift');
  let key = e.key.toLowerCase();
  if (key === '[') key = '{';
  if (key === ']') key = '}';
  if (key === '+') key = '=';
  return { mods: mods.join('+'), key };
}
const MOD_GLYPH = { ctrl: '⌃', alt: '⌥', shift: '⇧', meta: '⌘' };
const KEY_GLYPH = { enter: '↵', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→', backspace: '⌫', tab: '⇥', ' ': 'space' };
function fmtCombo(hk) {
  const mods = ['ctrl', 'alt', 'shift', 'meta']
    .filter((m) => hk.mods.split('+').includes(m))
    .map((m) => MOD_GLYPH[m]);
  const key = KEY_GLYPH[hk.key] || hk.key.toUpperCase();
  return [...mods, key].join(' ');
}
function kbdLabel(id) { return fmtCombo(hotkeyOf(id)); }
// OS-level summon shortcut: tauri-plugin-global-shortcut string format.
function globalKeyFromEvent(e) {
  const c = e.code;
  if (/^Key[A-Z]$/.test(c)) return c.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(c)) return c.slice(5);
  if (/^F[0-9]{1,2}$/.test(c)) return c.toLowerCase();
  const map = {
    Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']',
    Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
    Space: 'space', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    Enter: 'enter', Tab: 'tab',
  };
  return map[c] || null;
}
function globalShortcutFromEvent(e) {
  const key = globalKeyFromEvent(e);
  if (!key) return null;
  const mods = [];
  if (e.ctrlKey) mods.push('ctrl');
  if (e.altKey) mods.push('alt');
  if (e.shiftKey) mods.push('shift');
  if (e.metaKey) mods.push('cmd');
  if (!mods.length) return null;
  return [...mods, key].join('+');
}
function fmtGlobalShortcut(str) {
  const SYM = { ctrl: '⌃', alt: '⌥', shift: '⇧', cmd: '⌘', super: '⌘' };
  const KEYS = { space: 'space', up: '↑', down: '↓', left: '←', right: '→', enter: '↵', tab: '⇥' };
  return str.split('+').map((t) => SYM[t] || KEYS[t] || (t.length === 1 ? t.toUpperCase() : t)).join(' ');
}
async function applySummonShortcut(str) {
  await invoke('set_summon_shortcut', { shortcut: str });
}
function forEachPane(fn) { for (const t of tabs) for (const p of t.panes) fn(p, t); }
function applySettings(save) {
  const th = currentTheme();
  document.body.classList.toggle('light', !!th.light);
  document.body.style.background = th.light
    ? `rgba(246, 247, 249, ${settings.tint / 100})`
    : `rgba(10, 11, 16, ${settings.tint / 100})`;
  document.body.classList.toggle('glow-off', !settings.glow);
  forEachPane((p) => {
    p.term.options.fontFamily = termFont();
    p.term.options.fontSize = settings.fontSize;
    p.term.options.theme = termTheme();
    p.term.options.cursorStyle = settings.cursor;
    p.term.options.cursorBlink = settings.blink;
  });
  if (activeTab) fitTab(activeTab);
  setFont.value = settings.fontSize;
  setFontVal.textContent = `${settings.fontSize}`;
  setTint.value = settings.tint;
  setTintVal.textContent = `${settings.tint}%`;
  // WebKit has no native range progress fill; paint it via a CSS var.
  for (const r of [setFont, setTint]) {
    const pct = ((r.value - r.min) / (r.max - r.min)) * 100;
    r.style.setProperty('--pct', `${pct}%`);
  }
  setGlow.checked = settings.glow;
  setCursor.value = settings.cursor;
  setBlink.checked = settings.blink;
  setEditor.value = settings.editor;
  setFontFamily.value = settings.font;
  setThemes.querySelectorAll('.theme-card').forEach((c) => {
    c.classList.toggle('sel', c.dataset.theme === settings.theme);
  });
  if (save) try { localStorage.setItem('prism.settings', JSON.stringify(settings)); } catch {}
}
function buildThemeCards() {
  setThemes.replaceChildren();
  for (const [key, th] of Object.entries(allThemes())) {
    const card = document.createElement('div');
    card.className = 'theme-card';
    card.dataset.theme = key;
    card.style.setProperty('--tc-accent', th.colors.blue);
    const prev = document.createElement('div');
    prev.className = 'tc-preview';
    prev.style.background = th.bg;
    prev.style.color = th.colors.foreground;
    const l1 = document.createElement('div');
    l1.textContent = 'ls';
    const l2 = document.createElement('div');
    const dir = document.createElement('span'); dir.textContent = 'dir'; dir.style.color = th.colors.blue;
    const exe = document.createElement('span'); exe.textContent = ' executable'; exe.style.color = th.colors.red;
    const file = document.createElement('span'); file.textContent = ' file';
    l2.append(dir, exe, file);
    prev.append(l1, l2);
    const foot = document.createElement('div');
    foot.className = 'tc-foot';
    foot.style.background = th.light ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.3)';
    foot.style.color = th.light ? '#24292f' : '#e8e8ea';
    const name = document.createElement('span');
    name.textContent = th.label;
    const dots = document.createElement('span');
    dots.className = 'tc-dots';
    for (const c of [th.colors.blue, th.colors.magenta, th.colors.red]) {
      const d = document.createElement('span');
      d.style.background = c;
      dots.appendChild(d);
    }
    foot.append(name, dots);
    card.append(prev, foot);
    if (th.custom) {
      const del = document.createElement('span');
      del.className = 'tc-del';
      del.textContent = '×';
      del.title = 'Remove imported theme';
      del.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        settings.custom = settings.custom.filter((c) => c.key !== key);
        if (settings.theme === key) settings.theme = 'prism';
        buildThemeCards();
        applySettings(true);
      });
      card.appendChild(del);
    }
    card.addEventListener('mousedown', (e) => {
      e.preventDefault();
      settings.theme = key;
      applySettings(true);
    });
    setThemes.appendChild(card);
  }
}
let recordingId = null;
let recordingBtn = null;
function endRecord() {
  recordingId = null;
  recordingBtn = null;
  renderHotkeys();
}
function beginRecord(id, btn) {
  recordingId = id;
  recordingBtn = btn;
  btn.classList.add('rec');
  btn.textContent = 'press keys…';
}
function flashRecord(msg) {
  if (recordingBtn) recordingBtn.textContent = msg;
}
window.addEventListener('keydown', (e) => {
  if (!recordingId) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.key === 'Escape') { endRecord(); return; }
  if (['Meta', 'Shift', 'Control', 'Alt'].includes(e.key)) return;
  if (recordingId === '__summon') {
    const str = globalShortcutFromEvent(e);
    if (!str) { flashRecord('add ⌘ ⌃ or ⌥'); return; }
    applySummonShortcut(str)
      .then(() => {
        settings.summon = str;
        applySettings(true);
        endRecord();
      })
      .catch(() => flashRecord('not available'));
    return;
  }
  const combo = comboOf(e);
  if (!combo.mods || combo.mods === 'shift') { flashRecord('add ⌘ ⌃ or ⌥'); return; }
  const clash = Object.keys(DEFAULT_KEYMAP).find((oid) => {
    if (oid === recordingId) return false;
    const hk = hotkeyOf(oid);
    return hk.mods === combo.mods && hk.key === combo.key;
  });
  if (clash) { flashRecord(`used: ${DEFAULT_KEYMAP[clash].label}`); return; }
  const def = DEFAULT_KEYMAP[recordingId];
  if (def.mods === combo.mods && def.key === combo.key) delete settings.keys[recordingId];
  else settings.keys[recordingId] = combo;
  applySettings(true);
  endRecord();
}, true);
function renderHotkeys() {
  setKeys.replaceChildren();
  for (const [id, def] of Object.entries(DEFAULT_KEYMAP)) {
    const row = document.createElement('div');
    row.className = 'set-key';
    const l = document.createElement('span');
    l.textContent = def.label;
    const btn = document.createElement('button');
    btn.className = 'key-btn' + (settings.keys[id] ? ' custom' : '');
    btn.title = 'Click, then press the new shortcut (Esc cancels)';
    btn.textContent = fmtCombo(hotkeyOf(id));
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (recordingBtn) endRecord();
      beginRecord(id, btn);
    });
    row.append(l, btn);
    setKeys.appendChild(row);
  }
  {
    const row = document.createElement('div');
    row.className = 'set-key';
    const l = document.createElement('span');
    l.textContent = 'Summon PRISM (global)';
    const btn = document.createElement('button');
    btn.className = 'key-btn' + (settings.summon !== DEFAULT_SETTINGS.summon ? ' custom' : '');
    btn.title = 'Click, then press the new shortcut (Esc cancels)';
    btn.textContent = fmtGlobalShortcut(settings.summon);
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (recordingBtn) endRecord();
      beginRecord('__summon', btn);
    });
    row.append(l, btn);
    setKeys.appendChild(row);
  }
  for (const [keys, label] of FIXED_KEYS) {
    const row = document.createElement('div');
    row.className = 'set-key fixed';
    const l = document.createElement('span');
    l.textContent = label;
    const wrap = document.createElement('span');
    wrap.className = 'keys';
    const kbd = document.createElement('kbd');
    kbd.textContent = /^[⌘⇧⌃⌥]/.test(keys) && keys.length <= 5 ? [...keys].join(' ') : keys;
    wrap.appendChild(kbd);
    row.append(l, wrap);
    setKeys.appendChild(row);
  }
}
function loadSettings() {
  invoke('app_version').then((v) => { setVersion.textContent = 'PRISM ' + v; }).catch(() => {});
  try { settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('prism.settings') || '{}') }; } catch {}
  if (!allThemes()[settings.theme]) settings.theme = 'prism';
  if (!allFonts()[settings.font]) settings.font = 'jetbrains';
  buildThemeCards();
  renderFontOptions();
  renderUserFonts();
  renderHotkeys();
  applySettings(false);
}
function adjustFont(delta) {
  settings.fontSize = delta === 0
    ? DEFAULT_SETTINGS.fontSize
    : Math.min(20, Math.max(10, settings.fontSize + delta));
  applySettings(true);
}
// --- Updates -------------------------------------------------------------------
let pendingUpdate = null;
let notifiedVersion = null;
async function installPendingUpdate() {
  if (!pendingUpdate) return;
  setUpdate.textContent = `Downloading v${pendingUpdate.version}…`;
  try {
    await invoke('install_update'); // relaunches on success
  } catch {
    setUpdate.textContent = 'Update failed — retry';
  }
}
async function checkForUpdates(manual) {
  if (manual) setUpdate.textContent = 'Checking…';
  try {
    const u = await invoke('check_update');
    if (u) {
      pendingUpdate = u;
      setUpdate.textContent = `Install v${u.version} (restarts)`;
      setUpdate.classList.add('avail');
      settingsBtn.classList.add('update-avail'); // green dot on the gear
      if (!manual && notifiedVersion !== u.version) {
        notifiedVersion = u.version;
        invoke('notify_user', { title: `PRISM v${u.version} available`, body: 'Install from Settings (⌘,)' });
      }
    } else if (manual) {
      setUpdate.textContent = 'Up to date ✓';
      setTimeout(() => { if (!pendingUpdate) setUpdate.textContent = 'Check for updates'; }, 2500);
    }
  } catch (err) {
    if (manual) {
      setUpdate.textContent = 'Check failed — retry';
      setTimeout(() => { if (!pendingUpdate) setUpdate.textContent = 'Check for updates'; }, 3000);
    }
  }
}
setUpdate.addEventListener('mousedown', (e) => {
  e.preventDefault();
  if (pendingUpdate) installPendingUpdate();
  else checkForUpdates(true);
});
setTimeout(() => checkForUpdates(false), 8000); // quiet check shortly after launch
setInterval(() => checkForUpdates(false), 4 * 60 * 60 * 1000); // and every 4h while running

function toggleSettings() {
  settingsEl.classList.toggle('hidden');
  if (settingsEl.classList.contains('hidden')) activePane()?.term.focus();
}
settingsBtn.addEventListener('mousedown', (e) => { e.preventDefault(); toggleSettings(); });
// Modal chrome: sidebar nav switches panes, backdrop click closes, search filters nav.
const setNavBtns = [...document.querySelectorAll('.set-nav')];
function showSettingsPane(name) {
  for (const b of setNavBtns) b.classList.toggle('sel', b.dataset.pane === name);
  document.querySelectorAll('.set-section').forEach((s) => {
    s.classList.toggle('hidden', s.dataset.pane !== name);
  });
}
for (const b of setNavBtns) {
  b.addEventListener('mousedown', (e) => { e.preventDefault(); showSettingsPane(b.dataset.pane); });
}
settingsEl.addEventListener('mousedown', (e) => { if (e.target === settingsEl) toggleSettings(); });
document.getElementById('set-close').addEventListener('mousedown', (e) => { e.preventDefault(); toggleSettings(); });
// Sidebar "Check for updates" mirrors the Updates pane button's label and state.
const setUpdateSide = document.getElementById('set-update-side');
new MutationObserver(() => {
  setUpdateSide.textContent = setUpdate.textContent;
  setUpdateSide.classList.toggle('avail', setUpdate.classList.contains('avail'));
}).observe(setUpdate, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
setUpdateSide.addEventListener('mousedown', (e) => {
  e.preventDefault();
  if (pendingUpdate) installPendingUpdate();
  else checkForUpdates(true);
});
document.getElementById('set-keys-reset').addEventListener('mousedown', (e) => {
  e.preventDefault();
  if (recordingBtn) endRecord();
  settings.keys = {};
  if (settings.summon !== DEFAULT_SETTINGS.summon) {
    settings.summon = DEFAULT_SETTINGS.summon;
    applySummonShortcut(settings.summon).catch(() => {});
  }
  applySettings(true);
  renderHotkeys();
});
// Factory reset: wipe session + settings so tab numbering and state start fresh.
const setAppReset = document.getElementById('set-app-reset');
const APP_RESET_LABEL = setAppReset.textContent;
let appResetArmed = false;
setAppReset.addEventListener('mousedown', async (e) => {
  e.preventDefault();
  if (!appResetArmed) {
    appResetArmed = true;
    setAppReset.classList.add('armed');
    setAppReset.textContent = 'Click again to erase session + settings';
    setTimeout(() => {
      appResetArmed = false;
      setAppReset.classList.remove('armed');
      setAppReset.textContent = APP_RESET_LABEL;
    }, 4000);
    return;
  }
  forEachPane((p) => { try { invoke('pty_kill', { id: p.id }); } catch {} });
  try { localStorage.clear(); } catch {}
  try { await invoke('session_save', { data: '' }); } catch {}
  location.reload();
});
const setSearchInput = document.getElementById('set-search');
setSearchInput.addEventListener('input', () => {
  const q = setSearchInput.value.trim().toLowerCase();
  for (const b of setNavBtns) {
    b.style.display = !q || b.textContent.toLowerCase().includes(q) ? '' : 'none';
  }
});
setFont.addEventListener('input', () => { settings.fontSize = parseFloat(setFont.value); applySettings(true); });
setTint.addEventListener('input', () => { settings.tint = parseInt(setTint.value, 10); applySettings(true); });
setGlow.addEventListener('change', () => { settings.glow = setGlow.checked; applySettings(true); });
setCursor.addEventListener('change', () => { settings.cursor = setCursor.value; applySettings(true); });
setBlink.addEventListener('change', () => { settings.blink = setBlink.checked; applySettings(true); });
setEditor.addEventListener('change', () => { settings.editor = setEditor.value; applySettings(true); });
setFontFamily.addEventListener('change', async () => {
  settings.font = setFontFamily.value;
  await preloadTermFont(); // metrics must come from the real font, not the fallback
  applySettings(true);
});

// --- Custom fonts (Settings > Terminal) ----------------------------------------
const setUserFonts = document.getElementById('set-user-fonts');
const setFontAddFile = document.getElementById('set-font-add-file');
const setFontFile = document.getElementById('set-font-file');
const setFontSys = document.getElementById('set-font-sys');
const setFontSysAdd = document.getElementById('set-font-sys-add');
function renderFontOptions() {
  setFontFamily.replaceChildren();
  for (const [key, f] of Object.entries(allFonts())) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = f.label;
    setFontFamily.appendChild(opt);
  }
}
function renderUserFonts() {
  setUserFonts.replaceChildren();
  for (const f of settings.userFonts || []) {
    const row = document.createElement('div');
    row.className = 'uf-row';
    const name = document.createElement('span');
    name.className = 'uf-name';
    name.textContent = f.label;
    name.style.fontFamily = `'${f.family.replace(/'/g, '')}', monospace`;
    const kind = document.createElement('span');
    kind.className = 'uf-kind';
    kind.textContent = f.kind === 'file' ? 'imported' : 'system';
    const del = document.createElement('button');
    del.textContent = '×';
    del.title = 'Remove this font';
    del.addEventListener('mousedown', async (e) => {
      e.preventDefault();
      settings.userFonts = settings.userFonts.filter((u) => u.key !== f.key);
      if (f.kind === 'file') invoke('font_delete', { file: f.file }).catch(() => {});
      if (settings.font === f.key) settings.font = 'jetbrains';
      renderFontOptions();
      renderUserFonts();
      await preloadTermFont();
      applySettings(true);
    });
    row.append(name, kind, del);
    setUserFonts.appendChild(row);
  }
}
async function addUserFont(entry) {
  settings.userFonts = (settings.userFonts || []).filter((u) => u.key !== entry.key);
  settings.userFonts.push(entry);
  settings.font = entry.key;
  renderFontOptions();
  renderUserFonts();
  await loadUserFontFiles();
  await preloadTermFont();
  applySettings(true);
}
setFontAddFile.addEventListener('mousedown', (e) => { e.preventDefault(); setFontFile.click(); });
setFontFile.addEventListener('change', () => {
  const f = setFontFile.files?.[0];
  setFontFile.value = '';
  if (!f) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const bytes = new Uint8Array(reader.result);
    let b64 = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    b64 = btoa(b64);
    try {
      const stored = await invoke('font_save', { name: f.name, dataB64: b64 });
      const family = f.name.replace(/\.(ttf|otf|woff2?)$/i, '');
      await addUserFont({
        key: 'userfont-' + family.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        label: family, family, kind: 'file', file: stored,
      });
    } catch (err) {
      invoke('notify_user', { title: 'PRISM', body: 'Could not import that font: ' + err });
    }
  };
  reader.readAsArrayBuffer(f);
});
setFontSysAdd.addEventListener('mousedown', async (e) => {
  e.preventDefault();
  const family = setFontSys.value.trim();
  if (!family) return;
  if (!fontInstalled(family)) {
    invoke('notify_user', { title: 'PRISM', body: `"${family}" doesn't seem to be installed.` });
    return;
  }
  setFontSys.value = '';
  await addUserFont({
    key: 'userfont-' + family.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label: family, family, kind: 'system',
  });
});
setFontSys.addEventListener('keydown', (e) => {
  e.stopPropagation(); // plain typing must not trigger app hotkeys
  if (e.key === 'Enter') setFontSysAdd.dispatchEvent(new MouseEvent('mousedown'));
});

// --- Theme import: iTerm .itermcolors (plist XML) or Ghostty key=value ---------
function plistColor(dict) {
  const out = {};
  let key = null;
  for (const el of dict.children) {
    if (el.tagName === 'key') key = el.textContent;
    else if (el.tagName === 'real' && key) { out[key] = parseFloat(el.textContent); key = null; }
    else key = null;
  }
  const c = (v) => Math.round(Math.max(0, Math.min(1, v ?? 0)) * 255);
  return '#' + [c(out['Red Component']), c(out['Green Component']), c(out['Blue Component'])]
    .map((n) => n.toString(16).padStart(2, '0')).join('');
}
const ANSI_KEYS = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'];
function parseItermColors(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const root = doc.querySelector('plist > dict');
  if (!root) return null;
  const map = {};
  let key = null;
  for (const el of root.children) {
    if (el.tagName === 'key') key = el.textContent;
    else if (el.tagName === 'dict' && key) { map[key] = plistColor(el); key = null; }
  }
  const colors = {};
  ANSI_KEYS.forEach((k, i) => { colors[k] = map[`Ansi ${i} Color`] || '#888888'; });
  colors.foreground = map['Foreground Color'] || '#e8e8ea';
  colors.cursor = map['Cursor Color'] || colors.foreground;
  colors.selectionBackground = rgba(map['Selection Color'] || colors.blue, 0.35);
  return { colors, bg: map['Background Color'] || '#101216' };
}
function parseGhosttyTheme(text) {
  const map = {};
  const palette = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([\w-]+)\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    if (m[1] === 'palette') {
      const pm = m[2].match(/^(\d+)\s*=\s*(#?[0-9a-fA-F]{6})/);
      if (pm) palette[+pm[1]] = pm[2].startsWith('#') ? pm[2] : '#' + pm[2];
    } else {
      map[m[1]] = m[2].startsWith('#') ? m[2] : '#' + m[2].replace(/[^0-9a-fA-F]/g, '');
    }
  }
  if (Object.keys(palette).length < 8) return null;
  const colors = {};
  ANSI_KEYS.forEach((k, i) => { colors[k] = palette[i] || palette[i - 8] || '#888888'; });
  colors.foreground = map.foreground || '#e8e8ea';
  colors.cursor = map['cursor-color'] || colors.foreground;
  colors.selectionBackground = rgba(map['selection-background'] || colors.blue, 0.35);
  return { colors, bg: map.background || '#101216' };
}
setImport.addEventListener('mousedown', (e) => { e.preventDefault(); setImportFile.click(); });
setImportFile.addEventListener('change', () => {
  const f = setImportFile.files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result);
    const parsed = text.trimStart().startsWith('<') ? parseItermColors(text) : parseGhosttyTheme(text);
    if (!parsed) { invoke('notify_user', { title: 'PRISM', body: 'Could not read that theme file.' }); return; }
    const label = f.name.replace(/\.(itermcolors|conf|txt|theme)$/i, '');
    const key = 'custom-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    settings.custom = (settings.custom || []).filter((c) => c.key !== key);
    settings.custom.push({ key, label, custom: true, bg: parsed.bg, colors: parsed.colors });
    settings.theme = key;
    buildThemeCards();
    applySettings(true);
  };
  reader.readAsText(f);
  setImportFile.value = '';
});
document.getElementById('set-reset').addEventListener('mousedown', (e) => {
  e.preventDefault();
  settings = { ...DEFAULT_SETTINGS };
  renderFontOptions();
  renderUserFonts();
  applySettings(true);
});

// --- Glow -------------------------------------------------------------------
function syncGlow() {
  document.body.classList.toggle('coding', !!activeTab?.panes.some((p) => p.burstActive));
}
function tabState(t) {
  if (t.panes.length && t.panes.every((p) => p.exited)) return 'exited';
  if (t.panes.some((p) => p.burstActive)) return 'working';
  if (t.panes.some((p) => p.agentActive)) return 'ready';
  return 'idle';
}
function refreshTab(t) {
  const s = tabState(t);
  if (t.tabEl.dataset.state !== s) {
    t.tabEl.dataset.state = s;
    t.stateSince = Date.now();
  }
}
// The agent's spinner line stays painted on the live screen for the whole
// turn, so scanning the screen (not the output stream) keeps the glow steady.
function scanWork(p) {
  if (p.exited || !p.agentActive) return false;
  const buf = p.term.buffer.active;
  for (let i = p.term.rows - 1; i >= 0; i--) {
    const line = buf.getLine(buf.baseY + i);
    if (line && WORK_RE.test(line.translateToString(true))) return true;
  }
  return false;
}
setInterval(() => {
  for (const t of tabs) {
    let changed = false;
    for (const p of t.panes) {
      if (scanWork(p)) {
        p.workSeen = Date.now();
        if (!p.burstActive) { p.burstActive = true; changed = true; }
      } else if (p.burstActive && Date.now() - p.workSeen > WORK_HOLD_MS) {
        p.burstActive = false;
        changed = true;
        // agent went quiet but is still alive: it's probably waiting on you
        setTimeout(() => {
          if (!p.burstActive && p.agentActive && !p.exited) needsAttention(t, p);
        }, 2000);
      }
    }
    if (changed) { refreshTab(t); syncGlow(); }
  }
}, WORK_SCAN_MS);
function needsAttention(t, p) {
  if (t === activeTab && document.hasFocus()) return;
  if (!t.attention) {
    t.attention = true;
    t.tabEl.dataset.attention = '1';
    updateDockBadge();
    invoke('notify_user', {
      title: `${p.fgProcess || 'agent'} is waiting on you`,
      body: tilde(p.cwd || ''),
    });
  }
}
function clearAttention(t) {
  if (!t.attention) return;
  t.attention = false;
  delete t.tabEl.dataset.attention;
  updateDockBadge();
}
function updateDockBadge() {
  invoke('set_badge', { count: tabs.filter((t) => t.attention).length }).catch(() => {});
}
window.addEventListener('focus', () => { if (activeTab) clearAttention(activeTab); });
function clearWork(p, t) {
  p.burstActive = false; p.workSeen = 0;
  refreshTab(t); syncGlow();
}

// --- Footer -----------------------------------------------------------------
function renderFooter() {
  const p = activePane();
  if (!p) { fCwd.textContent = fBranch.textContent = fCmd.textContent = fProc.textContent = fUp.textContent = ''; return; }
  fCwd.textContent = p.cwd ? tilde(p.cwd) : '~';
  fBranch.textContent = p.branch || '';
  fBranch.style.display = p.branch ? 'inline-flex' : 'none';
  const lc = p.lastCmd;
  if (lc) {
    const ok = !lc.code;
    fCmd.textContent = `${ok ? '✓' : '✗' + lc.code} ${fmtDur(lc.dur)}`;
    fCmd.classList.toggle('err', !ok);
  }
  fCmd.style.display = lc ? 'inline-flex' : 'none';
  const proc = p.exited ? 'exited' : p.fgProcess || 'shell';
  fProc.textContent = activeTab.broadcast ? `broadcast · ${proc}` : proc;
  fUp.textContent = uptime(Date.now() - activeTab.startTime);
}

// --- App-facing protocol handlers (OSC 7 / 9 / 777) ---------------------------
function appNotify(p, title, body) {
  if (!document.hasFocus() || p !== activePane()) invoke('notify_user', { title, body });
}
function setTabProgress(t, state, pct) {
  const el = t.progEl;
  if (!state || Number.isNaN(state)) { el.style.display = 'none'; el.className = 'tab-progress'; return; }
  el.style.display = 'block';
  el.classList.toggle('err', state === 2);
  el.classList.toggle('indet', state === 3);
  el.style.width = state === 3 ? '100%' : `${Math.max(0, Math.min(100, pct))}%`;
}
function hookAppProtocols(t, p) {
  // OSC 7: cwd reporting (file:// URL) — instant, works over ssh, beats lsof polling.
  p.term.parser.registerOscHandler(7, (data) => {
    if (!data.startsWith('file://')) return true;
    let path = data.slice(7);
    const slash = path.indexOf('/');
    if (slash === -1) return true;
    path = path.slice(slash);
    try { path = decodeURIComponent(path); } catch {}
    if (path && p.cwd !== path) {
      p.cwd = path;
      if (p === activePane()) renderFooter();
      persistSession();
    }
    return true;
  });
  // OSC 9: ConEmu-style — "9;4;state;pct" is taskbar progress, anything else is a toast.
  p.term.parser.registerOscHandler(9, (data) => {
    if (data.startsWith('4;')) {
      const [, st, pr] = data.split(';');
      setTabProgress(t, parseInt(st, 10), parseInt(pr ?? '0', 10) || 0);
    } else if (data) {
      appNotify(p, 'Terminal', data);
    }
    return true;
  });
  // OSC 777: urxvt-style "notify;title;body".
  p.term.parser.registerOscHandler(777, (data) => {
    const parts = data.split(';');
    if (parts[0] === 'notify' && parts[1]) appNotify(p, parts[1], parts.slice(2).join(';'));
    return true;
  });
}

// --- Command history (OSC 633;E from the zsh preexec hook) --------------------
let recentCmds = [];
function recordCmd(cmd, cwd) {
  cmd = cmd.trim();
  if (!cmd || cmd.length > 300) return;
  recentCmds = recentCmds.filter((r) => r.cmd !== cmd);
  recentCmds.unshift({ cmd, cwd });
  if (recentCmds.length > 200) recentCmds.pop();
}

// --- Semantic prompts (OSC 133, emitted by the injected zsh hooks) -----------
function hookPromptMarks(p) {
  p.term.parser.registerOscHandler(633, (data) => {
    if (data.startsWith('E;')) recordCmd(data.slice(2), p.cwd);
    return true;
  });
  p.term.parser.registerOscHandler(133, (data) => {
    const kind = data[0];
    if (kind === 'A') { // prompt start
      const m = p.term.registerMarker(0);
      if (m) p.marks.push(m);
      if (p.marks.length > 400) p.marks.shift();
    } else if (kind === 'C') { // command output starts
      p.cmdStart = { time: Date.now(), marker: p.term.registerMarker(0) };
    } else if (kind === 'D' && p.cmdStart) { // command finished
      const code = data.length > 2 ? parseInt(data.slice(2), 10) || 0 : 0;
      p.lastCmd = {
        dur: Date.now() - p.cmdStart.time,
        code,
        startMarker: p.cmdStart.marker,
        endMarker: p.term.registerMarker(0),
      };
      p.cmdStart = null;
      onCommandEnd(p);
    }
    return true;
  });
}
function onCommandEnd(p) {
  if (p === activePane()) renderFooter();
  const lc = p.lastCmd;
  if (lc.dur >= NOTIFY_CMD_MS && (!document.hasFocus() || p !== activePane())) {
    invoke('notify_user', {
      title: 'Command finished',
      body: `${lc.code ? 'exit ' + lc.code : 'ok'} · ${fmtDur(lc.dur)} · ${tilde(p.cwd || '')}`,
    });
  }
}
function jumpPrompt(dir) {
  const p = activePane();
  if (!p) return;
  p.marks = p.marks.filter((m) => !m.isDisposed && m.line !== -1);
  if (!p.marks.length) return;
  const cur = p.term.buffer.active.viewportY;
  const lines = p.marks.map((m) => m.line).sort((a, b) => a - b);
  const target = dir < 0 ? [...lines].reverse().find((l) => l < cur) : lines.find((l) => l > cur);
  if (target != null) p.term.scrollToLine(target);
}
function copyLastOutput() {
  const p = activePane();
  const lc = p?.lastCmd;
  if (!lc || !lc.startMarker || lc.startMarker.line === -1 || lc.endMarker.line === -1) return;
  const buf = p.term.buffer.active;
  const out = [];
  for (let l = lc.startMarker.line; l < lc.endMarker.line; l++) {
    const line = buf.getLine(l);
    if (line) out.push(line.translateToString(true));
  }
  if (out.length) copyText(out.join('\n'));
}

// --- Artifacts rail ---------------------------------------------------------
function renderArtifacts(tab) {
  const p = tab.active;
  const arts = p?.artifacts ?? [];
  artCount.textContent = arts.length ? String(arts.length) : '';
  artCwd.textContent = p?.cwd ? tilde(p.cwd) : '';
  artList.replaceChildren();
  if (arts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'art-empty';
    empty.textContent = 'Files an agent writes or edits appear here.';
    artList.appendChild(empty);
    return;
  }
  for (const rec of arts) {
    const row = document.createElement('div');
    row.className = 'art-row';
    row.title = `${rec.path}\nClick to reveal in Finder`;
    const name = document.createElement('div');
    name.className = 'art-name';
    name.textContent = rec.path.split('/').pop() || rec.path;
    const meta = document.createElement('div');
    meta.className = 'art-meta';
    const dir = document.createElement('span');
    dir.className = 'art-dir';
    const full = tilde(rec.path);
    dir.textContent = full.slice(0, full.lastIndexOf('/') + 1) || full;
    const when = document.createElement('span');
    when.className = 'art-when';
    when.textContent = relTime(rec.time);
    meta.append(dir, when);
    const acts = document.createElement('div');
    acts.className = 'art-acts';
    const ql = document.createElement('button');
    ql.innerHTML = EYE_ICON;
    ql.title = 'Quick Look';
    ql.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); invoke('quicklook', { path: rec.path }); });
    const df = document.createElement('button');
    df.innerHTML = DIFF_ICON;
    df.title = 'Git diff';
    df.addEventListener('mousedown', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const out = await invoke('artifact_diff', { cwd: p?.cwd || HOME, path: rec.path });
      showDiff(rec.path, out);
    });
    acts.append(ql, df);
    row.append(name, meta, acts);
    row.addEventListener('click', () => invoke('artifact_reveal', { path: rec.path }));
    artList.appendChild(row);
  }
}
function updateArtBadge() {
  const n = activePane()?.artifacts.length ?? 0;
  artBadge.textContent = n ? String(n) : '';
  artBadge.style.display = n ? 'grid' : 'none';
}
function setPanel(open) {
  if (document.body.classList.contains('panel-open') === open) return;
  document.body.classList.toggle('panel-open', open);
  toggleArtBtn.classList.toggle('active', open);
  requestAnimationFrame(() => { if (activeTab) fitTab(activeTab); });
}
function togglePanel() {
  const opening = !document.body.classList.contains('panel-open');
  // manually closing a rail that has content means "stop auto-opening here"
  if (activeTab) activeTab.railDismissed = !opening && (activePane()?.artifacts.length ?? 0) > 0;
  setPanel(opening);
}

// --- Semantic history: Cmd-click a path to open it in your editor --------------
const PATH_TOKEN = /(?:~\/|\.{1,2}\/|\/)?[\w.@%+-]+(?:\/[\w.@%+-]+)+(?::\d+)?/g;
function hookPathLinks(pane) {
  pane.term.registerLinkProvider({
    provideLinks(row, cb) {
      const line = pane.term.buffer.active.getLine(row - 1);
      if (!line) return cb(undefined);
      const text = line.translateToString(true);
      const links = [];
      let m;
      PATH_TOKEN.lastIndex = 0;
      while ((m = PATH_TOKEN.exec(text))) {
        const token = m[0];
        if (token.startsWith('http')) continue;
        links.push({
          range: { start: { x: m.index + 1, y: row }, end: { x: m.index + token.length, y: row } },
          text: token,
          activate(ev) {
            if (!ev.metaKey) return; // Cmd-click only, plain clicks stay in the terminal
            const lm = token.match(/^(.*?):(\d+)$/);
            invoke('open_in_editor', {
              cwd: pane.cwd || HOME,
              path: lm ? lm[1] : token,
              line: lm ? parseInt(lm[2], 10) : null,
              editor: settings.editor,
            });
          },
        });
      }
      cb(links.length ? links : undefined);
    },
  });
}

// --- Panes (splits) -----------------------------------------------------------
async function createPane(tab, startCwd) {
  const el = document.createElement('div');
  el.className = 'split-cell';
  const termEl = document.createElement('div');
  termEl.className = 'term';
  el.appendChild(termEl);
  tab.paneEl.appendChild(el);

  const term = new Terminal({
    allowProposedApi: true, // the unicode-graphemes addon registers via proposed API
    minimumContrastRatio: 4.5, // keep inverse/dim text readable on the translucent glass
    allowTransparency: true, fontFamily: termFont(),
    fontSize: settings.fontSize, lineHeight: 1.2,
    cursorBlink: settings.blink, cursorStyle: settings.cursor,
    scrollback: 10000, theme: termTheme(),
    scrollSensitivity: 8, fastScrollSensitivity: 20, fastScrollModifier: 'alt',
  });
  const fit = new FitAddon.FitAddon();
  const search = new SearchAddon.SearchAddon();
  term.loadAddon(fit);
  term.loadAddon(search);
  term.loadAddon(new ClipboardAddon.ClipboardAddon()); // OSC 52: remote/tmux copy
  term.loadAddon(new ImageAddon.ImageAddon()); // sixel + iTerm inline images
  term.loadAddon(new UnicodeGraphemesAddon.UnicodeGraphemesAddon());
  term.loadAddon(new WebLinksAddon.WebLinksAddon((_e, uri) => invoke('open_url', { url: uri })));
  term.unicode.activeVersion = '15-graphemes';
  term.open(termEl);
  try {
    const webgl = new WebglAddon.WebglAddon();
    webgl.onContextLoss(() => webgl.dispose()); // xterm falls back to the DOM renderer
    term.loadAddon(webgl);
  } catch { /* DOM renderer fallback */ }
  fit.fit();

  let id;
  try {
    id = await invoke('pty_spawn', { cwd: startCwd ?? null, rows: term.rows, cols: term.cols });
  } catch (err) {
    term.dispose();
    el.remove();
    console.error('pty_spawn failed:', err);
    return null;
  }

  const pane = {
    id, term, fit, search, el, tab, parent: null, // parent = split node, null at layout root
    exited: false, fgProcess: '', agentActive: false,
    cwd: startCwd || '', branch: '', burstActive: false, workSeen: 0,
    marks: [], cmdStart: null, lastCmd: null, artifacts: [],
  };
  hookPromptMarks(pane);
  hookAppProtocols(tab, pane);
  hookPathLinks(pane);
  hookKitty(pane);
  search.onDidChangeResults(({ resultIndex, resultCount }) => {
    if (pane === activePane() && !findBar.classList.contains('hidden')) {
      findCount.textContent = resultCount ? `${resultIndex + 1}/${resultCount}` : '0/0';
    }
  });
  term.onData((d) => {
    invoke('pty_write', { id, data: d });
    const ot = pane.tab;
    if (ot.broadcast && pane === ot.active) {
      for (const p2 of ot.panes) {
        if (p2 !== pane && !p2.exited) invoke('pty_write', { id: p2.id, data: d });
      }
    }
  });
  term.onTitleChange((title) => {
    const ot = pane.tab;
    if (!title || pane !== ot.active) return;
    ot.autoTitle = title;
    if (!ot.customTitle && !ot.renaming) ot.titleEl.textContent = title;
  });
  el.addEventListener('mousedown', () => {
    if (pane.tab === activeTab && pane.tab.active !== pane) setActivePane(pane.tab, pane);
  });
  // right-click a split pane: move it out or close it
  el.addEventListener('contextmenu', (e) => {
    if (pane.tab.panes.length < 2) return; // single pane leaves right-click to the terminal
    e.preventDefault();
    e.stopPropagation();
    openPaneMenu(pane, e.clientX, e.clientY);
  });
  return pane;
}
function setActivePane(tab, pane) {
  tab.active = pane;
  for (const p of tab.panes) p.el.classList.toggle('focused', p === pane);
  if (tab === activeTab) {
    invoke('set_active', { id: pane.id });
    renderFooter();
    renderArtifacts(tab);
    updateArtBadge();
    pane.term.focus();
  }
}
// Splits are a tree: a tab's layout is either a pane (leaf) or a split node
// { split: 'row'|'column', el, children, parent } whose children are panes or
// further nodes. Mixed directions nest, so 2x2 grids and tmux-style layouts
// work. renderLayout() re-syncs the DOM (order + dividers) from the tree.
function isPane(n) { return !!n.term; }
function makeNode(dir) {
  const el = document.createElement('div');
  el.className = 'split-box';
  el.style.flexDirection = dir;
  return { split: dir, el, children: [], parent: null };
}
function firstPane(n) { return isPane(n) ? n : firstPane(n.children[0]); }
function renderLayout(tab) {
  if (!tab.layout) return;
  tab.paneEl.querySelectorAll('.split-divider').forEach((d) => d.remove());
  const place = (n, parentEl) => {
    parentEl.appendChild(n.el);
    if (isPane(n)) return;
    n.el.style.flexDirection = n.split;
    for (const c of n.children) place(c, n.el);
    syncNodeDividers(tab, n);
  };
  place(tab.layout, tab.paneEl);
  tab.paneEl.style.flexDirection = isPane(tab.layout) ? 'row' : tab.layout.split;
  const single = isPane(tab.layout);
  tab.paneEl.classList.toggle('multi', !single);
  if (single) {
    tab.broadcast = false;
    tab.paneEl.classList.remove('broadcast');
    tab.layout.el.style.flexGrow = '';
  }
}
function syncNodeDividers(tab, node) {
  for (let i = 0; i < node.children.length - 1; i++) {
    const div = document.createElement('div');
    div.className = 'split-divider ' + (node.split === 'row' ? 'h' : 'v');
    div.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const col = node.split === 'column';
      const prev = node.children[i], next = node.children[i + 1];
      if (!prev || !next) return;
      const pr = prev.el.getBoundingClientRect(), nr = next.el.getBoundingClientRect();
      const total = (col ? pr.height + nr.height : pr.width + nr.width);
      const growSum = (parseFloat(prev.el.style.flexGrow) || 1) + (parseFloat(next.el.style.flexGrow) || 1);
      const start = col ? pr.top : pr.left;
      let raf = null;
      const move = (ev) => {
        const pos = (col ? ev.clientY : ev.clientX) - start;
        const frac = Math.max(0.15, Math.min(0.85, pos / total));
        prev.el.style.flexGrow = (frac * growSum).toFixed(3);
        next.el.style.flexGrow = ((1 - frac) * growSum).toFixed(3);
        if (!raf) raf = requestAnimationFrame(() => { raf = null; fitTab(tab); });
      };
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        fitTab(tab);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    });
    node.children[i].el.after(div);
  }
}
// Put `addition` beside `target`: joins the parent when directions match,
// otherwise wraps the target in a new split node.
function placePane(target, addition, dir, before) {
  const tab = target.tab;
  const parent = target.parent;
  if (parent && parent.split === dir) {
    const idx = parent.children.indexOf(target);
    parent.children.splice(before ? idx : idx + 1, 0, addition);
    addition.parent = parent;
  } else {
    const node = makeNode(dir);
    node.el.style.flexGrow = target.el.style.flexGrow || '';
    if (parent) {
      parent.children[parent.children.indexOf(target)] = node;
      node.parent = parent;
    } else {
      tab.layout = node;
    }
    target.el.style.flexGrow = '';
    node.children.push(target, addition);
    if (before) node.children.reverse();
    target.parent = node;
    addition.parent = node;
  }
  addition.el.style.flexGrow = '';
  renderLayout(tab);
}
// Pull a pane out of the tree, collapsing now-single-child wrappers.
function detachPane(pane) {
  const tab = pane.tab;
  const parent = pane.parent;
  pane.parent = null;
  pane.el.remove();
  if (!parent) { tab.layout = null; return; }
  parent.children.splice(parent.children.indexOf(pane), 1);
  if (parent.children.length > 1) { renderLayout(tab); return; }
  const child = parent.children[0];
  const gp = parent.parent;
  child.el.style.flexGrow = parent.el.style.flexGrow || '';
  parent.el.remove();
  if (gp) {
    gp.children[gp.children.indexOf(parent)] = child;
    child.parent = gp;
  } else {
    tab.layout = child;
    child.parent = null;
  }
  renderLayout(tab);
}
// Zoom hides every cell (and box) off the focused pane's ancestor path.
function applyZoom(t) {
  t.paneEl.classList.toggle('zoomed', t.zoom);
  const keep = new Set();
  if (t.zoom) { let n = t.active; while (n) { keep.add(n); n = n.parent; } }
  const walk = (n) => {
    n.el.classList.toggle('z-hide', t.zoom && !keep.has(n));
    if (!isPane(n)) n.children.forEach(walk);
  };
  if (t.layout) walk(t.layout);
  fitTab(t);
}
function exitZoom(t) {
  if (!t.zoom) return;
  t.zoom = false;
  applyZoom(t);
}
function toggleZoom() {
  const t = activeTab;
  if (!t || t.panes.length < 2) return;
  t.zoom = !t.zoom;
  applyZoom(t);
}
function toggleBroadcast() {
  const t = activeTab;
  if (!t) return;
  t.broadcast = !t.broadcast;
  t.paneEl.classList.toggle('broadcast', t.broadcast);
  renderFooter();
}
// Cmd+D / Cmd+Shift+D: split the focused pane (any direction, grids nest).
async function splitPane(dir) {
  const t = activeTab;
  if (!t || !ready) return;
  const target = t.active;
  if (!target || t.panes.length >= MAX_PANES) return;
  exitZoom(t);
  const pane = await createPane(t, target.cwd || null);
  if (!pane) return;
  t.panes.push(pane);
  placePane(target, pane, dir, false);
  setActivePane(t, pane);
  fitTab(t);
  refreshTab(t);
}
function closePane(tab, pane) {
  exitZoom(tab);
  if (!pane.exited) invoke('pty_kill', { id: pane.id });
  pane.term.dispose();
  const idx = tab.panes.indexOf(pane);
  if (idx !== -1) tab.panes.splice(idx, 1);
  detachPane(pane);
  if (!tab.panes.length) { removeTab(tab); return; }
  if (tab.active === pane) setActivePane(tab, tab.panes[Math.max(0, idx - 1)]);
  fitTab(tab);
  refreshTab(tab);
  syncGlow();
}

// --- Tab groups ---------------------------------------------------------------
function tabGroup(t) { return t.groupId != null ? groups.get(t.groupId) : null; }
function styleTabGroup(t) {
  const g = tabGroup(t);
  t.tabEl.style.borderColor = g ? rgba(g.color, 0.55) : '';
  t.tabEl.classList.toggle('collapsed', !!g?.collapsed);
}
function updateChip(g) {
  if (!g.chipEl) return;
  g.chipEl.classList.toggle('unnamed', !g.name);
  g.chipEl.textContent = g.name;
  g.chipEl.title = g.name || 'Unnamed group';
  if (g.name) {
    g.chipEl.style.background = rgba(g.color, 0.18);
    g.chipEl.style.borderColor = rgba(g.color, 0.5);
    g.chipEl.style.color = g.color;
  } else {
    g.chipEl.style.background = g.color;
    g.chipEl.style.borderColor = 'transparent';
  }
}
function makeChip(g) {
  const el = document.createElement('div');
  el.className = 'group-chip';
  // Chrome behavior: click collapses/expands, right-click edits.
  el.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 0) toggleCollapse(g);
  });
  el.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); openGroupEditor(g); });
  g.chipEl = el;
  updateChip(g);
  return el;
}
// Collapse only toggles classes — renderStrip() re-appends nodes, which would
// reset the CSS transition mid-animation.
function restyleTabs() { for (const t of tabs) styleTabGroup(t); }
async function toggleCollapse(g) {
  g.collapsed = !g.collapsed;
  if (g.collapsed && activeTab?.groupId === g.id) {
    // the active tab is vanishing; move to the nearest visible tab outside the group
    const vis = tabs.filter((t) => t.groupId !== g.id && !tabGroup(t)?.collapsed);
    if (!vis.length) {
      // like Chrome: when the group holds every tab, open a fresh one so the
      // collapse can proceed instead of silently refusing
      await createTab();
      restyleTabs();
      persistSession();
      return;
    }
    const idx = tabs.indexOf(activeTab);
    const next = vis.reduce((best, t) =>
      Math.abs(tabs.indexOf(t) - idx) < Math.abs(tabs.indexOf(best) - idx) ? t : best);
    restyleTabs();
    activateTab(next);
  } else {
    restyleTabs();
  }
  persistSession();
}
// Reorder the strip DOM: each group's chip before its first tab, + button last.
function renderStrip() {
  const seen = new Set();
  for (const t of tabs) {
    const g = tabGroup(t);
    if (g && !seen.has(g.id)) {
      seen.add(g.id);
      tabsEl.appendChild(g.chipEl || makeChip(g));
    }
    tabsEl.appendChild(t.tabEl);
    styleTabGroup(t);
  }
  for (const [id, g] of groups) if (!seen.has(id) && g.chipEl) g.chipEl.remove();
  tabsEl.appendChild(newTabBtn);
}
// Move a tab next to its new group's members (keeps groups contiguous).
function assignGroup(tab, gid) {
  tab.groupId = gid;
  const from = tabs.indexOf(tab);
  tabs.splice(from, 1);
  let insert = from;
  for (let i = tabs.length - 1; i >= 0; i--) {
    if (tabs[i].groupId === gid) { insert = i + 1; break; }
  }
  tabs.splice(Math.min(insert, tabs.length), 0, tab);
  renderStrip();
  persistSession();
}
function removeFromGroup(tab) {
  const gid = tab.groupId;
  tab.groupId = null;
  // step out just past the group so the block stays contiguous
  const from = tabs.indexOf(tab);
  tabs.splice(from, 1);
  let insert = from;
  for (let i = tabs.length - 1; i >= 0; i--) {
    if (tabs[i].groupId === gid) { insert = i + 1; break; }
  }
  tabs.splice(insert, 0, tab);
  dropGroupIfEmpty(gid);
  renderStrip();
  persistSession();
}
function dropGroupIfEmpty(gid) {
  if (gid == null || tabs.some((t) => t.groupId === gid)) return;
  const g = groups.get(gid);
  if (g?.chipEl) g.chipEl.remove();
  groups.delete(gid);
}
function createGroupWith(tab) {
  const used = new Set([...groups.values()].map((g) => g.color));
  const color = GROUP_COLORS.find((c) => !used.has(c)) || GROUP_COLORS[groups.size % GROUP_COLORS.length];
  const g = { id: ++groupCounter, name: '', color, collapsed: false, chipEl: null };
  groups.set(g.id, g);
  assignGroup(tab, g.id);
  openGroupEditor(g); // name it right away, like Chrome
}

// Group editor popover.
let editingGroup = null;
function openGroupEditor(g) {
  closeCtxMenu();
  editingGroup = g;
  geName.value = g.name;
  geColors.replaceChildren();
  for (const c of GROUP_COLORS) {
    const dot = document.createElement('div');
    dot.className = 'ge-color' + (c === g.color ? ' sel' : '');
    dot.style.background = c;
    dot.addEventListener('mousedown', (e) => {
      e.preventDefault();
      g.color = c;
      updateChip(g);
      restyleTabs();
      geColors.querySelectorAll('.ge-color').forEach((d) => d.classList.toggle('sel', d === dot));
      persistSession();
    });
    geColors.appendChild(dot);
  }
  groupEditor.classList.remove('hidden');
  const r = (g.chipEl || tabsEl).getBoundingClientRect();
  groupEditor.style.left = `${Math.min(r.left, window.innerWidth - 270)}px`;
  groupEditor.style.top = `${r.bottom + 8}px`;
  geName.focus();
  geName.select();
}
function closeGroupEditor() {
  if (groupEditor.classList.contains('hidden')) return;
  groupEditor.classList.add('hidden');
  editingGroup = null;
  activePane()?.term.focus();
}
geName.addEventListener('input', () => {
  if (!editingGroup) return;
  editingGroup.name = geName.value.trim();
  updateChip(editingGroup);
  persistSession();
});
geName.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); closeGroupEditor(); } });
geUngroup.addEventListener('mousedown', (e) => {
  e.preventDefault();
  const g = editingGroup;
  if (!g) return;
  for (const t of tabs) if (t.groupId === g.id) t.groupId = null;
  dropGroupIfEmpty(g.id);
  closeGroupEditor();
  renderStrip();
  persistSession();
});

// --- Tab drag: reorder, and join/leave groups by where you drop ---------------
const dropIndicator = document.getElementById('drop-indicator');
const splitDropEl = document.getElementById('split-drop');
let drag = null;
function beginTabDrag(tab, e) {
  // target = the tab whose panes are on screen (activation happens on mouseup,
  // so dragging a background tab leaves the current tab visible under it)
  drag = {
    tab, startX: e.clientX, startY: e.clientY, started: false,
    overChip: null, insert: null,
    target: activeTab !== tab ? activeTab : null,
    splitTarget: null, splitDir: null, splitBefore: false,
  };
  window.addEventListener('mousemove', onTabDragMove);
  window.addEventListener('mouseup', endTabDrag, { once: true });
}
// Dragging over a pane shows which half of it the dropped tab would occupy.
function updateSplitDrop(e) {
  const d = drag;
  d.splitTarget = null;
  d.splitDir = null;
  const t = d.target;
  if (!t || !tabs.includes(t) || d.tab.panes.length !== 1 || t.panes.length >= MAX_PANES) {
    splitDropEl.classList.add('hidden');
    return false;
  }
  let hov = null;
  for (const p of t.panes) {
    const r = p.el.getBoundingClientRect();
    if (r.width && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      hov = { p, r };
      break;
    }
  }
  if (!hov) {
    splitDropEl.classList.add('hidden');
    return false;
  }
  const dx = (e.clientX - hov.r.left) / hov.r.width;
  const dy = (e.clientY - hov.r.top) / hov.r.height;
  const zone = [['left', dx], ['right', 1 - dx], ['top', dy], ['bottom', 1 - dy]]
    .sort((a, b) => a[1] - b[1])[0][0];
  d.splitTarget = hov.p;
  d.splitDir = zone === 'left' || zone === 'right' ? 'row' : 'column';
  d.splitBefore = zone === 'left' || zone === 'top';
  const half = { left: hov.r.left, top: hov.r.top, width: hov.r.width, height: hov.r.height };
  if (d.splitDir === 'row') {
    half.width /= 2;
    if (zone === 'right') half.left += half.width;
  } else {
    half.height /= 2;
    if (zone === 'bottom') half.top += half.height;
  }
  splitDropEl.style.left = `${half.left}px`;
  splitDropEl.style.top = `${half.top}px`;
  splitDropEl.style.width = `${half.width}px`;
  splitDropEl.style.height = `${half.height}px`;
  splitDropEl.classList.remove('hidden');
  return true;
}
function onTabDragMove(e) {
  if (!drag) return;
  if (!drag.started) {
    if (Math.abs(e.clientX - drag.startX) < 6 && Math.abs(e.clientY - drag.startY) < 6) return;
    drag.started = true;
    document.body.classList.add('tab-dragging');
    drag.tab.tabEl.classList.add('drag-src');
  }
  // below the strip: offer drop-to-split on the visible tab's panes
  if (updateSplitDrop(e)) {
    for (const g of groups.values()) g.chipEl?.classList.remove('drop-target');
    dropIndicator.style.display = 'none';
    drag.overChip = null;
    drag.insert = null;
    return;
  }
  // hovering a group chip means "drop into this group"
  drag.overChip = null;
  for (const g of groups.values()) {
    if (!g.chipEl?.isConnected) continue;
    g.chipEl.classList.remove('drop-target');
    const r = g.chipEl.getBoundingClientRect();
    if (e.clientY >= r.top - 6 && e.clientY <= r.bottom + 6 && e.clientX >= r.left && e.clientX <= r.right) {
      drag.overChip = g;
    }
  }
  if (drag.overChip) {
    drag.overChip.chipEl.classList.add('drop-target');
    dropIndicator.style.display = 'none';
    drag.insert = null;
    return;
  }
  // otherwise find the insertion slot among visible tabs
  const slots = tabs
    .filter((t) => t !== drag.tab && !tabGroup(t)?.collapsed)
    .map((t) => ({ t, r: t.tabEl.getBoundingClientRect() }));
  let index = slots.length;
  for (let i = 0; i < slots.length; i++) {
    if (e.clientX < slots[i].r.left + slots[i].r.width / 2) { index = i; break; }
  }
  drag.insert = { index, slots };
  const stripR = tabsEl.getBoundingClientRect();
  const x = index < slots.length
    ? slots[index].r.left - 4
    : slots.length ? slots[slots.length - 1].r.right + 2 : stripR.left + 4;
  dropIndicator.style.display = 'block';
  dropIndicator.style.left = `${x}px`;
  dropIndicator.style.top = `${stripR.top + 7}px`;
  dropIndicator.style.height = `${stripR.height - 14}px`;
}
function endTabDrag() {
  window.removeEventListener('mousemove', onTabDragMove);
  const d = drag;
  drag = null;
  if (!d) return;
  dropIndicator.style.display = 'none';
  splitDropEl.classList.add('hidden');
  document.body.classList.remove('tab-dragging');
  d.tab.tabEl.classList.remove('drag-src');
  for (const g of groups.values()) g.chipEl?.classList.remove('drop-target');
  if (!d.started) {
    if (tabs.includes(d.tab)) activateTab(d.tab); // plain click: activate on mouseup
    return;
  }
  if (d.splitTarget && d.splitDir) {
    mergeTabAsSplit(d.tab, d.target, d.splitTarget, d.splitDir, d.splitBefore);
    return;
  }
  const tab = d.tab;
  const oldGid = tab.groupId;
  if (d.overChip) {
    // dropped on a chip: join at the front of that group
    tab.groupId = d.overChip.id;
    tabs.splice(tabs.indexOf(tab), 1);
    const first = tabs.findIndex((t) => t.groupId === d.overChip.id);
    tabs.splice(first === -1 ? tabs.length : first, 0, tab);
  } else if (d.insert) {
    const { index, slots } = d.insert;
    const prev = index > 0 ? slots[index - 1].t : null;
    const next = index < slots.length ? slots[index].t : null;
    // landing between two tabs of the same group joins it; anywhere else leaves
    tab.groupId = prev && next && prev.groupId != null && prev.groupId === next.groupId
      ? prev.groupId : null;
    tabs.splice(tabs.indexOf(tab), 1);
    const pos = next ? tabs.indexOf(next) : prev ? tabs.indexOf(prev) + 1 : 0;
    tabs.splice(pos, 0, tab);
  }
  if (tab.groupId !== oldGid) dropGroupIfEmpty(oldGid);
  renderStrip();
  activateTab(tab); // a dropped tab ends up active, like Chrome
  persistSession();
}

// Rename a tab inline (double-click or context menu). Empty name reverts to
// the shell-reported title.
function startRename(tab) {
  if (tab.renaming) return;
  tab.renaming = true;
  const input = document.createElement('input');
  input.className = 'tab-rename';
  input.value = tab.customTitle || '';
  input.placeholder = tab.autoTitle;
  input.spellcheck = false;
  tab.titleEl.replaceChildren(input);
  input.focus();
  input.select();
  const commit = (save) => {
    if (!tab.renaming) return;
    tab.renaming = false;
    if (save) tab.customTitle = input.value.trim() || null;
    tab.titleEl.textContent = tab.customTitle || tab.autoTitle;
    persistSession();
    tab.active?.term.focus();
  };
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') commit(true);
    else if (e.key === 'Escape') commit(false);
  });
  input.addEventListener('blur', () => commit(true));
  input.addEventListener('mousedown', (e) => e.stopPropagation());
}

// Tab context menu.
function ctxItem(label, onPick, color) {
  const row = document.createElement('div');
  row.className = 'ctx-item';
  if (color) {
    const dot = document.createElement('span');
    dot.className = 'ctx-dot';
    dot.style.background = color;
    row.appendChild(dot);
  }
  const text = document.createElement('span');
  text.textContent = label;
  row.appendChild(text);
  row.addEventListener('mousedown', (e) => { e.preventDefault(); closeCtxMenu(); onPick(); });
  return row;
}
function openTabMenu(tab, x, y) {
  closeGroupEditor();
  ctxMenu.replaceChildren();
  ctxMenu.appendChild(ctxItem('Rename tab', () => startRename(tab)));
  // Splits act on the clicked tab's focused pane (activating the tab first).
  if (tab.panes.length < MAX_PANES && !tab.panes.every((p) => p.exited)) {
    ctxMenu.appendChild(Object.assign(document.createElement('div'), { className: 'ctx-sep' }));
    ctxMenu.appendChild(ctxItem('Split right', () => { activateTab(tab); splitPane('row'); }));
    ctxMenu.appendChild(ctxItem('Split down', () => { activateTab(tab); splitPane('column'); }));
  }
  ctxMenu.appendChild(Object.assign(document.createElement('div'), { className: 'ctx-sep' }));
  ctxMenu.appendChild(ctxItem('Add to new group', () => createGroupWith(tab)));
  for (const g of groups.values()) {
    if (g.id === tab.groupId) continue;
    ctxMenu.appendChild(ctxItem(`Add to "${g.name || 'unnamed'}"`, () => assignGroup(tab, g.id), g.color));
  }
  if (tab.groupId != null) {
    ctxMenu.appendChild(ctxItem('Remove from group', () => removeFromGroup(tab)));
  }
  ctxMenu.appendChild(Object.assign(document.createElement('div'), { className: 'ctx-sep' }));
  ctxMenu.appendChild(ctxItem('Close tab', () => closeTab(tab)));
  ctxMenu.classList.remove('hidden');
  const w = ctxMenu.offsetWidth, h = ctxMenu.offsetHeight;
  ctxMenu.style.left = `${Math.min(x, window.innerWidth - w - 8)}px`;
  ctxMenu.style.top = `${Math.min(y, window.innerHeight - h - 8)}px`;
}
function closeCtxMenu() { ctxMenu.classList.add('hidden'); }
window.addEventListener('mousedown', (e) => {
  if (!settingsEl.classList.contains('hidden') && !settingsEl.contains(e.target)
      && !settingsBtn.contains(e.target)) toggleSettings();
  if (!ctxMenu.classList.contains('hidden') && !ctxMenu.contains(e.target)) closeCtxMenu();
  if (!groupEditor.classList.contains('hidden') && !groupEditor.contains(e.target)
      && !(editingGroup?.chipEl?.contains(e.target))) closeGroupEditor();
}, true);

// --- Tabs -------------------------------------------------------------------
function newTabShell() {
  tabCounter += 1;
  const label = `Session ${tabCounter}`;

  const paneEl = document.createElement('div');
  paneEl.className = 'pane';
  panesEl.appendChild(paneEl);

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  const dotEl = document.createElement('span'); dotEl.className = 'dot';
  const titleEl = document.createElement('span'); titleEl.className = 'tab-title'; titleEl.textContent = label;
  const closeEl = document.createElement('span'); closeEl.className = 'tab-close'; closeEl.innerHTML = X_ICON;
  const progEl = document.createElement('span'); progEl.className = 'tab-progress';
  tabEl.append(dotEl, titleEl, closeEl, progEl);

  const tab = {
    panes: [], active: null, layout: null, zoom: false, broadcast: false,
    paneEl, tabEl, titleEl, progEl,
    startTime: Date.now(), stateSince: Date.now(),
    groupId: null, railDismissed: false,
    autoTitle: label, customTitle: null, renaming: false,
  };
  tabs.push(tab);
  tabsEl.insertBefore(tabEl, newTabBtn); // the + button stays after the last tab

  tabEl.addEventListener('mousedown', (e) => {
    if (closeEl.contains(e.target) || tab.renaming) return;
    // activation waits for mouseup (endTabDrag): a drag keeps the current
    // tab visible so the dragged tab can be dropped into it as a split
    if (e.button === 0) beginTabDrag(tab, e);
  });
  closeEl.addEventListener('mousedown', (e) => { e.stopPropagation(); closeTab(tab); });
  tabEl.addEventListener('contextmenu', (e) => { e.preventDefault(); openTabMenu(tab, e.clientX, e.clientY); });
  tabEl.addEventListener('dblclick', (e) => { if (!closeEl.contains(e.target)) startRename(tab); });
  return tab;
}

async function createTab(startCwd) {
  const tab = newTabShell();
  const pane = await createPane(tab, startCwd ?? activePane()?.cwd ?? null);
  if (!pane) {
    tab.paneEl.remove();
    tab.tabEl.remove();
    const i = tabs.indexOf(tab);
    if (i !== -1) tabs.splice(i, 1);
    return;
  }
  tab.panes.push(pane);
  tab.layout = pane;
  renderLayout(tab);
  tab.active = pane;
  pane.el.classList.add('focused');
  refreshTab(tab);
  activateTab(tab);
  persistSession();
}

// Pop a split pane out into its own standalone tab.
function movePaneToNewTab(srcTab, pane) {
  if (!srcTab || srcTab.panes.length < 2) return;
  exitZoom(srcTab);
  closeCtxMenu();
  srcTab.panes = srcTab.panes.filter((p) => p !== pane);
  detachPane(pane); // collapses the source tree around the gap
  const dst = newTabShell();
  pane.tab = dst;
  pane.el.style.flexGrow = '';
  dst.layout = pane;
  dst.panes.push(pane);
  renderLayout(dst); // appendChild moves the node + its terminal
  dst.active = pane;
  pane.el.classList.add('focused');
  refreshTab(dst);
  if (!srcTab.panes.includes(srcTab.active)) setActivePane(srcTab, srcTab.panes[0]);
  fitTab(srcTab); // still visible here, so it refits before we switch away
  refreshTab(srcTab);
  activateTab(dst);
  persistSession();
}

// Drop a dragged single-pane tab onto part of a pane in the visible tab:
// its pane joins that tab's layout beside the drop target.
function mergeTabAsSplit(srcTab, dstTab, targetPane, dir, before) {
  if (!tabs.includes(dstTab) || !tabs.includes(srcTab) || srcTab === dstTab) return;
  if (srcTab.panes.length !== 1 || dstTab.panes.length >= MAX_PANES) return;
  if (!dstTab.panes.includes(targetPane)) return;
  exitZoom(dstTab);
  const pane = srcTab.panes[0];
  srcTab.panes = [];
  srcTab.layout = null;
  pane.parent = null;
  pane.tab = dstTab;
  pane.el.classList.remove('focused');
  pane.el.style.flexGrow = '';
  dstTab.panes.push(pane);
  placePane(targetPane, pane, dir, before);
  removeTab(srcTab);
  if (activeTab !== dstTab) activateTab(dstTab);
  setActivePane(dstTab, pane);
  fitTab(dstTab);
  refreshTab(dstTab);
  syncGlow();
  persistSession();
}

// Right-click menu for a split pane.
function openPaneMenu(pane, x, y) {
  closeGroupEditor();
  const tab = pane.tab;
  if (tab.active !== pane) setActivePane(tab, pane);
  ctxMenu.replaceChildren();
  ctxMenu.appendChild(ctxItem('Move pane to new tab', () => movePaneToNewTab(tab, pane)));
  ctxMenu.appendChild(ctxItem('Close pane', () => closePane(tab, pane)));
  ctxMenu.classList.remove('hidden');
  const w = ctxMenu.offsetWidth, h = ctxMenu.offsetHeight;
  ctxMenu.style.left = `${Math.min(x, window.innerWidth - w - 8)}px`;
  ctxMenu.style.top = `${Math.min(y, window.innerHeight - h - 8)}px`;
}

function activateTab(tab) {
  const g = tabGroup(tab);
  if (g?.collapsed) { g.collapsed = false; restyleTabs(); } // activating expands
  activeTab = tab;
  clearAttention(tab);
  for (const t of tabs) {
    const on = t === tab;
    t.paneEl.classList.toggle('hidden', !on);
    t.tabEl.classList.toggle('active', on);
  }
  setPanel((tab.active?.artifacts.length ?? 0) > 0 && !tab.railDismissed); // rail follows context
  fitTab(tab);
  syncGlow();
  renderFooter();
  renderArtifacts(tab);
  updateArtBadge();
  if (tab.active) {
    invoke('set_active', { id: tab.active.id });
    tab.active.term.focus();
  }
  persistSession();
}
function cycleTab(dir) {
  const vis = tabs.filter((t) => !tabGroup(t)?.collapsed);
  if (vis.length < 2 || !activeTab) return;
  const idx = Math.max(0, vis.indexOf(activeTab));
  activateTab(vis[(idx + dir + vis.length) % vis.length]);
}
function fitTab(tab) {
  if (tab.paneEl.classList.contains('hidden')) return;
  for (const p of tab.panes) {
    try { p.fit.fit(); } catch { continue; }
    if (!p.exited) invoke('pty_resize', { id: p.id, rows: p.term.rows, cols: p.term.cols });
    kittyRedraw(p); // cell metrics may have changed
  }
}
function removeTab(tab) {
  tab.paneEl.remove();
  tab.tabEl.remove();
  const idx = tabs.indexOf(tab);
  if (idx !== -1) tabs.splice(idx, 1);
  dropGroupIfEmpty(tab.groupId);
  renderStrip();
  if (activeTab === tab) {
    activeTab = null;
    const next = tabs[idx] || tabs[idx - 1] || null;
    if (next) activateTab(next); else createTab();
  }
  persistSession();
}
function closeTab(tab) {
  for (const p of tab.panes) {
    if (!p.exited) invoke('pty_kill', { id: p.id });
    p.term.dispose();
  }
  tab.panes = [];
  removeTab(tab);
}

// --- Session restore (tabs, splits, and serialized scrollback, on disk) --------
// Restore is structural only: tabs, splits, groups, names, and working
// directories. We intentionally do NOT replay terminal contents — a saved
// snapshot is a dead picture, not a live session, and full-screen agents
// (Claude Code, vim) clear the screen on start anyway.
function serLayout(n) {
  if (isPane(n)) return { cwd: n.cwd || '', grow: n.el.style.flexGrow || undefined };
  return { dir: n.split, grow: n.el.style.flexGrow || undefined, kids: n.children.map(serLayout) };
}
// Older sessions stored a flat pane list + one direction; lift into a tree.
function legacyLayoutSpec(e) {
  const kids = (e.panes || []).filter((p) => p.cwd).map((p) => ({ cwd: p.cwd }));
  if (kids.length <= 1) return kids[0] || null;
  return { dir: e.splitDir === 'column' ? 'column' : 'row', kids };
}
function specHasCwd(s) { return !!s && (s.kids ? s.kids.some(specHasCwd) : !!s.cwd); }
async function buildLayoutSpec(tab, spec) {
  if (!spec) return null;
  if (!spec.kids) {
    if (tab.panes.length >= MAX_PANES) return null;
    const p = await createPane(tab, spec.cwd || null);
    if (!p) return null;
    p.el.style.flexGrow = spec.grow || '';
    tab.panes.push(p);
    return p;
  }
  const node = makeNode(spec.dir === 'column' ? 'column' : 'row');
  node.el.style.flexGrow = spec.grow || '';
  for (const k of spec.kids) {
    const child = await buildLayoutSpec(tab, k);
    if (!child) continue;
    child.parent = node;
    node.children.push(child);
  }
  if (!node.children.length) return null;
  if (node.children.length === 1) { // spawn failures collapse the wrapper
    const c = node.children[0];
    c.parent = null;
    c.el.style.flexGrow = node.el.style.flexGrow || '';
    return c;
  }
  return node;
}
function buildSession() {
  return JSON.stringify({
    tabs: tabs.map((t) => ({
      g: t.groupId, name: t.customTitle,
      layout: t.layout ? serLayout(t.layout) : null,
      panes: t.panes.map((p) => ({ cwd: p.cwd || '' })), // downgrade safety
    })),
    groups: [...groups.values()].map(({ id, name, color, collapsed }) => ({ id, name, color, collapsed })),
    active: Math.max(0, tabs.indexOf(activeTab)),
    recentCmds: recentCmds.slice(0, 100),
  });
}
let persistTimer = null;
function persistSession() {
  if (!ready) return;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    invoke('session_save', { data: buildSession() }).catch(() => {});
  }, 400);
}
window.addEventListener('beforeunload', () => {
  invoke('session_save', { data: buildSession() }).catch(() => {});
});
async function startTabs() {
  let saved = null;
  try {
    const raw = await invoke('session_load');
    if (raw) saved = JSON.parse(raw);
  } catch {}
  if (!saved) {
    // migrate from the old localStorage-only format
    try { saved = JSON.parse(localStorage.getItem('prism.session')); } catch {}
  }
  const entries = (saved?.tabs || (saved?.cwds || []).map((cwd) => ({ cwd, g: null })))
    .map((e) => ({ ...e, panes: e.panes?.length ? e.panes : [{ cwd: e.cwd || '' }] }))
    .filter((e) => (e.layout ? specHasCwd(e.layout) : e.panes.some((p) => p.cwd)))
    .slice(0, MAX_RESTORE_TABS);
  if (!entries.length) { await createTab(); return; }
  if (Array.isArray(saved?.recentCmds)) recentCmds = saved.recentCmds.filter((r) => r && r.cmd);
  for (const g of saved?.groups || []) {
    groups.set(g.id, { id: g.id, name: g.name || '', color: g.color, collapsed: !!g.collapsed, chipEl: null });
    groupCounter = Math.max(groupCounter, g.id);
  }
  for (const e of entries) {
    const t = newTabShell();
    const built = await buildLayoutSpec(t, e.layout || legacyLayoutSpec(e));
    if (!built) {
      t.paneEl.remove();
      t.tabEl.remove();
      tabs.splice(tabs.indexOf(t), 1);
      continue;
    }
    t.layout = built;
    built.parent = null;
    renderLayout(t);
    t.active = t.panes[0];
    t.active.el.classList.add('focused');
    refreshTab(t);
    if (e.g != null && groups.has(e.g)) t.groupId = e.g;
    if (e.name) { t.customTitle = e.name; t.titleEl.textContent = e.name; }
  }
  if (!tabs.length) { await createTab(); return; }
  for (const [id] of groups) dropGroupIfEmpty(id); // groups whose tabs failed to spawn
  renderStrip();
  const idx = Math.min(saved.active ?? 0, tabs.length - 1);
  if (tabs[idx]) activateTab(tabs[idx]);
}

// --- Kitty graphics protocol ---------------------------------------------------
// xterm.js has no APC hook, so kitty commands (ESC _ G ... ESC \) are lifted
// out of the PTY stream before it reaches the terminal. Each command's handler
// runs from a write() callback, so the cursor is exactly where the stream put
// it when the image lands. Images render on an overlay canvas anchored to
// buffer markers, so they scroll with the scrollback. Video players
// (mpv --vo=kitty, timg) work by rapidly replacing frames via a=T / a=d.
const KITTY_STORE_MAX = 128 * 1024 * 1024; // decoded-pixel budget per pane
const kittyLatin1 = new TextDecoder('latin1');

function kittyInit(pane) {
  pane.kitty = {
    carry: null,      // bytes that might start/continue an APC across chunks
    inApc: false,
    apcBuf: '',
    pending: null,    // chunked transmission in progress: { ctrl, parts }
    images: new Map(), // id -> { bitmap, bytes, seq }
    autoId: -1,        // ids for transmissions that didn't specify one
    seq: 0,
    placements: [],    // { imgId, marker, row, alt, col, cols, rows, sx, sy, sw, sh }
    layer: null,
    raf: 0,
  };
}

// Split a PTY chunk into text segments and complete kitty APC payloads,
// carrying partial escape sequences across chunk boundaries.
function kittyScan(k, data) {
  if (k.carry) {
    const merged = new Uint8Array(k.carry.length + data.length);
    merged.set(k.carry);
    merged.set(data, k.carry.length);
    data = merged;
    k.carry = null;
  }
  const segs = [];
  const len = data.length;
  let i = 0;
  let textStart = 0;
  while (i < len) {
    if (!k.inApc) {
      if (data[i] !== 0x1b) { i++; continue; }
      if (i + 2 >= len) {
        // ESC (or ESC _) at the chunk edge: might be an APC start, hold it
        if (i + 1 >= len || data[i + 1] === 0x5f) {
          if (textStart < i) segs.push({ text: data.subarray(textStart, i) });
          k.carry = data.slice(i);
          return segs;
        }
        i++;
        continue;
      }
      if (data[i + 1] === 0x5f && data[i + 2] === 0x47) { // ESC _ G
        if (textStart < i) segs.push({ text: data.subarray(textStart, i) });
        k.inApc = true;
        k.apcBuf = '';
        i += 3;
        textStart = i;
        continue;
      }
      i++;
    } else {
      if (data[i] !== 0x1b) { i++; continue; }
      if (i + 1 >= len) { // ESC at the edge: could be the ST terminator
        k.apcBuf += kittyLatin1.decode(data.subarray(textStart, i));
        k.carry = data.slice(i);
        return segs;
      }
      if (data[i + 1] === 0x5c) { // ESC \ ends the APC
        k.apcBuf += kittyLatin1.decode(data.subarray(textStart, i));
        segs.push({ apc: k.apcBuf });
        k.inApc = false;
        k.apcBuf = '';
        i += 2;
        textStart = i;
        continue;
      }
      i += 2;
    }
  }
  if (k.inApc) {
    k.apcBuf += kittyLatin1.decode(data.subarray(textStart, len));
  } else if (textStart < len) {
    segs.push({ text: data.subarray(textStart, len) });
  }
  return segs;
}

function writePtyData(pane, bytes) {
  if (!pane.kitty) { pane.term.write(bytes); return; }
  const segs = kittyScan(pane.kitty, bytes);
  for (const s of segs) {
    if (s.text) pane.term.write(s.text.slice()); // copy: write() is async, the buffer is shared
    else pane.term.write('', () => { kittyCommand(pane, s.apc); }); // anchor after preceding text
  }
}

function kittyParseCtrl(str) {
  const out = {};
  for (const kv of str.split(',')) {
    const eq = kv.indexOf('=');
    if (eq > 0) out[kv.slice(0, eq)] = kv.slice(eq + 1);
  }
  return out;
}

function kittyRespond(pane, ctrl, msg) {
  const ok = msg === 'OK';
  if (ctrl.q === '2' || (ok && ctrl.q === '1')) return;
  const keys = [];
  if (ctrl.i) keys.push('i=' + ctrl.i);
  if (ctrl.I) keys.push('I=' + ctrl.I);
  if (!keys.length) return; // kitty only replies when the client sent an id
  if (pane.exited) return;
  invoke('pty_write', { id: pane.id, data: '\x1b_G' + keys.join(',') + ';' + msg + '\x1b\\' });
}

async function kittyInflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function kittyB64(s) {
  s = s.replace(/\s+/g, '');
  while (s.length % 4) s += '='; // some clients send unpadded base64
  return s;
}

async function kittyDecode(ctrl, payload) {
  const t = ctrl.t || 'd';
  let bytes;
  if (t === 'd') {
    bytes = b64ToBytes(kittyB64(payload));
  } else if (t === 'f' || t === 't') {
    const path = atob(kittyB64(payload));
    const b64 = await invoke('read_file_b64', { path, max: 64000000, delete: t === 't' });
    bytes = b64ToBytes(b64);
  } else {
    throw new Error('EUNSUPPORTED:medium ' + t);
  }
  if (ctrl.o === 'z') bytes = await kittyInflate(bytes);
  const f = ctrl.f || '32';
  if (f === '100') return await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
  const w = parseInt(ctrl.s, 10) || 0;
  const h = parseInt(ctrl.v, 10) || 0;
  if (!w || !h) throw new Error('EINVAL:missing s/v');
  let rgba;
  if (f === '24') {
    if (bytes.length < w * h * 3) throw new Error('EINVAL:short payload');
    rgba = new Uint8ClampedArray(w * h * 4);
    for (let px = 0, j = 0; px < w * h; px++) {
      rgba[j++] = bytes[px * 3];
      rgba[j++] = bytes[px * 3 + 1];
      rgba[j++] = bytes[px * 3 + 2];
      rgba[j++] = 255;
    }
  } else if (f === '32') {
    if (bytes.length < w * h * 4) throw new Error('EINVAL:short payload');
    rgba = new Uint8ClampedArray(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + w * h * 4));
  } else {
    throw new Error('EUNSUPPORTED:format ' + f);
  }
  return await createImageBitmap(new ImageData(rgba, w, h));
}

function kittyCellDims(pane) {
  const d = pane.term._core?._renderService?.dimensions?.css?.cell;
  if (d?.width && d?.height) return { w: d.width, h: d.height };
  const r = pane.term.element?.querySelector('.xterm-screen')?.getBoundingClientRect();
  return {
    w: (r?.width || pane.el.clientWidth || 800) / pane.term.cols,
    h: (r?.height || pane.el.clientHeight || 600) / pane.term.rows,
  };
}

function kittyStore(pane, id, bitmap) {
  const k = pane.kitty;
  const old = k.images.get(id);
  if (old) old.bitmap.close?.();
  k.images.set(id, { bitmap, bytes: bitmap.width * bitmap.height * 4, seq: ++k.seq });
  // LRU eviction: drop the oldest unplaced images beyond the pixel budget
  let total = 0;
  for (const img of k.images.values()) total += img.bytes;
  if (total <= KITTY_STORE_MAX) return;
  const placed = new Set(k.placements.map((p) => p.imgId));
  const byAge = [...k.images.entries()].sort((a, b) => a[1].seq - b[1].seq);
  for (const [iid, img] of byAge) {
    if (total <= KITTY_STORE_MAX) break;
    if (placed.has(iid)) continue;
    img.bitmap.close?.();
    k.images.delete(iid);
    total -= img.bytes;
  }
}

function kittyPlace(pane, ctrl, imgId) {
  const k = pane.kitty;
  const img = k.images.get(imgId);
  if (!img) { kittyRespond(pane, ctrl, 'ENOENT:no such image'); return false; }
  const dims = kittyCellDims(pane);
  const sx = parseInt(ctrl.x, 10) || 0;
  const sy = parseInt(ctrl.y, 10) || 0;
  const sw = parseInt(ctrl.w, 10) || (img.bitmap.width - sx);
  const sh = parseInt(ctrl.h, 10) || (img.bitmap.height - sy);
  let cols = parseInt(ctrl.c, 10) || Math.max(1, Math.ceil(sw / dims.w));
  let rows = parseInt(ctrl.r, 10) || Math.max(1, Math.ceil(sh / dims.h));
  if (cols > pane.term.cols) { // shrink to fit the viewport, keep aspect
    rows = Math.max(1, Math.round(rows * pane.term.cols / cols));
    cols = pane.term.cols;
  }
  const buf = pane.term.buffer.active;
  const alt = buf.type === 'alternate';
  const place = {
    imgId, col: buf.cursorX, cols, rows, sx, sy, sw, sh, alt,
    marker: alt ? null : pane.term.registerMarker(0),
    row: alt ? buf.cursorY : 0, // alt screen never scrolls; a fixed row is enough
  };
  k.placements.push(place);
  if (k.placements.length > 200) k.placements.shift();
  img.seq = ++k.seq;
  // kitty moves the cursor below the image unless C=1 (video players use C=1)
  if (ctrl.C !== '1') pane.term.write('\r' + '\n'.repeat(rows));
  kittyDraw(pane); // synchronous: video frames shouldn't wait a frame
  return true;
}

function kittyDelete(pane, ctrl) {
  const k = pane.kitty;
  const what = ctrl.d || 'a';
  const freeData = what === what.toUpperCase();
  const kind = what.toLowerCase();
  if (kind === 'i' && ctrl.i) {
    const id = ctrl.i;
    k.placements = k.placements.filter((p) => String(p.imgId) !== id);
    if (freeData) { k.images.get(id)?.bitmap.close?.(); k.images.delete(id); }
  } else { // 'a' and anything unhandled: clear all placements
    k.placements = [];
    if (freeData) {
      for (const img of k.images.values()) img.bitmap.close?.();
      k.images.clear();
    }
  }
  kittyDraw(pane);
}

async function kittyCommand(pane, apc) {
  const k = pane.kitty;
  if (!k) return;
  const semi = apc.indexOf(';');
  const ctrlStr = semi === -1 ? apc : apc.slice(0, semi);
  let payload = semi === -1 ? '' : apc.slice(semi + 1);
  let ctrl = kittyParseCtrl(ctrlStr);
  // Chunked transmission: the first chunk carries the keys and m=1;
  // continuations carry only m (and optionally i/q) plus payload.
  if (k.pending) {
    k.pending.parts.push(payload);
    if (ctrl.m === '1') return;
    ctrl = k.pending.ctrl;
    payload = k.pending.parts.join('');
    k.pending = null;
  } else if (ctrl.m === '1') {
    k.pending = { ctrl, parts: [payload] };
    return;
  }
  const action = ctrl.a || 't';
  try {
    switch (action) {
      case 'q': { // capability probe (kitten icat sends one before drawing)
        await kittyDecode(ctrl, payload);
        kittyRespond(pane, ctrl, 'OK');
        break;
      }
      case 't':
      case 'T': {
        const bitmap = await kittyDecode(ctrl, payload);
        const id = ctrl.i || String(k.autoId--);
        kittyStore(pane, id, bitmap);
        kittyRespond(pane, ctrl, 'OK');
        if (action === 'T') kittyPlace(pane, ctrl, id);
        break;
      }
      case 'p': {
        if (!ctrl.i) { kittyRespond(pane, ctrl, 'EINVAL:missing image id'); break; }
        if (kittyPlace(pane, ctrl, ctrl.i)) kittyRespond(pane, ctrl, 'OK');
        break;
      }
      case 'd':
        kittyDelete(pane, ctrl);
        kittyRespond(pane, ctrl, 'OK');
        break;
      default:
        kittyRespond(pane, ctrl, 'ENOTSUPPORTED:action ' + action);
    }
  } catch (err) {
    kittyRespond(pane, ctrl, String(err?.message || err || 'EINVAL'));
  }
}

function kittyRedraw(pane) {
  const k = pane.kitty;
  if (!k || k.raf) return;
  k.raf = requestAnimationFrame(() => {
    k.raf = 0;
    kittyDraw(pane);
  });
}

function kittyDraw(pane) {
  const k = pane.kitty;
  if (!k) return;
  // prune placements whose anchor line left the scrollback
  k.placements = k.placements.filter((p) => p.alt || (p.marker && !p.marker.isDisposed && p.marker.line !== -1));
  if (!k.placements.length && !k.layer) return;
  const screen = pane.term.element?.querySelector('.xterm-screen');
  if (!screen) return;
  if (!k.layer) {
    k.layer = document.createElement('canvas');
    k.layer.className = 'kitty-layer';
    screen.appendChild(k.layer);
  }
  const dpr = window.devicePixelRatio || 1;
  const w = screen.clientWidth;
  const h = screen.clientHeight;
  if (k.layer.width !== Math.round(w * dpr) || k.layer.height !== Math.round(h * dpr)) {
    k.layer.width = Math.round(w * dpr);
    k.layer.height = Math.round(h * dpr);
    k.layer.style.width = w + 'px';
    k.layer.style.height = h + 'px';
  }
  const ctx = k.layer.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const buf = pane.term.buffer.active;
  const inAlt = buf.type === 'alternate';
  const dims = kittyCellDims(pane);
  for (const p of k.placements) {
    if (p.alt !== inAlt) continue; // normal-buffer images hide while a TUI runs
    const row = p.alt ? p.row : p.marker.line - buf.viewportY;
    if (row + p.rows <= 0 || row >= pane.term.rows) continue;
    const img = k.images.get(p.imgId);
    if (!img) continue;
    try {
      ctx.drawImage(
        img.bitmap, p.sx, p.sy, p.sw, p.sh,
        p.col * dims.w, row * dims.h, p.cols * dims.w, p.rows * dims.h,
      );
    } catch { /* bitmap may have been closed under memory pressure */ }
  }
}

function hookKitty(pane) {
  kittyInit(pane);
  pane.term.onRender(() => kittyRedraw(pane));
  pane.term.onScroll(() => kittyRedraw(pane));
  pane.term.buffer.onBufferChange(() => {
    // leaving the alt screen discards its placements (mpv/vim cleanup)
    if (pane.term.buffer.active.type === 'normal') {
      pane.kitty.placements = pane.kitty.placements.filter((p) => !p.alt);
    }
    kittyRedraw(pane);
  });
}

// --- IPC routing ------------------------------------------------------------
function findPane(id) {
  for (const t of tabs) {
    const p = t.panes.find((p2) => p2.id === id);
    if (p) return { t, p };
  }
  return null;
}

listen('pty://data', (e) => {
  const hit = findPane(e.payload.id); if (!hit) return;
  writePtyData(hit.p, b64ToBytes(e.payload.data)); // kitty APCs are peeled off here
});
listen('pty://exit', (e) => {
  const hit = findPane(e.payload.id); if (!hit) return;
  const { t, p } = hit;
  p.exited = true; p.fgProcess = ''; p.agentActive = false;
  clearWork(p, t);
  setTabProgress(t, 0, 0);
  p.term.write('\r\n\x1b[2m[process exited]\x1b[0m\r\n');
  if (p === activePane()) renderFooter();
});
listen('pty://proc', (e) => {
  const hit = findPane(e.payload.id); if (!hit) return;
  const { t, p } = hit;
  p.fgProcess = e.payload.proc;
  if (e.payload.active && !p.agentActive) t.railDismissed = false; // new agent session
  p.agentActive = e.payload.active;
  if (!e.payload.active && p.burstActive) clearWork(p, t); else refreshTab(t);
  if (p === activePane()) renderFooter();
});
listen('footer://update', (e) => {
  const hit = findPane(e.payload.id); if (!hit) return;
  const { p } = hit;
  const moved = p.cwd !== e.payload.cwd;
  p.cwd = e.payload.cwd; p.branch = e.payload.branch;
  if (p === activePane()) renderFooter();
  if (moved) persistSession();
});
// Dropped files paste their shell-escaped paths at the focused pane's cursor.
function shellEscape(p) {
  return /[^\w@%+=:,./-]/.test(p) ? `'${p.replace(/'/g, `'\\''`)}'` : p;
}
window.__TAURI__.webview.getCurrentWebview().onDragDropEvent((e) => {
  if (e.payload.type !== 'drop') return;
  const p = activePane();
  const paths = e.payload.paths || [];
  if (!p || p.exited || !paths.length) return;
  invoke('pty_write', { id: p.id, data: paths.map(shellEscape).join(' ') + ' ' });
  p.term.focus();
});
listen('artifacts://update', (e) => {
  const hit = findPane(e.payload.id); if (!hit) return;
  const { t, p } = hit;
  const grew = e.payload.list.length > p.artifacts.length;
  p.artifacts = e.payload.list;
  if (p === activePane()) { renderArtifacts(t); updateArtBadge(); }
  if (!grew) return;
  if (p === activePane() && !t.railDismissed) {
    setPanel(true); // an agent is producing files here — surface them
  } else if (!document.body.classList.contains('panel-open')) {
    toggleArtBtn.classList.remove('pulse');
    void toggleArtBtn.offsetWidth;
    toggleArtBtn.classList.add('pulse');
  }
});

// --- Socket API (Unix socket -> Rust -> here; `prism` CLI in every shell) ------
function readPaneText(p, lines) {
  const buf = p.term.buffer.active;
  const end = buf.baseY + buf.cursorY + 1; // content ends at the cursor, not the blank rows below
  const start = Math.max(0, end - Math.max(1, Math.min(lines, 2000)));
  const out = [];
  for (let i = start; i < end; i++) out.push(buf.getLine(i)?.translateToString(true) ?? '');
  return out.join('\n').replace(/\n+$/, '');
}
async function handleApi(req) {
  switch (req.cmd) {
    case 'list':
      return {
        tabs: tabs.map((t, i) => ({
          index: i,
          title: t.titleEl.textContent,
          active: t === activeTab,
          group: tabGroup(t)?.name ?? null,
          panes: t.panes.map((p) => ({
            id: p.id, cwd: p.cwd, focused: p === t.active,
            agent: p.agentActive, working: p.burstActive, exited: p.exited,
          })),
        })),
      };
    case 'new-tab':
      await createTab(req.cwd || null);
      return { pane: activePane()?.id ?? null };
    case 'split':
      await splitPane(req.dir === 'column' ? 'column' : 'row');
      return { pane: activePane()?.id ?? null };
    case 'send': {
      const hit = findPane(req.id);
      if (!hit || hit.p.exited) return { error: 'no such pane' };
      await invoke('pty_write', { id: req.id, data: String(req.data ?? '') });
      return { ok: true };
    }
    case 'read': {
      const hit = findPane(req.id ?? activePane()?.id);
      if (!hit) return { error: 'no such pane' };
      return { pane: hit.p.id, text: readPaneText(hit.p, req.lines || 50) };
    }
    case 'activate': {
      const hit = findPane(req.id);
      if (!hit) return { error: 'no such pane' };
      activateTab(hit.t);
      setActivePane(hit.t, hit.p);
      return { ok: true };
    }
    case 'notify':
      invoke('notify_user', { title: String(req.title || 'PRISM'), body: String(req.body || '') });
      return { ok: true };
    case 'check-update':
      return { update: await invoke('check_update') };
    case 'install-update':
      await invoke('install_update'); // app restarts if this succeeds
      return { ok: true };
    default:
      return { error: 'unknown cmd', cmds: ['list', 'new-tab', 'split', 'send', 'read', 'activate', 'notify'] };
  }
}
listen('api://request', async (e) => {
  const { id, req } = e.payload;
  let res;
  try { res = await handleApi(JSON.parse(req)); }
  catch (err) { res = { error: String(err?.message || err) }; }
  invoke('api_respond', { id, data: JSON.stringify(res ?? { ok: true }) });
});

// --- Artifact diff overlay -----------------------------------------------------
function showDiff(path, text) {
  diffTitle.textContent = 'git diff · ' + (path.split('/').pop() || path);
  diffBody.replaceChildren();
  for (const line of text.split('\n')) {
    const el = document.createElement('div');
    el.textContent = line;
    if (line.startsWith('+') && !line.startsWith('+++')) el.className = 'dl-add';
    else if (line.startsWith('-') && !line.startsWith('---')) el.className = 'dl-del';
    else if (line.startsWith('@@')) el.className = 'dl-hunk';
    else if (line.startsWith('diff ') || line.startsWith('index ')) el.className = 'dl-meta';
    diffBody.appendChild(el);
  }
  diffView.classList.remove('hidden');
}
function closeDiff() { diffView.classList.add('hidden'); activePane()?.term.focus(); }
diffView.addEventListener('mousedown', (e) => { if (e.target === diffView) closeDiff(); });

// --- Scrollback search (Cmd+F) ------------------------------------------------
const FIND_DECOR = {
  matchBackground: '#3a4a6b', activeMatchBackground: '#6b5a9e',
  matchOverviewRuler: '#79b8ff', activeMatchColorOverviewRuler: '#b388ff',
};
function openFind() {
  findBar.classList.remove('hidden');
  findCount.textContent = '';
  findInput.focus();
  findInput.select();
}
function closeFind() {
  findBar.classList.add('hidden');
  activePane()?.search.clearDecorations();
  activePane()?.term.focus();
}
function doFind(dir) {
  const p = activePane();
  if (!p || !findInput.value) return;
  if (dir < 0) p.search.findPrevious(findInput.value, { decorations: FIND_DECOR });
  else p.search.findNext(findInput.value, { decorations: FIND_DECOR });
}
findInput.addEventListener('input', () => {
  activePane()?.search.findNext(findInput.value, { decorations: FIND_DECOR, incremental: true });
});
findInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); doFind(e.shiftKey ? -1 : 1); }
});
document.getElementById('find-prev').addEventListener('mousedown', (e) => { e.preventDefault(); doFind(-1); });
document.getElementById('find-next').addEventListener('mousedown', (e) => { e.preventDefault(); doFind(1); });
document.getElementById('find-close').addEventListener('mousedown', (e) => { e.preventDefault(); closeFind(); });

// --- Command palette (Cmd+P) ---------------------------------------------------
let paletteSel = 0;
function paletteActions() {
  const acts = [
    { label: 'New tab', kbd: kbdLabel('new-tab'), run: () => createTab() },
    { label: 'Close pane / tab', kbd: kbdLabel('close'), run: () => closeFocused() },
    { label: 'Split right', kbd: kbdLabel('split-right'), run: () => splitPane('row') },
    { label: 'Split down', kbd: kbdLabel('split-down'), run: () => splitPane('column') },
    { label: 'Zoom pane (toggle)', kbd: kbdLabel('zoom-pane'), run: () => toggleZoom() },
    { label: 'Broadcast input to all panes (toggle)', kbd: kbdLabel('broadcast'), run: () => toggleBroadcast() },
    { label: 'Close split pane', kbd: kbdLabel('close-split'), run: () => { if (activeTab && activeTab.panes.length > 1) closePane(activeTab, activeTab.active); } },
    { label: 'Move pane to new tab', kbd: '', run: () => { if (activeTab && activeTab.panes.length > 1) movePaneToNewTab(activeTab, activeTab.active); } },
    { label: 'Next tab', kbd: kbdLabel('next-tab'), run: () => cycleTab(1) },
    { label: 'Previous tab', kbd: kbdLabel('prev-tab'), run: () => cycleTab(-1) },
    { label: 'Mission control', kbd: kbdLabel('mission'), run: () => toggleMission() },
    { label: 'Find in scrollback', kbd: kbdLabel('find'), run: () => openFind() },
    { label: 'Clear terminal', kbd: kbdLabel('clear'), run: () => activePane()?.term.clear() },
    { label: 'Toggle artifacts panel', kbd: kbdLabel('artifacts'), run: () => togglePanel() },
    { label: 'Settings', kbd: kbdLabel('settings'), run: () => toggleSettings() },
    ...(pendingUpdate ? [{ label: `Install update v${pendingUpdate.version} (restarts)`, kbd: '', run: () => installPendingUpdate() }] : []),
    { label: 'Copy last command output', kbd: '', run: () => copyLastOutput() },
    { label: 'Jump to previous prompt', kbd: kbdLabel('prev-prompt'), run: () => jumpPrompt(-1) },
    { label: 'Jump to next prompt', kbd: kbdLabel('next-prompt'), run: () => jumpPrompt(1) },
  ];
  if (activePane()?.cwd) {
    acts.push({ label: 'Reveal current folder in Finder', kbd: '', run: () => invoke('artifact_reveal', { path: activePane().cwd }) });
  }
  for (const t of tabs) {
    acts.push({
      label: `Go to: ${t.titleEl.textContent}${t.active?.cwd ? ' — ' + tilde(t.active.cwd) : ''}`,
      kbd: '', run: () => activateTab(t),
    });
  }
  for (const r of recentCmds.slice(0, 30)) {
    acts.push({
      label: `$ ${r.cmd}`,
      kbd: 'run',
      run: () => {
        const pn = activePane();
        if (pn && !pn.exited) invoke('pty_write', { id: pn.id, data: r.cmd + '\n' });
      },
    });
  }
  return acts;
}
function paletteMatches() {
  const q = paletteInput.value.trim().toLowerCase();
  return paletteActions().filter((a) => !q || a.label.toLowerCase().includes(q));
}
function renderPalette() {
  const items = paletteMatches();
  paletteSel = Math.min(paletteSel, Math.max(0, items.length - 1));
  paletteList.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'p-empty';
    empty.textContent = 'No matching commands.';
    paletteList.appendChild(empty);
    return;
  }
  items.forEach((a, i) => {
    const row = document.createElement('div');
    row.className = 'p-item' + (i === paletteSel ? ' sel' : '');
    const label = document.createElement('span');
    label.className = 'p-label';
    label.textContent = a.label;
    const kbd = document.createElement('span');
    kbd.className = 'p-kbd';
    kbd.textContent = a.kbd;
    row.append(label, kbd);
    row.addEventListener('mousedown', (e) => { e.preventDefault(); closePalette(); a.run(); });
    row.addEventListener('mousemove', () => { if (paletteSel !== i) { paletteSel = i; renderPalette(); } });
    paletteList.appendChild(row);
  });
  paletteList.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
}
function openPalette() {
  paletteEl.classList.remove('hidden');
  paletteInput.value = '';
  paletteSel = 0;
  renderPalette();
  paletteInput.focus();
}
function closePalette() {
  paletteEl.classList.add('hidden');
  activePane()?.term.focus();
}
function togglePalette() {
  if (paletteEl.classList.contains('hidden')) openPalette(); else closePalette();
}
paletteInput.addEventListener('input', () => { paletteSel = 0; renderPalette(); });
paletteInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); paletteSel++; renderPalette(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); paletteSel = Math.max(0, paletteSel - 1); renderPalette(); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    const item = paletteMatches()[paletteSel];
    closePalette();
    item?.run();
  }
});
paletteEl.addEventListener('mousedown', (e) => { if (e.target === paletteEl) closePalette(); });

// --- Mission control (Cmd+E) ---------------------------------------------------
const STATE_LABEL = { working: 'working', ready: 'waiting', idle: 'shell', exited: 'exited' };
function renderMission() {
  missionGrid.replaceChildren();
  for (const t of tabs) {
    const state = tabState(t);
    const card = document.createElement('div');
    card.className = 'm-card' + (t === activeTab ? ' current' : '');
    card.dataset.state = state;

    const head = document.createElement('div');
    head.className = 'm-head';
    const dot = document.createElement('span'); dot.className = 'dot';
    const title = document.createElement('span'); title.className = 'm-title';
    title.textContent = t.titleEl.textContent + (t.panes.length > 1 ? ` · ${t.panes.length} panes` : '');
    const st = document.createElement('span'); st.className = 'm-state';
    st.textContent = `${STATE_LABEL[state]} · ${relTime(t.stateSince)}`;
    head.append(dot, title, st);
    const g = tabGroup(t);
    if (g) {
      const tag = document.createElement('span');
      tag.className = 'm-group';
      tag.textContent = g.name || '●';
      tag.style.color = g.color;
      head.insertBefore(tag, st);
    }

    const cwd = document.createElement('div');
    cwd.className = 'm-cwd';
    cwd.textContent = t.active?.cwd ? tilde(t.active.cwd) : '~';
    card.append(head, cwd);

    if (t.active?.branch) {
      const branch = document.createElement('div');
      branch.className = 'm-branch';
      branch.textContent = t.active.branch;
      card.appendChild(branch);
    }
    const arts = t.active?.artifacts ?? [];
    if (arts.length) {
      const files = document.createElement('div');
      files.className = 'm-files';
      files.textContent = arts.slice(0, 3).map((r) => r.path.split('/').pop()).join(' · ');
      card.appendChild(files);
    }
    card.addEventListener('mousedown', () => { closeMission(); activateTab(t); });
    missionGrid.appendChild(card);
  }
}
function openMission() { renderMission(); missionEl.classList.remove('hidden'); }
function closeMission() { missionEl.classList.add('hidden'); activePane()?.term.focus(); }
function toggleMission() {
  if (missionEl.classList.contains('hidden')) openMission(); else closeMission();
}
missionEl.addEventListener('mousedown', (e) => { if (e.target === missionEl) closeMission(); });

// --- Controls ---------------------------------------------------------------
function closeFocused() {
  if (!activeTab) return;
  if (activeTab.panes.length > 1) closePane(activeTab, activeTab.active);
  else closeTab(activeTab);
}
newTabBtn.addEventListener('mousedown', (e) => { e.preventDefault(); if (ready) createTab(); });
toggleArtBtn.addEventListener('mousedown', (e) => { e.preventDefault(); togglePanel(); });
window.addEventListener('resize', () => { if (activeTab) fitTab(activeTab); });

window.addEventListener('keydown', (e) => {
  if (!ready) return;
  if (e.key === 'Escape') {
    if (!diffView.classList.contains('hidden')) { e.preventDefault(); closeDiff(); }
    else if (!ctxMenu.classList.contains('hidden')) { e.preventDefault(); closeCtxMenu(); }
    else if (!groupEditor.classList.contains('hidden')) { e.preventDefault(); closeGroupEditor(); }
    else if (!findBar.classList.contains('hidden')) { e.preventDefault(); closeFind(); }
    else if (!paletteEl.classList.contains('hidden')) { e.preventDefault(); closePalette(); }
    else if (!missionEl.classList.contains('hidden')) { e.preventDefault(); closeMission(); }
    else if (!settingsEl.classList.contains('hidden')) { e.preventDefault(); toggleSettings(); }
    return;
  }
  if (recordingId) return; // the capture-phase recorder owns this event
  const combo = comboOf(e);
  if (!combo.mods) return;
  for (const id of Object.keys(DEFAULT_KEYMAP)) {
    const hk = hotkeyOf(id);
    if (hk.mods === combo.mods && hk.key === combo.key) {
      e.preventDefault();
      ACTION_RUN[id]();
      return;
    }
  }
  if (combo.mods === 'meta' && /^[1-9]$/.test(combo.key)) {
    e.preventDefault();
    const t = tabs[+combo.key - 1];
    if (t) activateTab(t);
  }
});

setInterval(() => {
  if (!activeTab) return;
  fUp.textContent = uptime(Date.now() - activeTab.startTime);
  if (document.body.classList.contains('panel-open') && activePane()?.artifacts.length) {
    renderArtifacts(activeTab);
  }
  if (!missionEl.classList.contains('hidden')) renderMission();
}, 1000);

// --- Startup splash ---------------------------------------------------------
function runSplash() {
  const splash = document.getElementById('startup');
  splash.classList.add('go');
  setTimeout(() => {
    splash.classList.add('leaving');
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      splash.remove();
      ready = true;
      startTabs(); // the terminals start only after the splash clears
    };
    splash.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 900);
  }, 2300); // letters are done fading out (~2.3s), then the backdrop clears
}

async function boot() {
  loadSettings();
  try { HOME = await invoke('app_home'); } catch { HOME = ''; }
  if (settings.summon !== DEFAULT_SETTINGS.summon) {
    applySummonShortcut(settings.summon).catch(() => {});
  }
  try {
    await loadUserFontFiles(); // imported FontFaces must exist before preload
    await Promise.all([
      document.fonts.load('100 60px "Raleway"'),
      document.fonts.load('400 14px "JetBrains Mono"'),
      document.fonts.load('700 14px "JetBrains Mono"'),
      preloadTermFont(),
    ]);
  } catch {}
  runSplash();
}
boot();
