const { app, BrowserWindow, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.ELECTRON_LOAD_VITE === '1';

// Must be set before 'ready' to reach the menu bar and userData path. Note this
// does not change the Dock tooltip when running unpackaged — that comes from
// the Electron.app bundle itself; only a packaged build fixes that.
app.setName('TodoToday');

// Storage always lives inside this project folder, regardless of whether
// the app is running from source or as a packaged build launched from
// elsewhere (e.g. an app.asar bundle, where __dirname would otherwise
// point inside the bundle instead of this folder).
const PROJECT_DIR = '/Users/Crisafulli/Documents/TodoToday';

function getDataDir() {
  return path.join(PROJECT_DIR, 'data');
}

function ensureDataDir() {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getFilePath(name) {
  return path.join(ensureDataDir(), `${name}.json`);
}

function readJSON(name, fallback = null) {
  try {
    const p = getFilePath(name);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.error(e);
  }
  return fallback;
}

function writeJSON(name, data) {
  const p = getFilePath(name);
  ensureDataDir();
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  lastWriteTime = Date.now();
}

let watcher = null;
let lastWriteTime = 0;
const WRITE_DEBOUNCE_MS = 600;

function setupFileWatcher(win) {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) return;
  if (watcher) {
    try { watcher.close(); } catch (_) {}
  }
  watcher = fs.watch(dir, { recursive: false }, (eventType, filename) => {
    if (eventType === 'change' && filename && filename.endsWith('.json')) {
      if (Date.now() - lastWriteTime < WRITE_DEBOUNCE_MS) return;
      if (win && !win.isDestroyed()) {
        win.webContents.send('storage-external-change');
      }
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 520,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'TodoToday',
    show: false,
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  setupFileWatcher(win);
  return win;
}

// A packaged build takes its Dock icon from build.mac.icon in package.json, but
// running from source shows Electron's own icon unless we set it at runtime.
function setDockIcon() {
  if (process.platform !== 'darwin' || !app.dock) return;
  const iconPath = path.join(__dirname, 'assets', 'icons', 'icon.png');
  if (!fs.existsSync(iconPath)) return;
  const image = nativeImage.createFromPath(iconPath);
  if (!image.isEmpty()) app.dock.setIcon(image);
}

app.whenReady().then(() => {
  setDockIcon();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (watcher) {
    try { watcher.close(); } catch (_) {}
    watcher = null;
  }
  app.quit();
});

// IPC: read/write data
ipcMain.handle('storage:read', (_, name) => readJSON(name, null));
ipcMain.handle('storage:write', (_, name, data) => {
  writeJSON(name, data);
  return true;
});
ipcMain.handle('storage:getDataPath', () => getDataDir());
