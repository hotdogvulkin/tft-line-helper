"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let win = null;
let overlayWin = null;
const PRELOAD = path_1.default.join(__dirname, 'preload.js');
function createWindow() {
    win = new electron_1.BrowserWindow({
        width: 520,
        height: 820,
        minWidth: 420,
        minHeight: 650,
        title: 'TFT Line Helper',
        backgroundColor: '#071a12',
        webPreferences: {
            preload: PRELOAD,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    if (process.env.NODE_ENV === 'production') {
        win.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    else {
        win.loadURL('http://localhost:5173');
    }
}
const OV_W = 320;
function createOverlayWindow() {
    const { width } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    overlayWin = new electron_1.BrowserWindow({
        width: OV_W,
        height: 40,
        x: width - OV_W - 10,
        y: 10,
        show: false,
        alwaysOnTop: true,
        transparent: true,
        frame: false,
        skipTaskbar: true,
        resizable: false,
        webPreferences: {
            preload: PRELOAD,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    overlayWin.setAlwaysOnTop(true, 'screen-saver');
    overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    if (process.env.NODE_ENV === 'production') {
        overlayWin.loadFile(path_1.default.join(__dirname, '../dist/index.html'), { hash: 'overlay' });
    }
    else {
        overlayWin.loadURL('http://localhost:5173/#overlay');
    }
    overlayWin.on('closed', () => { overlayWin = null; });
}
function toggleOverlay() {
    if (!overlayWin)
        return;
    if (overlayWin.isVisible()) {
        overlayWin.hide();
    }
    else {
        overlayWin.show();
        overlayWin.focus();
    }
    const visible = overlayWin.isVisible();
    win?.webContents.send('overlay-visibility', visible);
}
electron_1.app.whenReady().then(() => {
    createWindow();
    createOverlayWindow();
    const shortcutOk = electron_1.globalShortcut.register('CommandOrControl+Shift+T', toggleOverlay);
    if (!shortcutOk)
        console.warn('[main] Ctrl+Shift+T shortcut could not be registered (already in use)');
});
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
electron_1.ipcMain.on('set-always-on-top', (_event, value) => {
    win?.setAlwaysOnTop(value);
});
electron_1.ipcMain.on('set-comp', (_event, compKey) => {
    overlayWin?.webContents.send('comp-updated', compKey);
});
electron_1.ipcMain.on('overlay-toggle', (_event) => {
    toggleOverlay();
    // Send updated visibility back to the main window so the button can update
    const visible = overlayWin?.isVisible() ?? false;
    win?.webContents.send('overlay-visibility', visible);
});
electron_1.ipcMain.handle('overlay-is-visible', () => overlayWin?.isVisible() ?? false);
electron_1.ipcMain.on('overlay-resize', (_event, height) => {
    overlayWin?.setSize(OV_W, height);
});
