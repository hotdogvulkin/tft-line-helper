import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  setAlwaysOnTop:      (value: boolean)              => ipcRenderer.send('set-always-on-top', value),
  setComp:             (compKey: string)             => ipcRenderer.send('set-comp', compKey),
  toggleOverlay:       ()                            => ipcRenderer.send('overlay-toggle'),
  resizeOverlay:       (height: number)              => ipcRenderer.send('overlay-resize', height),
  getOverlayVisible:   ()                            => ipcRenderer.invoke('overlay-is-visible'),
  onCompUpdated:       (cb: (compKey: string) => void) => {
    ipcRenderer.on('comp-updated', (_event, compKey: string) => cb(compKey))
  },
  onOverlayVisibility: (cb: (visible: boolean) => void) => {
    ipcRenderer.on('overlay-visibility', (_event, visible: boolean) => cb(visible))
  },
})
