import { app, BrowserWindow, ipcMain, globalShortcut, screen } from 'electron'
import path from 'path'

let win:        BrowserWindow | null = null
let overlayWin: BrowserWindow | null = null

const PRELOAD = path.join(__dirname, 'preload.js')

function createWindow() {
  win = new BrowserWindow({
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
  })

  if (process.env.NODE_ENV === 'production') {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    win.loadURL('http://localhost:5173')
  }
}

const OV_W = 320

function createOverlayWindow() {
  overlayWin = new BrowserWindow({
    width: OV_W,
    height: 40,
    x: overlayX(),
    y: 10,
    show: false,
    alwaysOnTop: true,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  overlayWin.setAlwaysOnTop(true, 'screen-saver')
  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (process.env.NODE_ENV === 'production') {
    overlayWin.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'overlay' })
  } else {
    overlayWin.loadURL('http://localhost:5173/#overlay')
  }

  overlayWin.on('closed', () => { overlayWin = null })
}

function overlayX() {
  return screen.getPrimaryDisplay().workAreaSize.width - OV_W - 10
}

function toggleOverlay() {
  if (!overlayWin) return
  if (overlayWin.isVisible()) {
    overlayWin.hide()
  } else {
    overlayWin.setPosition(overlayX(), 10)
    overlayWin.show()
  }
  const visible = overlayWin.isVisible()
  win?.webContents.send('overlay-visibility', visible)
}

app.whenReady().then(() => {
  createWindow()
  createOverlayWindow()

  const shortcutOk = globalShortcut.register('CommandOrControl+Shift+T', toggleOverlay)
  if (!shortcutOk) console.warn('[main] Ctrl+Shift+T shortcut could not be registered (already in use)')
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

ipcMain.on('set-always-on-top', (_event, value: boolean) => {
  win?.setAlwaysOnTop(value)
})

ipcMain.on('set-comp', (_event, compKey: string) => {
  overlayWin?.webContents.send('comp-updated', compKey)
})

ipcMain.on('overlay-toggle', (_event) => {
  toggleOverlay()
  // Send updated visibility back to the main window so the button can update
  const visible = overlayWin?.isVisible() ?? false
  win?.webContents.send('overlay-visibility', visible)
})

ipcMain.handle('overlay-is-visible', () => overlayWin?.isVisible() ?? false)

ipcMain.on('overlay-resize', (_event, height: number) => {
  overlayWin?.setBounds({ x: overlayX(), y: 10, width: OV_W, height })
})
