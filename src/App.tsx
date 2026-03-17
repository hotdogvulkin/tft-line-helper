import { useState, useEffect } from 'react'
import Tabs from './components/Tabs'
import OpenerMode from './components/OpenerMode'
import AugmentMode from './components/AugmentMode'
import data from './data/set16.json'
import type { TFTData } from './lib/types'

// window.process is not exposed with contextIsolation: true, so we detect
// Electron by the presence of the preload-injected bridge instead.
const isElectron = () => typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'

// Declare IPC bridge added by Electron preload
declare global {
  interface Window {
    electronAPI?: {
      setAlwaysOnTop:      (value: boolean) => void
      setComp:             (compKey: string) => void
      toggleOverlay:       () => void
      resizeOverlay:       (height: number) => void
      getOverlayVisible:   () => Promise<boolean>
      onCompUpdated:       (cb: (compKey: string) => void) => void
      onOverlayVisibility: (cb: (visible: boolean) => void) => void
    }
  }
}

const tftData = data as unknown as TFTData

export default function App() {
  const [tab,            setTab]            = useState(0)
  const [aot,            setAot]            = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)

  useEffect(() => {
    if (!isElectron()) return
    window.electronAPI?.getOverlayVisible?.().then(v => setOverlayVisible(v))
    window.electronAPI?.onOverlayVisibility?.(v => setOverlayVisible(v))
  }, [])

  function toggleAot() {
    const next = !aot
    setAot(next)
    if (isElectron()) window.electronAPI?.setAlwaysOnTop(next)
  }

  function toggleOverlay() {
    if (isElectron()) window.electronAPI?.toggleOverlay?.()
    // Optimistic update; real value comes back via onOverlayVisibility
    setOverlayVisible(v => !v)
  }

  return (
    <div className="app">
      <div className="app-header">
        <span className="app-title">TFT Line Helper</span>
        <span className="app-meta">
          Set {tftData.meta.set} · Patch {tftData.meta.patch}
        </span>
        {!isElectron() && (
          <div className="dl-group">
            <a
              className="dl-btn dl-btn--mac"
              href="https://github.com/hotdogvulkin/tft-line-helper/releases/latest/download/TFT.Line.Helper-1.0.0-arm64.dmg"
              download
            >
              ↓ Mac
            </a>
            <a
              className="dl-btn dl-btn--win"
              href="https://github.com/hotdogvulkin/tft-line-helper/releases/download/latest/TFT.Line.Helper.Setup.1.0.0.exe"
              download
            >
              ↓ Windows
            </a>
          </div>
        )}
        {isElectron() && (
          <>
            <button
              className={`aot-btn${overlayVisible ? ' active' : ''}`}
              onClick={toggleOverlay}
              title="Toggle overlay (Ctrl+Shift+T)"
            >
              🖥 {overlayVisible ? 'Overlay ON' : 'Overlay'}
            </button>
            <button
              className={`aot-btn${aot ? ' active' : ''}`}
              onClick={toggleAot}
              title="Toggle Always on Top"
            >
              📌 {aot ? 'Pinned' : 'Pin'}
            </button>
          </>
        )}
      </div>

      <Tabs active={tab} onChange={setTab} />

      {tab === 0 && <OpenerMode data={tftData} />}
      {tab === 1 && <AugmentMode data={tftData} />}
    </div>
  )
}
