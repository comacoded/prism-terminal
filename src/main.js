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
const MAX_PANES = 4;
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
const DEFAULT_SETTINGS = { fontSize: 13.5, tint: 45, glow: true, theme: 'prism', cursor: 'bar', blink: true, editor: 'code', custom: [] };
let settings = { ...DEFAULT_SETTINGS };
const HOTKEYS = [
  ['⌘T', 'New tab'], ['⌘W', 'Close pane / tab'],
  ['⌘D', 'Split right'], ['⇧⌘D', 'Split down'],
  ['⇧⌘↵', 'Zoom pane'], ['⇧⌘B', 'Broadcast input'],
  ['⌘ click path', 'Open file in editor'],
  ['⇧⌘{  ⇧⌘}', 'Previous / next tab'], ['⌘1…9', 'Jump to tab'],
  ['⌘E', 'Mission control'], ['⌘F', 'Find in scrollback'],
  ['⌘P', 'Command palette'], ['⌘K', 'Clear terminal'],
  ['⌘↑  ⌘↓', 'Previous / next prompt'], ['⇧⌘A', 'Artifacts rail'],
  ['⌘,', 'Settings'], ['⌘+  ⌘−  ⌘0', 'Text size / reset'],
  ['⌃`', 'Summon PRISM (global)'], ['⌥ scroll', 'Fast scroll'],
  ['double-click tab', 'Rename tab'], ['right-click tab', 'Group / tab menu'],
  ['click chip', 'Collapse or expand group'], ['right-click chip', 'Edit group'],
  ['drag tab', 'Reorder; drop into a group to join'],
];
function forEachPane(fn) { for (const t of tabs) for (const p of t.panes) fn(p, t); }
function applySettings(save) {
  const th = currentTheme();
  document.body.classList.toggle('light', !!th.light);
  document.body.style.background = th.light
    ? `rgba(246, 247, 249, ${settings.tint / 100})`
    : `rgba(10, 11, 16, ${settings.tint / 100})`;
  document.body.classList.toggle('glow-off', !settings.glow);
  forEachPane((p) => {
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
  setGlow.checked = settings.glow;
  setCursor.value = settings.cursor;
  setBlink.checked = settings.blink;
  setEditor.value = settings.editor;
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
function loadSettings() {
  invoke('app_version').then((v) => { setVersion.textContent = 'PRISM ' + v; }).catch(() => {});
  try { settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('prism.settings') || '{}') }; } catch {}
  if (!allThemes()[settings.theme]) settings.theme = 'prism';
  buildThemeCards();
  for (const [keys, label] of HOTKEYS) {
    const row = document.createElement('div');
    row.className = 'set-key';
    const l = document.createElement('span');
    l.textContent = label;
    const wrap = document.createElement('span');
    wrap.className = 'keys';
    for (const token of keys.split(/\s{2,}/)) {
      const kbd = document.createElement('kbd');
      // space out modifier runs like ⇧⌘D so each symbol reads separately
      kbd.textContent = /^[⌘⇧⌃⌥]/.test(token) && token.length <= 5
        ? [...token].join(' ')
        : token;
      wrap.appendChild(kbd);
    }
    row.append(l, wrap);
    setKeys.appendChild(row);
  }
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
async function checkForUpdates(manual) {
  if (manual) setUpdate.textContent = 'Checking…';
  try {
    const u = await invoke('check_update');
    if (u) {
      pendingUpdate = u;
      setUpdate.textContent = `Install v${u.version} (restarts)`;
      setUpdate.classList.add('avail');
      if (!manual) {
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
setUpdate.addEventListener('mousedown', async (e) => {
  e.preventDefault();
  if (pendingUpdate) {
    setUpdate.textContent = `Downloading v${pendingUpdate.version}…`;
    try {
      await invoke('install_update'); // relaunches on success
    } catch {
      setUpdate.textContent = 'Update failed — retry';
    }
    return;
  }
  checkForUpdates(true);
});
setTimeout(() => checkForUpdates(false), 8000); // quiet check shortly after launch

function toggleSettings() {
  settingsEl.classList.toggle('hidden');
  if (settingsEl.classList.contains('hidden')) activePane()?.term.focus();
}
settingsBtn.addEventListener('mousedown', (e) => { e.preventDefault(); toggleSettings(); });
setFont.addEventListener('input', () => { settings.fontSize = parseFloat(setFont.value); applySettings(true); });
setTint.addEventListener('input', () => { settings.tint = parseInt(setTint.value, 10); applySettings(true); });
setGlow.addEventListener('change', () => { settings.glow = setGlow.checked; applySettings(true); });
setCursor.addEventListener('change', () => { settings.cursor = setCursor.value; applySettings(true); });
setBlink.addEventListener('change', () => { settings.blink = setBlink.checked; applySettings(true); });
setEditor.addEventListener('change', () => { settings.editor = setEditor.value; applySettings(true); });

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
async function createPane(tab, startCwd, content) {
  const el = document.createElement('div');
  el.className = 'split-cell';
  const termEl = document.createElement('div');
  termEl.className = 'term';
  el.appendChild(termEl);
  tab.paneEl.appendChild(el);

  const term = new Terminal({
    allowProposedApi: true, // the unicode-graphemes addon registers via proposed API
    minimumContrastRatio: 4.5, // keep inverse/dim text readable on the translucent glass
    allowTransparency: true, fontFamily: '"JetBrains Mono", Menlo, monospace',
    fontSize: settings.fontSize, lineHeight: 1.2,
    cursorBlink: settings.blink, cursorStyle: settings.cursor,
    scrollback: 10000, theme: termTheme(),
    scrollSensitivity: 8, fastScrollSensitivity: 20, fastScrollModifier: 'alt',
  });
  const fit = new FitAddon.FitAddon();
  const search = new SearchAddon.SearchAddon();
  const ser = new SerializeAddon.SerializeAddon();
  term.loadAddon(fit);
  term.loadAddon(search);
  term.loadAddon(ser);
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
  if (content) {
    term.write(content);
    term.write('\r\n\x1b[0m\x1b[2m── restored ──\x1b[0m\r\n');
  }

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
    id, term, fit, search, ser, el,
    exited: false, fgProcess: '', agentActive: false,
    cwd: startCwd || '', branch: '', burstActive: false, workSeen: 0,
    marks: [], cmdStart: null, lastCmd: null, artifacts: [], snapshot: '',
  };
  hookPromptMarks(pane);
  hookAppProtocols(tab, pane);
  hookPathLinks(pane);
  search.onDidChangeResults(({ resultIndex, resultCount }) => {
    if (pane === activePane() && !findBar.classList.contains('hidden')) {
      findCount.textContent = resultCount ? `${resultIndex + 1}/${resultCount}` : '0/0';
    }
  });
  term.onData((d) => {
    invoke('pty_write', { id, data: d });
    if (tab.broadcast && pane === tab.active) {
      for (const p2 of tab.panes) {
        if (p2 !== pane && !p2.exited) invoke('pty_write', { id: p2.id, data: d });
      }
    }
  });
  term.onTitleChange((title) => {
    if (!title || pane !== tab.active) return;
    tab.autoTitle = title;
    if (!tab.customTitle && !tab.renaming) tab.titleEl.textContent = title;
  });
  el.addEventListener('mousedown', () => {
    if (tab === activeTab && tab.active !== pane) setActivePane(tab, pane);
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
function syncDividers(t) {
  t.paneEl.querySelectorAll('.split-divider').forEach((d) => d.remove());
  if (t.panes.length < 2) return;
  for (let i = 0; i < t.panes.length - 1; i++) {
    const div = document.createElement('div');
    div.className = 'split-divider';
    div.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const col = t.splitDir === 'column';
      const prev = t.panes[i], next = t.panes[i + 1];
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
        if (!raf) raf = requestAnimationFrame(() => { raf = null; fitTab(t); });
      };
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        fitTab(t);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    });
    t.panes[i].el.after(div);
  }
}
function exitZoom(t) {
  if (!t.zoom) return;
  t.zoom = false;
  t.paneEl.classList.remove('zoomed');
  t.panes.forEach((p) => p.el.classList.remove('zoomed-cell'));
  fitTab(t);
}
function toggleZoom() {
  const t = activeTab;
  if (!t || t.panes.length < 2) return;
  if (t.zoom) { exitZoom(t); return; }
  t.zoom = true;
  t.paneEl.classList.add('zoomed');
  t.panes.forEach((p) => p.el.classList.toggle('zoomed-cell', p === t.active));
  fitTab(t);
}
function toggleBroadcast() {
  const t = activeTab;
  if (!t) return;
  t.broadcast = !t.broadcast;
  t.paneEl.classList.toggle('broadcast', t.broadcast);
  renderFooter();
}
async function splitPane(dir) {
  const t = activeTab;
  if (!t || !ready) return;
  if (t.panes.length >= MAX_PANES) return;
  if (t.splitDir && t.splitDir !== dir) return; // v1: one direction per tab
  exitZoom(t);
  const pane = await createPane(t, t.active?.cwd || null);
  if (!pane) return;
  t.splitDir = t.splitDir || dir;
  t.paneEl.classList.add('multi');
  t.paneEl.classList.toggle('split-column', t.splitDir === 'column');
  t.panes.push(pane);
  syncDividers(t);
  setActivePane(t, pane);
  fitTab(t);
  refreshTab(t);
}
function closePane(tab, pane) {
  exitZoom(tab);
  if (!pane.exited) invoke('pty_kill', { id: pane.id });
  pane.term.dispose();
  pane.el.remove();
  const idx = tab.panes.indexOf(pane);
  if (idx !== -1) tab.panes.splice(idx, 1);
  if (!tab.panes.length) { removeTab(tab); return; }
  if (tab.panes.length === 1) {
    tab.splitDir = null;
    tab.paneEl.classList.remove('multi', 'split-column', 'broadcast');
    tab.broadcast = false;
    tab.panes[0].el.style.flexGrow = '';
  }
  syncDividers(tab);
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
let drag = null;
function beginTabDrag(tab, e) {
  drag = { tab, startX: e.clientX, startY: e.clientY, started: false, overChip: null, insert: null };
  window.addEventListener('mousemove', onTabDragMove);
  window.addEventListener('mouseup', endTabDrag, { once: true });
}
function onTabDragMove(e) {
  if (!drag) return;
  if (!drag.started) {
    if (Math.abs(e.clientX - drag.startX) < 6 && Math.abs(e.clientY - drag.startY) < 6) return;
    drag.started = true;
    document.body.classList.add('tab-dragging');
    drag.tab.tabEl.classList.add('drag-src');
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
  document.body.classList.remove('tab-dragging');
  d.tab.tabEl.classList.remove('drag-src');
  for (const g of groups.values()) g.chipEl?.classList.remove('drop-target');
  if (!d.started) return;
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
async function createTab(startCwd, content) {
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
    panes: [], active: null, splitDir: null, zoom: false, broadcast: false,
    paneEl, tabEl, titleEl, progEl,
    startTime: Date.now(), stateSince: Date.now(),
    groupId: null, railDismissed: false,
    autoTitle: label, customTitle: null, renaming: false,
  };

  const pane = await createPane(tab, startCwd ?? activePane()?.cwd ?? null, content);
  if (!pane) { paneEl.remove(); return; }
  tab.panes.push(pane);
  tab.active = pane;
  pane.el.classList.add('focused');

  tabs.push(tab);
  tabsEl.insertBefore(tabEl, newTabBtn); // the + button stays after the last tab
  refreshTab(tab);

  tabEl.addEventListener('mousedown', (e) => {
    if (closeEl.contains(e.target) || tab.renaming) return;
    activateTab(tab);
    if (e.button === 0) beginTabDrag(tab, e);
  });
  closeEl.addEventListener('mousedown', (e) => { e.stopPropagation(); closeTab(tab); });
  tabEl.addEventListener('contextmenu', (e) => { e.preventDefault(); openTabMenu(tab, e.clientX, e.clientY); });
  tabEl.addEventListener('dblclick', (e) => { if (!closeEl.contains(e.target)) startRename(tab); });

  activateTab(tab);
  persistSession();
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
const SNAPSHOT_LINES = 1000; // scrollback lines preserved per pane
function snapshotPanes() {
  forEachPane((p) => {
    try { p.snapshot = p.ser.serialize({ scrollback: SNAPSHOT_LINES }); } catch {}
  });
}
function buildSession() {
  return JSON.stringify({
    tabs: tabs.map((t) => ({
      g: t.groupId, name: t.customTitle, splitDir: t.splitDir,
      panes: t.panes.map((p) => ({ cwd: p.cwd || '', content: p.snapshot || '' })),
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
// Content snapshots run on a timer (serializing every pane on each keystroke
// would be wasteful); on quit, at most this interval of scrollback is lost.
setInterval(() => {
  if (!ready) return;
  snapshotPanes();
  persistSession();
}, 15000);
window.addEventListener('beforeunload', () => {
  snapshotPanes();
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
    .map((e) => ({ ...e, panes: e.panes?.length ? e.panes : [{ cwd: e.cwd || '', content: '' }] }))
    .filter((e) => e.panes.some((p) => p.cwd))
    .slice(0, MAX_RESTORE_TABS);
  if (!entries.length) { await createTab(); return; }
  if (Array.isArray(saved?.recentCmds)) recentCmds = saved.recentCmds.filter((r) => r && r.cmd);
  for (const g of saved?.groups || []) {
    groups.set(g.id, { id: g.id, name: g.name || '', color: g.color, collapsed: !!g.collapsed, chipEl: null });
    groupCounter = Math.max(groupCounter, g.id);
  }
  for (const e of entries) {
    const panes = e.panes.slice(0, MAX_PANES);
    await createTab(panes[0].cwd, panes[0].content || undefined);
    const t = tabs[tabs.length - 1];
    if (!t) continue;
    for (const pe of panes.slice(1)) {
      const p = await createPane(t, pe.cwd || null, pe.content || undefined);
      if (p) t.panes.push(p);
    }
    if (t.panes.length > 1) {
      t.splitDir = e.splitDir === 'column' ? 'column' : 'row';
      t.paneEl.classList.add('multi');
      t.paneEl.classList.toggle('split-column', t.splitDir === 'column');
      syncDividers(t);
      setActivePane(t, t.panes[0]);
      fitTab(t);
    }
    if (e.g != null && groups.has(e.g)) t.groupId = e.g;
    if (e.name) { t.customTitle = e.name; t.titleEl.textContent = e.name; }
  }
  for (const [id] of groups) dropGroupIfEmpty(id); // groups whose tabs failed to spawn
  renderStrip();
  const idx = Math.min(saved.active ?? 0, tabs.length - 1);
  if (tabs[idx]) activateTab(tabs[idx]);
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
  hit.p.term.write(b64ToBytes(e.payload.data));
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
    { label: 'New tab', kbd: '⌘T', run: () => createTab() },
    { label: 'Close pane / tab', kbd: '⌘W', run: () => closeFocused() },
    { label: 'Split right', kbd: '⌘D', run: () => splitPane('row') },
    { label: 'Split down', kbd: '⇧⌘D', run: () => splitPane('column') },
    { label: 'Zoom pane (toggle)', kbd: '⇧⌘↵', run: () => toggleZoom() },
    { label: 'Broadcast input to all panes (toggle)', kbd: '⇧⌘B', run: () => toggleBroadcast() },
    { label: 'Next tab', kbd: '⇧⌘}', run: () => cycleTab(1) },
    { label: 'Previous tab', kbd: '⇧⌘{', run: () => cycleTab(-1) },
    { label: 'Mission control', kbd: '⌘E', run: () => toggleMission() },
    { label: 'Find in scrollback', kbd: '⌘F', run: () => openFind() },
    { label: 'Clear terminal', kbd: '⌘K', run: () => activePane()?.term.clear() },
    { label: 'Toggle artifacts panel', kbd: '⇧⌘A', run: () => togglePanel() },
    { label: 'Settings', kbd: '⌘,', run: () => toggleSettings() },
    { label: 'Copy last command output', kbd: '', run: () => copyLastOutput() },
    { label: 'Jump to previous prompt', kbd: '⌘↑', run: () => jumpPrompt(-1) },
    { label: 'Jump to next prompt', kbd: '⌘↓', run: () => jumpPrompt(1) },
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
  if (!e.metaKey) return;
  if (e.shiftKey) {
    const k = e.key.toLowerCase();
    if (k === 'a') { e.preventDefault(); togglePanel(); }
    else if (k === 'd') { e.preventDefault(); splitPane('column'); }
    else if (k === 'b') { e.preventDefault(); toggleBroadcast(); }
    else if (e.key === 'Enter') { e.preventDefault(); toggleZoom(); }
    else if (e.key === '{' || e.key === '[') { e.preventDefault(); cycleTab(-1); }
    else if (e.key === '}' || e.key === ']') { e.preventDefault(); cycleTab(1); }
    return;
  }
  const k = e.key.toLowerCase();
  if (k === 't') { e.preventDefault(); createTab(); }
  else if (k === 'w') { e.preventDefault(); closeFocused(); }
  else if (k === 'd') { e.preventDefault(); splitPane('row'); }
  else if (k === 'e') { e.preventDefault(); toggleMission(); }
  else if (k === 'f') { e.preventDefault(); openFind(); }
  else if (k === 'p') { e.preventDefault(); togglePalette(); }
  else if (k === 'k') { e.preventDefault(); activePane()?.term.clear(); }
  else if (k === 'arrowup') { e.preventDefault(); jumpPrompt(-1); }
  else if (k === 'arrowdown') { e.preventDefault(); jumpPrompt(1); }
  else if (k === ',') { e.preventDefault(); toggleSettings(); }
  else if (k === '=' || k === '+') { e.preventDefault(); adjustFont(0.5); }
  else if (k === '-') { e.preventDefault(); adjustFont(-0.5); }
  else if (k === '0') { e.preventDefault(); adjustFont(0); }
  else if (/^[1-9]$/.test(k)) { e.preventDefault(); const t = tabs[+k - 1]; if (t) activateTab(t); }
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
  try {
    await Promise.all([
      document.fonts.load('100 60px "Raleway"'),
      document.fonts.load('400 14px "JetBrains Mono"'),
      document.fonts.load('700 14px "JetBrains Mono"'),
    ]);
  } catch {}
  runSplash();
}
boot();
