import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import path from 'path';
import fs from 'fs';

// Linux & Docker hardware acceleration & sandbox compatibility flags
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
  app.commandLine.appendSwitch('disable-dev-shm-usage'); // Crucial for Docker containers with limited /dev/shm
  app.commandLine.appendSwitch('disable-gpu-process-crash-limit');
}

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: '#040810',
    title: 'SCADA 工业组态大屏工作台',
    frame: true, // Native window frame for cross-platform compatibility
    autoHideMenuBar: true,
    show: false, // Show once ready to avoid white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false
    }
  });

  // Remove default menu for clean SCADA workstation feel
  Menu.setApplicationMenu(null);

  // Ready to show
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Load URL or built file
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production built distribution
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL(devUrl);
    }
  }

  // External links opened in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------- IPC Handlers for Windows & Linux ----------------
function setupIpcHandlers() {
  // System Info
  ipcMain.handle('app:get-system-info', () => {
    return {
      isElectron: true,
      platform: process.platform, // 'win32' | 'linux' | 'darwin'
      arch: process.arch,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      appVersion: app.getVersion()
    };
  });

  // Native Save File Dialog
  ipcMain.handle('dialog:save-file', async (_event, payload: { data: string; defaultName?: string; filters?: any[] }) => {
    if (!mainWindow) return { success: false, error: 'No active window' };

    const { defaultName = 'scada-project.json', filters = [{ name: 'JSON Project', extensions: ['json'] }] } = payload;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: '导出大屏工程文件',
      defaultPath: defaultName,
      filters
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    try {
      await fs.promises.writeFile(result.filePath, payload.data, 'utf-8');
      return { success: true, filePath: result.filePath };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to write file' };
    }
  });

  // Native Open File Dialog
  ipcMain.handle('dialog:open-file', async (_event, payload?: { filters?: any[] }) => {
    if (!mainWindow) return { success: false, error: 'No active window' };

    const { filters = [{ name: 'SCADA JSON Project', extensions: ['json', 'txt'] }] } = payload || {};

    const result = await dialog.showOpenDialog(mainWindow, {
      title: '打开大屏工程文件',
      properties: ['openFile'],
      filters
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    try {
      const filePath = result.filePaths[0];
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return { success: true, filePath, content };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to read file' };
    }
  });

  // Window Controls
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window:is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window:toggle-fullscreen', () => {
    if (mainWindow) {
      const isFull = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!isFull);
      return !isFull;
    }
    return false;
  });

  // External shell opener
  ipcMain.handle('app:open-external', (_event, url: string) => {
    shell.openExternal(url);
  });
}

// App lifecycle with Single Instance Lock for Windows & Linux
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
