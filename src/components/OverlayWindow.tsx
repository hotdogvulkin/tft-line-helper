import { useState, useEffect, useMemo } from 'react'
import data from '../data/set16.json'
import type { TFTData, RankedVariant } from '../lib/types'
import { HexGrid } from './TFTBoard'
import { buildAugmentUniverse } from '../lib/scoring'
import { rankVariantsByAugments } from '../lib/recommend'

const tftData = data as unknown as TFTData

const COLLAPSED_H  = 40
const EXPANDED_H   = 460
const AUG_CHECK_H  = 230

const TIER_COLOR: Record<string, string> = {
  S: '#f0a830',
  A: '#4fa3d4',
  B: '#3dd4a0',
  X: '#14b8a6',
  C: '#7fa0be',
}

export default function OverlayWindow() {
  const [compKey,      setCompKey]      = useState<string | null>(null)
  const [expanded,     setExpanded]     = useState(false)
  const [augCheckMode, setAugCheckMode] = useState(false)
  const [ovAugs,       setOvAugs]       = useState<[string, string, string]>(['', '', ''])
  const [ovQueries,    setOvQueries]    = useState<[string, string, string]>(['', '', ''])
  const [ovOpenIdx,    setOvOpenIdx]    = useState<number | null>(null)

  // Set collapsed size on mount
  useEffect(() => {
    window.electronAPI?.resizeOverlay?.(COLLAPSED_H)
  }, [])

  // Listen for comp updates from main app
  useEffect(() => {
    window.electronAPI?.onCompUpdated?.((key: string) => setCompKey(key))
  }, [])

  const rv = useMemo((): RankedVariant | null => {
    if (!compKey) return null
    for (const arch of tftData.archetypes) {
      for (const variant of arch.variants) {
        if (variant.id === compKey) return { variant, archetype: arch, score: 0, reasons: [] }
      }
    }
    return null
  }, [compKey])

  const universe = useMemo(() => buildAugmentUniverse(tftData), [])

  const ovFilledAugs = useMemo(() => ovAugs.filter(a => a.length > 0), [ovAugs])

  const ovTopPick = useMemo(() => {
    if (ovFilledAugs.length === 0) return null
    return rankVariantsByAugments(ovFilledAugs, tftData)[0] ?? null
  }, [ovFilledAugs])

  function toggle() {
    const next = !expanded
    setExpanded(next)
    const h = next ? (augCheckMode ? AUG_CHECK_H : EXPANDED_H) : COLLAPSED_H
    window.electronAPI?.resizeOverlay?.(h)
  }

  function toggleAugCheck() {
    const next = !augCheckMode
    setAugCheckMode(next)
    if (expanded) window.electronAPI?.resizeOverlay?.(next ? AUG_CHECK_H : EXPANDED_H)
  }

  function setSlotAug(i: number, value: string) {
    const next = [...ovAugs] as [string, string, string]
    next[i] = value
    setOvAugs(next)
    const qNext = [...ovQueries] as [string, string, string]
    qNext[i] = ''
    setOvQueries(qNext)
    setOvOpenIdx(null)
  }

  function setSlotQuery(i: number, value: string) {
    const next = [...ovQueries] as [string, string, string]
    next[i] = value
    setOvQueries(next)
    setOvOpenIdx(value.length >= 1 ? i : null)
  }

  function clearSlot(i: number) {
    const nextAugs = [...ovAugs] as [string, string, string]
    nextAugs[i] = ''
    setOvAugs(nextAugs)
    const nextQ = [...ovQueries] as [string, string, string]
    nextQ[i] = ''
    setOvQueries(nextQ)
  }

  const tierColor = rv ? (TIER_COLOR[rv.variant.tier] ?? TIER_COLOR.C) : '#4d6880'

  return (
    <div className="ov-root" style={{ '--tier-color': tierColor } as React.CSSProperties}>

      {/* ── Collapsed bar / drag handle ── */}
      <div className="ov-bar">
        <div className="ov-bar-left">
          {augCheckMode ? (
            <span className="ov-name" style={{ color: '#c084fc' }}>Aug Check</span>
          ) : rv ? (
            <>
              <span className="ov-tier" style={{ color: tierColor }}>{rv.variant.tier}</span>
              <span className="ov-name">{rv.variant.name}</span>
            </>
          ) : (
            <span className="ov-name ov-name--dim">Select a comp</span>
          )}
        </div>
        <div className="ov-bar-controls">
          <button
            className={`ov-chevron${expanded ? ' ov-chevron--up' : ''}`}
            onClick={toggle}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            ▾
          </button>
          <button
            className={`ov-ac-toggle${augCheckMode ? ' ov-ac-toggle--on' : ''}`}
            onClick={toggleAugCheck}
            title="Augment Check"
          >
            🔮
          </button>
          <button
            className="ov-x"
            onClick={() => window.electronAPI?.toggleOverlay?.()}
            title="Hide overlay (Ctrl+Shift+T)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Aug Check panel ── */}
      {expanded && augCheckMode && (
        <div
          className="ov-ac-panel"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {([0, 1, 2] as const).map(i => {
            const filled = ovAugs[i]
            const q      = ovQueries[i]
            const isOpen = ovOpenIdx === i

            const filtered = q.length >= 1
              ? universe
                  .filter(a =>
                    a.toLowerCase().includes(q.toLowerCase()) &&
                    !ovAugs.includes(a)
                  )
                  .slice(0, 20)
              : []

            return (
              <div key={i} className="ov-ac-slot">
                <span className="ov-ac-num">{i + 1}</span>
                {filled ? (
                  <span className="ov-ac-match">
                    {filled}
                    <button
                      className="aug-chip-x"
                      style={{ marginLeft: 4 }}
                      onClick={() => clearSlot(i)}
                    >
                      ×
                    </button>
                  </span>
                ) : (
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      className="ov-ac-input"
                      placeholder={`Augment ${i + 1}…`}
                      value={q}
                      onChange={e => setSlotQuery(i, e.target.value)}
                      onFocus={() => q.length >= 1 && setOvOpenIdx(i)}
                      onBlur={() => setTimeout(() => setOvOpenIdx(null), 150)}
                    />
                    {isOpen && filtered.length > 0 && (
                      <div className="ov-ac-dropdown">
                        {filtered.map(aug => (
                          <div
                            key={aug}
                            className="aug-dropdown-item"
                            onMouseDown={() => setSlotAug(i, aug)}
                          >
                            {aug}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {ovTopPick && (
            <div
              className="ov-ac-best"
              onClick={() => {
                window.electronAPI?.setComp?.(ovTopPick.variant.id)
                setAugCheckMode(false)
                window.electronAPI?.resizeOverlay?.(EXPANDED_H)
              }}
            >
              <span style={{ color: '#f0a830', marginRight: 6 }}>Best →</span>
              <span style={{ color: '#dce9f5' }}>{ovTopPick.variant.name}</span>
              <span
                style={{
                  marginLeft: 6,
                  color: TIER_COLOR[ovTopPick.variant.tier] ?? TIER_COLOR.C,
                  fontSize: 10,
                }}
              >
                {ovTopPick.variant.tier}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Expanded comp panel ── */}
      {expanded && !augCheckMode && rv && (
        <div className="ov-panel">
          {/* Board */}
          {(() => {
            const positions = rv.variant.boardProgression?.late.positions ?? []
            const units     = rv.variant.boardProgression?.late.units     ?? []
            if (positions.length > 0) {
              return (
                <div className="ov-board-wrap">
                  <HexGrid positions={positions} />
                </div>
              )
            }
            if (units.length > 0) {
              return (
                <div className="ov-unit-chips">
                  {units.map((u, i) => <span key={i} className="ov-unit-chip">{u}</span>)}
                </div>
              )
            }
            return null
          })()}

          {/* Carry items */}
          {Object.keys(rv.variant.carryItems).length > 0 && (
            <div className="ov-section">
              <div className="ov-section-title">Carry Items</div>
              {Object.entries(rv.variant.carryItems).map(([carrier, items]) => (
                <div key={carrier} className="ov-items-row">
                  <span className="ov-carrier">{carrier}</span>
                  <div className="ov-item-pills">
                    {items.map((item, i) => <span key={i} className="ov-item-pill">{item}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top augments */}
          {rv.variant.augmentSynergies.length > 0 && (
            <div className="ov-section">
              <div className="ov-section-title">Top Augments</div>
              <div className="ov-aug-list">
                {[...rv.variant.augmentSynergies]
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 8)
                  .map((aug, i) => (
                    <span
                      key={i}
                      className={`ov-aug${aug.note.toUpperCase().includes('REQUIRED') ? ' ov-aug--required' : ''}`}
                    >
                      {aug.augment}
                    </span>
                  ))
                }
              </div>
            </div>
          )}

          {/* Tips */}
          {rv.variant.tips.length > 0 && (
            <div className="ov-section">
              <div className="ov-section-title">Quick Tips</div>
              {rv.variant.tips.slice(0, 3).map((tip, i) => (
                <div key={i} className="ov-tip">{tip}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expanded but no comp yet */}
      {expanded && !augCheckMode && !rv && (
        <div className="ov-empty">Open a comp in the main app</div>
      )}
    </div>
  )
}
