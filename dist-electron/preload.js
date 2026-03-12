"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    setAlwaysOnTop: (value) => electron_1.ipcRenderer.send('set-always-on-top', value),
    setComp: (compKey) => electron_1.ipcRenderer.send('set-comp', compKey),
    toggleOverlay: () => electron_1.ipcRenderer.send('overlay-toggle'),
    resizeOverlay: (height) => electron_1.ipcRenderer.send('overlay-resize', height),
    getOverlayVisible: () => electron_1.ipcRenderer.invoke('overlay-is-visible'),
    onCompUpdated: (cb) => {
        electron_1.ipcRenderer.on('comp-updated', (_event, compKey) => cb(compKey));
    },
    onOverlayVisibility: (cb) => {
        electron_1.ipcRenderer.on('overlay-visibility', (_event, visible) => cb(visible));
    },
});
