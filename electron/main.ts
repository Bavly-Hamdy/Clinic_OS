import { app, BrowserWindow, shell, ipcMain, Tray, Menu, nativeImage } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set AppUserModelID for Windows Taskbar consistency (Strict requirement)
if (process.platform === 'win32') {
  app.setAppUserModelId('com.clinichub.app');
}

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
// app.getAppPath() correctly resolves the root in BOTH:
//   • Dev:        the project root (Clinic Hub-main/)
//   • Production: the asar bundle root (resources/app.asar)
// Using __dirname + '../..' fails in production because it exits the asar.
process.env.APP_ROOT = app.getAppPath();

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createWindow() {
  // Use a reliable path for the icon (works in both dev and production)
  const iconFileName = process.platform === 'win32' ? 'Icon.ico' : 'Icon.png';
  const iconPath = path.join(process.env.VITE_PUBLIC || '', iconFileName);
  const appIcon = nativeImage.createFromPath(iconPath);

  // Fallback check
  if (appIcon.isEmpty()) {
    console.error('Critical: Failed to load app icon from:', iconPath);
  }

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: appIcon,
    title: 'Clinic Hub',
    frame: false, // Custom Title Bar
    titleBarStyle: 'hidden',
    show: false, // Don't show until ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true, // IMPORTANT: Ensure web security is true for production
    },
  });

  // Remove the default menu bar
  win.setMenuBarVisibility(false);
  win.autoHideMenuBar = true;

  // Show window gracefully when it's ready
  win.once('ready-to-show', () => {
    win?.show();
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // Handle window close to minimize to tray instead
  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win?.hide();
    }
    return false;
  });
}

function createTray() {
  const iconPath = path.join(process.env.VITE_PUBLIC || '', 'Icon.ico');
  const appIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(appIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Clinic Hub', click: () => win?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => {
      isQuitting = true;
      app.quit();
    }}
  ]);
  
  tray.setToolTip('Clinic Hub Management System');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    win?.show();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore();
      if (!win.isVisible()) win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    
    // Check for updates
    if (process.env.NODE_ENV === 'production') {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });
}

// We use the top-level isQuitting variable instead of modifying the app object

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.on('show-notification', (event, title, body) => {
  // In a real app, you might use the native Notification module here
  log.info(`Notification requested: ${title} - ${body}`);
});

// Window Controls IPC
ipcMain.on('window-minimize', () => {
  win?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (win?.isMaximized()) {
    win?.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (!isQuitting) {
    win?.hide();
  } else {
    win?.close();
  }
});
