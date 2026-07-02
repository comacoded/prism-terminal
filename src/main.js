const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const THEME = {
  background: 'rgba(0,0,0,0)', foreground: '#e8e8ea', cursor: '#ffffff',
  cursorAccent: '#0a0a0a', selectionBackground: 'rgba(120,160,255,0.35)',
  black: '#3a3a3c', red: '#ff6d6d', green: '#56d364', yellow: '#e3b341',
  blue: '#79b8ff', magenta: '#d2a8ff', cyan: '#76e3ea', white: '#d9d9de',
  brightBlack: '#6e6e73', brightRed: '#ff8585', brightGreen: '#7ee787',
  brightYellow: '#f2cc60', brightBlue: '#a5d2ff', brightMagenta: '#e0c4ff',
  brightCyan: '#9bf0f5', brightWhite: '#ffffff',
};

// Glow markers: the LLM work-spinner's live elapsed timer, e.g. "(6s · ..."
const WORK_RE = /\(\d+s[\s·)]|esc to interrupt/i;
const WORK_HOLD_MS = 2500; // bridge spinner redraws so the glow never flickers
const WORK_SCAN_MS = 400;
const NOTIFY_CMD_MS = 15000; // commands longer than this notify when you're away
const MAX_RESTORE_TABS = 8;
let HOME = '';

const tabsEl = document.getElementById('tabs');
const panesEl = document.getElementById('panes');
const newTabBtn = document.getElementById('new-tab');
const toggleArtBtn = document.getElementById('toggle-artifacts');
const artBadge = document.getElementById('art-badge');
const artCount = document.getElementById('art-count');
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

const tabs = [];
let activeTab = null;
let tabCounter = 0;
let ready = false;

// Tab groups (Chrome-style): id -> { id, name, color, chipEl }
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

// --- Settings -----------------------------------------------------------------
const DEFAULT_SETTINGS = { fontSize: 13.5, tint: 45, glow: true };
let settings = { ...DEFAULT_SETTINGS };
function applySettings(save) {
  document.body.style.background = `rgba(10, 11, 16, ${settings.tint / 100})`;
  document.body.classList.toggle('glow-off', !settings.glow);
  for (const t of tabs) t.term.options.fontSize = settings.fontSize;
  if (activeTab) fitTab(activeTab);
  setFont.value = settings.fontSize;
  setFontVal.textContent = `${settings.fontSize}`;
  setTint.value = settings.tint;
  setTintVal.textContent = `${settings.tint}%`;
  setGlow.checked = settings.glow;
  if (save) try { localStorage.setItem('prism.settings', JSON.stringify(settings)); } catch {}
}
function loadSettings() {
  try { settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('prism.settings') || '{}') }; } catch {}
  applySettings(false);
}
function adjustFont(delta) {
  settings.fontSize = delta === 0
    ? DEFAULT_SETTINGS.fontSize
    : Math.min(20, Math.max(10, settings.fontSize + delta));
  applySettings(true);
}
function toggleSettings() {
  settingsEl.classList.toggle('hidden');
  if (settingsEl.classList.contains('hidden')) activeTab?.term.focus();
}
settingsBtn.addEventListener('mousedown', (e) => { e.preventDefault(); toggleSettings(); });
setFont.addEventListener('input', () => { settings.fontSize = parseFloat(setFont.value); applySettings(true); });
setTint.addEventListener('input', () => { settings.tint = parseInt(setTint.value, 10); applySettings(true); });
setGlow.addEventListener('change', () => { settings.glow = setGlow.checked; applySettings(true); });
document.getElementById('set-reset').addEventListener('mousedown', (e) => {
  e.preventDefault();
  settings = { ...DEFAULT_SETTINGS };
  applySettings(true);
});

// --- Glow -------------------------------------------------------------------
function syncGlow() {
  document.body.classList.toggle('coding', activeTab?.burstActive ?? false);
}
function tabState(t) {
  if (t.exited) return 'exited';
  if (t.burstActive) return 'working';
  if (t.agentActive) return 'ready';
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
function scanWork(t) {
  if (t.exited || !t.agentActive) return false;
  const buf = t.term.buffer.active;
  for (let i = t.term.rows - 1; i >= 0; i--) {
    const line = buf.getLine(buf.baseY + i);
    if (line && WORK_RE.test(line.translateToString(true))) return true;
  }
  return false;
}
setInterval(() => {
  for (const t of tabs) {
    if (scanWork(t)) {
      t.workSeen = Date.now();
      if (!t.burstActive) { t.burstActive = true; refreshTab(t); syncGlow(); }
    } else if (t.burstActive && Date.now() - t.workSeen > WORK_HOLD_MS) {
      t.burstActive = false;
      refreshTab(t); syncGlow();
    }
  }
}, WORK_SCAN_MS);
function clearWork(t) {
  t.burstActive = false; t.workSeen = 0;
  refreshTab(t); syncGlow();
}

// --- Footer -----------------------------------------------------------------
function renderFooter() {
  const t = activeTab;
  if (!t) { fCwd.textContent = fBranch.textContent = fCmd.textContent = fProc.textContent = fUp.textContent = ''; return; }
  fCwd.textContent = t.cwd ? tilde(t.cwd) : '~';
  fBranch.textContent = t.branch || '';
  fBranch.style.display = t.branch ? 'inline-flex' : 'none';
  const lc = t.lastCmd;
  if (lc) {
    const ok = !lc.code;
    fCmd.textContent = `${ok ? '✓' : '✗' + lc.code} ${fmtDur(lc.dur)}`;
    fCmd.classList.toggle('err', !ok);
  }
  fCmd.style.display = lc ? 'inline-flex' : 'none';
  fProc.textContent = t.exited ? 'exited' : t.fgProcess || 'shell';
  fUp.textContent = uptime(Date.now() - t.startTime);
}

// --- App-facing protocol handlers (OSC 7 / 9 / 777) ---------------------------
function appNotify(t, title, body) {
  if (!document.hasFocus() || t !== activeTab) invoke('notify_user', { title, body });
}
function setTabProgress(t, state, pct) {
  const el = t.progEl;
  if (!state || Number.isNaN(state)) { el.style.display = 'none'; el.className = 'tab-progress'; return; }
  el.style.display = 'block';
  el.classList.toggle('err', state === 2);
  el.classList.toggle('indet', state === 3);
  el.style.width = state === 3 ? '100%' : `${Math.max(0, Math.min(100, pct))}%`;
}
function hookAppProtocols(t) {
  // OSC 7: cwd reporting (file:// URL) — instant, works over ssh, beats lsof polling.
  t.term.parser.registerOscHandler(7, (data) => {
    if (!data.startsWith('file://')) return true;
    let path = data.slice(7);
    const slash = path.indexOf('/');
    if (slash === -1) return true;
    path = path.slice(slash);
    try { path = decodeURIComponent(path); } catch {}
    if (path && t.cwd !== path) {
      t.cwd = path;
      if (t === activeTab) renderFooter();
      persistSession();
    }
    return true;
  });
  // OSC 9: ConEmu-style — "9;4;state;pct" is taskbar progress, anything else is a toast.
  t.term.parser.registerOscHandler(9, (data) => {
    if (data.startsWith('4;')) {
      const [, st, pr] = data.split(';');
      setTabProgress(t, parseInt(st, 10), parseInt(pr ?? '0', 10) || 0);
    } else if (data) {
      appNotify(t, 'Terminal', data);
    }
    return true;
  });
  // OSC 777: urxvt-style "notify;title;body".
  t.term.parser.registerOscHandler(777, (data) => {
    const parts = data.split(';');
    if (parts[0] === 'notify' && parts[1]) appNotify(t, parts[1], parts.slice(2).join(';'));
    return true;
  });
}

// --- Semantic prompts (OSC 133, emitted by the injected zsh hooks) -----------
function hookPromptMarks(t) {
  t.term.parser.registerOscHandler(133, (data) => {
    const kind = data[0];
    if (kind === 'A') { // prompt start
      const m = t.term.registerMarker(0);
      if (m) t.marks.push(m);
      if (t.marks.length > 400) t.marks.shift();
    } else if (kind === 'C') { // command output starts
      t.cmdStart = { time: Date.now(), marker: t.term.registerMarker(0) };
    } else if (kind === 'D' && t.cmdStart) { // command finished
      const code = data.length > 2 ? parseInt(data.slice(2), 10) || 0 : 0;
      t.lastCmd = {
        dur: Date.now() - t.cmdStart.time,
        code,
        startMarker: t.cmdStart.marker,
        endMarker: t.term.registerMarker(0),
      };
      t.cmdStart = null;
      onCommandEnd(t);
    }
    return true;
  });
}
function onCommandEnd(t) {
  if (t === activeTab) renderFooter();
  const lc = t.lastCmd;
  if (lc.dur >= NOTIFY_CMD_MS && (!document.hasFocus() || t !== activeTab)) {
    invoke('notify_user', {
      title: 'Command finished',
      body: `${lc.code ? 'exit ' + lc.code : 'ok'} · ${fmtDur(lc.dur)} · ${tilde(t.cwd || '')}`,
    });
  }
}
function jumpPrompt(dir) {
  const t = activeTab;
  if (!t) return;
  t.marks = t.marks.filter((m) => !m.isDisposed && m.line !== -1);
  if (!t.marks.length) return;
  const cur = t.term.buffer.active.viewportY;
  const lines = t.marks.map((m) => m.line).sort((a, b) => a - b);
  const target = dir < 0 ? [...lines].reverse().find((l) => l < cur) : lines.find((l) => l > cur);
  if (target != null) t.term.scrollToLine(target);
}
function copyLastOutput() {
  const t = activeTab;
  const lc = t?.lastCmd;
  if (!lc || !lc.startMarker || lc.startMarker.line === -1 || lc.endMarker.line === -1) return;
  const buf = t.term.buffer.active;
  const out = [];
  for (let l = lc.startMarker.line; l < lc.endMarker.line; l++) {
    const line = buf.getLine(l);
    if (line) out.push(line.translateToString(true));
  }
  if (out.length) copyText(out.join('\n'));
}

// --- Artifacts rail ---------------------------------------------------------
function renderArtifacts(tab) {
  artCount.textContent = tab.artifacts.length ? String(tab.artifacts.length) : '';
  artList.replaceChildren();
  if (tab.artifacts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'art-empty';
    empty.textContent = 'Files an agent writes or edits appear here.';
    artList.appendChild(empty);
    return;
  }
  for (const rec of tab.artifacts) {
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
    row.append(name, meta);
    row.addEventListener('click', () => invoke('artifact_reveal', { path: rec.path }));
    artList.appendChild(row);
  }
}
function updateArtBadge() {
  const n = activeTab?.artifacts.length ?? 0;
  artBadge.textContent = n ? String(n) : '';
  artBadge.style.display = n ? 'grid' : 'none';
}

// --- Tabs -------------------------------------------------------------------
async function createTab(startCwd) {
  tabCounter += 1;
  const label = `Session ${tabCounter}`;

  const paneEl = document.createElement('div');
  paneEl.className = 'pane';
  const termEl = document.createElement('div');
  termEl.className = 'term';
  paneEl.appendChild(termEl);
  panesEl.appendChild(paneEl);

  const term = new Terminal({
    allowProposedApi: true, // the unicode-graphemes addon registers via proposed API
    minimumContrastRatio: 4.5, // keep inverse/dim text readable on the translucent glass
    allowTransparency: true, fontFamily: '"JetBrains Mono", Menlo, monospace',
    fontSize: settings.fontSize, lineHeight: 1.2, cursorBlink: true, cursorStyle: 'bar',
    scrollback: 10000, theme: THEME,
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
    id = await invoke('pty_spawn', { cwd: startCwd ?? activeTab?.cwd ?? null, rows: term.rows, cols: term.cols });
  } catch (err) {
    term.dispose();
    paneEl.remove();
    console.error('pty_spawn failed:', err);
    return;
  }

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  const dotEl = document.createElement('span'); dotEl.className = 'dot';
  const titleEl = document.createElement('span'); titleEl.className = 'tab-title'; titleEl.textContent = label;
  const closeEl = document.createElement('span'); closeEl.className = 'tab-close'; closeEl.innerHTML = X_ICON;
  const progEl = document.createElement('span'); progEl.className = 'tab-progress';
  tabEl.append(dotEl, titleEl, closeEl, progEl);
  tabsEl.insertBefore(tabEl, newTabBtn); // the + button stays after the last tab

  const tab = {
    id, term, fit, search, paneEl, tabEl, titleEl, progEl,
    exited: false, fgProcess: '', agentActive: false, startTime: Date.now(),
    cwd: startCwd || '', branch: '', burstActive: false, workSeen: 0,
    stateSince: Date.now(), marks: [], cmdStart: null, lastCmd: null,
    artifacts: [], groupId: null,
  };
  tabs.push(tab);
  refreshTab(tab);
  hookPromptMarks(tab);
  hookAppProtocols(tab);
  search.onDidChangeResults(({ resultIndex, resultCount }) => {
    if (tab === activeTab && !findBar.classList.contains('hidden')) {
      findCount.textContent = resultCount ? `${resultIndex + 1}/${resultCount}` : '0/0';
    }
  });

  term.onData((d) => invoke('pty_write', { id, data: d }));
  term.onTitleChange((t2) => { if (t2) titleEl.textContent = t2; });
  tabEl.addEventListener('mousedown', (e) => { if (closeEl.contains(e.target)) return; activateTab(tab); });
  closeEl.addEventListener('mousedown', (e) => { e.stopPropagation(); closeTab(tab); });
  tabEl.addEventListener('contextmenu', (e) => { e.preventDefault(); openTabMenu(tab, e.clientX, e.clientY); });

  activateTab(tab);
  persistSession();
}

// --- Tab groups ---------------------------------------------------------------
function tabGroup(t) { return t.groupId != null ? groups.get(t.groupId) : null; }
function styleTabGroup(t) {
  const g = tabGroup(t);
  t.tabEl.style.borderColor = g ? rgba(g.color, 0.55) : '';
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
  el.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); openGroupEditor(g); });
  g.chipEl = el;
  updateChip(g);
  return el;
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
  const g = { id: ++groupCounter, name: '', color, chipEl: null };
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
      for (const t of tabs) styleTabGroup(t);
      geColors.querySelectorAll('.ge-color').forEach((d) => d.classList.toggle('sel', d === dot));
      persistSession();
    });
    geColors.appendChild(dot);
  }
  groupEditor.classList.remove('hidden');
  const r = (g.chipEl || tabsEl).getBoundingClientRect();
  groupEditor.style.left = `${Math.min(r.left, window.innerWidth - 240)}px`;
  groupEditor.style.top = `${r.bottom + 8}px`;
  geName.focus();
  geName.select();
}
function closeGroupEditor() {
  if (groupEditor.classList.contains('hidden')) return;
  groupEditor.classList.add('hidden');
  editingGroup = null;
  activeTab?.term.focus();
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
  if (!ctxMenu.classList.contains('hidden') && !ctxMenu.contains(e.target)) closeCtxMenu();
  if (!groupEditor.classList.contains('hidden') && !groupEditor.contains(e.target)
      && !(editingGroup?.chipEl?.contains(e.target))) closeGroupEditor();
}, true);

function activateTab(tab) {
  activeTab = tab;
  for (const t of tabs) {
    const on = t === tab;
    t.paneEl.classList.toggle('hidden', !on);
    t.tabEl.classList.toggle('active', on);
  }
  fitTab(tab);
  syncGlow();
  renderFooter();
  renderArtifacts(tab);
  updateArtBadge();
  invoke('set_active', { id: tab.id });
  tab.term.focus();
  persistSession();
}
function cycleTab(dir) {
  if (tabs.length < 2 || !activeTab) return;
  const idx = tabs.indexOf(activeTab);
  activateTab(tabs[(idx + dir + tabs.length) % tabs.length]);
}
function fitTab(tab) {
  if (tab.paneEl.classList.contains('hidden')) return;
  try { tab.fit.fit(); } catch { return; }
  if (!tab.exited) invoke('pty_resize', { id: tab.id, rows: tab.term.rows, cols: tab.term.cols });
}
function closeTab(tab) {
  if (!tab.exited) invoke('pty_kill', { id: tab.id });
  tab.term.dispose();
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

// --- Session restore ----------------------------------------------------------
function persistSession() {
  try {
    localStorage.setItem('prism.session', JSON.stringify({
      tabs: tabs.map((t) => ({ cwd: t.cwd || '', g: t.groupId })),
      groups: [...groups.values()].map(({ id, name, color }) => ({ id, name, color })),
      active: Math.max(0, tabs.indexOf(activeTab)),
    }));
  } catch { /* storage unavailable; live session still works */ }
}
async function startTabs() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('prism.session')); } catch {}
  // legacy format stored plain cwd strings
  const entries = (saved?.tabs || (saved?.cwds || []).map((cwd) => ({ cwd, g: null })))
    .filter((e) => e.cwd).slice(0, MAX_RESTORE_TABS);
  if (!entries.length) { await createTab(); return; }
  for (const g of saved?.groups || []) {
    groups.set(g.id, { id: g.id, name: g.name || '', color: g.color, chipEl: null });
    groupCounter = Math.max(groupCounter, g.id);
  }
  for (const e of entries) {
    await createTab(e.cwd);
    if (e.g != null && groups.has(e.g)) tabs[tabs.length - 1].groupId = e.g;
  }
  for (const [id] of groups) dropGroupIfEmpty(id); // groups whose tabs failed to spawn
  renderStrip();
  const idx = Math.min(saved.active ?? 0, tabs.length - 1);
  if (tabs[idx]) activateTab(tabs[idx]);
}

// --- IPC routing ------------------------------------------------------------
function tabById(id) { return tabs.find((t) => t.id === id); }

listen('pty://data', (e) => {
  const t = tabById(e.payload.id); if (!t) return;
  t.term.write(b64ToBytes(e.payload.data));
});
listen('pty://exit', (e) => {
  const t = tabById(e.payload.id); if (!t) return;
  t.exited = true; t.fgProcess = ''; t.agentActive = false;
  clearWork(t);
  setTabProgress(t, 0, 0);
  t.term.write('\r\n\x1b[2m[process exited]\x1b[0m\r\n');
  if (t === activeTab) renderFooter();
});
listen('pty://proc', (e) => {
  const t = tabById(e.payload.id); if (!t) return;
  t.fgProcess = e.payload.proc;
  t.agentActive = e.payload.active;
  if (!e.payload.active && t.burstActive) clearWork(t); else refreshTab(t);
  if (t === activeTab) renderFooter();
});
listen('footer://update', (e) => {
  const t = tabById(e.payload.id); if (!t) return;
  const moved = t.cwd !== e.payload.cwd;
  t.cwd = e.payload.cwd; t.branch = e.payload.branch;
  if (t === activeTab) renderFooter();
  if (moved) persistSession();
});
// Dropped files paste their shell-escaped paths at the active tab's cursor.
function shellEscape(p) {
  return /[^\w@%+=:,./-]/.test(p) ? `'${p.replace(/'/g, `'\\''`)}'` : p;
}
window.__TAURI__.webview.getCurrentWebview().onDragDropEvent((e) => {
  if (e.payload.type !== 'drop') return;
  const t = activeTab;
  const paths = e.payload.paths || [];
  if (!t || t.exited || !paths.length) return;
  invoke('pty_write', { id: t.id, data: paths.map(shellEscape).join(' ') + ' ' });
  t.term.focus();
});
listen('artifacts://update', (e) => {
  const t = tabById(e.payload.id); if (!t) return;
  const grew = e.payload.list.length > t.artifacts.length;
  t.artifacts = e.payload.list;
  if (t === activeTab) { renderArtifacts(t); updateArtBadge(); }
  if (grew && !document.body.classList.contains('panel-open')) {
    toggleArtBtn.classList.remove('pulse');
    void toggleArtBtn.offsetWidth;
    toggleArtBtn.classList.add('pulse');
  }
});

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
  activeTab?.search.clearDecorations();
  activeTab?.term.focus();
}
function doFind(dir) {
  const t = activeTab;
  if (!t || !findInput.value) return;
  if (dir < 0) t.search.findPrevious(findInput.value, { decorations: FIND_DECOR });
  else t.search.findNext(findInput.value, { decorations: FIND_DECOR });
}
findInput.addEventListener('input', () => {
  activeTab?.search.findNext(findInput.value, { decorations: FIND_DECOR, incremental: true });
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
    { label: 'Close tab', kbd: '⌘W', run: () => activeTab && closeTab(activeTab) },
    { label: 'Next tab', kbd: '⇧⌘}', run: () => cycleTab(1) },
    { label: 'Previous tab', kbd: '⇧⌘{', run: () => cycleTab(-1) },
    { label: 'Mission control', kbd: '⌘E', run: () => toggleMission() },
    { label: 'Find in scrollback', kbd: '⌘F', run: () => openFind() },
    { label: 'Clear terminal', kbd: '⌘K', run: () => activeTab?.term.clear() },
    { label: 'Toggle artifacts panel', kbd: '⇧⌘A', run: () => togglePanel() },
    { label: 'Settings', kbd: '⌘,', run: () => toggleSettings() },
    { label: 'Copy last command output', kbd: '', run: () => copyLastOutput() },
    { label: 'Jump to previous prompt', kbd: '⌘↑', run: () => jumpPrompt(-1) },
    { label: 'Jump to next prompt', kbd: '⌘↓', run: () => jumpPrompt(1) },
  ];
  if (activeTab?.cwd) {
    acts.push({ label: 'Reveal current folder in Finder', kbd: '', run: () => invoke('artifact_reveal', { path: activeTab.cwd }) });
  }
  for (const t of tabs) {
    acts.push({
      label: `Go to: ${t.titleEl.textContent}${t.cwd ? ' — ' + tilde(t.cwd) : ''}`,
      kbd: '', run: () => activateTab(t),
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
  activeTab?.term.focus();
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
    title.textContent = t.titleEl.textContent;
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
    cwd.textContent = t.cwd ? tilde(t.cwd) : '~';
    card.append(head, cwd);

    if (t.branch) {
      const branch = document.createElement('div');
      branch.className = 'm-branch';
      branch.textContent = t.branch;
      card.appendChild(branch);
    }
    if (t.artifacts.length) {
      const files = document.createElement('div');
      files.className = 'm-files';
      files.textContent = t.artifacts.slice(0, 3).map((r) => r.path.split('/').pop()).join(' · ');
      card.appendChild(files);
    }
    card.addEventListener('mousedown', () => { closeMission(); activateTab(t); });
    missionGrid.appendChild(card);
  }
}
function openMission() { renderMission(); missionEl.classList.remove('hidden'); }
function closeMission() { missionEl.classList.add('hidden'); activeTab?.term.focus(); }
function toggleMission() {
  if (missionEl.classList.contains('hidden')) openMission(); else closeMission();
}
missionEl.addEventListener('mousedown', (e) => { if (e.target === missionEl) closeMission(); });

// --- Controls ---------------------------------------------------------------
function togglePanel() {
  const open = document.body.classList.toggle('panel-open');
  toggleArtBtn.classList.toggle('active', open);
  requestAnimationFrame(() => { if (activeTab) fitTab(activeTab); });
}
newTabBtn.addEventListener('mousedown', (e) => { e.preventDefault(); if (ready) createTab(); });
toggleArtBtn.addEventListener('mousedown', (e) => { e.preventDefault(); togglePanel(); });
window.addEventListener('resize', () => { if (activeTab) fitTab(activeTab); });

window.addEventListener('keydown', (e) => {
  if (!ready) return;
  if (e.key === 'Escape') {
    if (!ctxMenu.classList.contains('hidden')) { e.preventDefault(); closeCtxMenu(); }
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
    else if (e.key === '{' || e.key === '[') { e.preventDefault(); cycleTab(-1); }
    else if (e.key === '}' || e.key === ']') { e.preventDefault(); cycleTab(1); }
    return;
  }
  const k = e.key.toLowerCase();
  if (k === 't') { e.preventDefault(); createTab(); }
  else if (k === 'w') { e.preventDefault(); if (activeTab) closeTab(activeTab); }
  else if (k === 'e') { e.preventDefault(); toggleMission(); }
  else if (k === 'f') { e.preventDefault(); openFind(); }
  else if (k === 'p') { e.preventDefault(); togglePalette(); }
  else if (k === 'k') { e.preventDefault(); activeTab?.term.clear(); }
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
  if (document.body.classList.contains('panel-open') && activeTab.artifacts.length) {
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
