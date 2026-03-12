import type { RankedVariant } from '../lib/types'
import { HexGrid } from './TFTBoard'

const TIER_COLOR: Record<string, string> = {
  S: '#f0a830',
  A: '#4fa3d4',
  B: '#3dd4a0',
  X: '#14b8a6',
  C: '#7fa0be',
}
const TIER_BG: Record<string, string> = {
  S: 'rgba(240,168,48,0.14)',
  A: 'rgba(79,163,212,0.13)',
  B: 'rgba(61,212,160,0.12)',
  X: 'rgba(20,184,166,0.13)',
  C: 'rgba(127,160,190,0.10)',
}

interface Props {
  rv: RankedVariant
  onClose: () => void
}

export default function CheatSheet({ rv, onClose }: Props) {
  const { variant, archetype } = rv
  const bp = variant.boardProgression
  const latePositions = bp?.late.positions ?? []
  const lateUnits     = bp?.late.units ?? []
  const topAugs = [...variant.augmentSynergies].sort((a, b) => b.score - a.score).slice(0, 10)
  const tierColor = TIER_COLOR[variant.tier] ?? TIER_COLOR.C
  const tierBg    = TIER_BG[variant.tier]    ?? TIER_BG.C

  return (
    <div className="cs-overlay" onClick={(e) => e.stopPropagation()}>
      <button className="cs-close" onClick={onClose}>✕</button>

      <div className="cs-body">
        {/* ── Left column: board + identity ── */}
        <div className="cs-left">
          <div className="cs-board-scale">
            {latePositions.length > 0 ? (
              <HexGrid positions={latePositions} />
            ) : lateUnits.length > 0 ? (
              <div className="cs-unit-chips">
                {lateUnits.map((u, i) => <span key={i} className="cs-unit-chip">{u}</span>)}
              </div>
            ) : (
              <div className="cs-no-board">No board data</div>
            )}
          </div>

          <div className="cs-identity">
            <div className="cs-comp-name">{variant.name}</div>
            <div className="cs-comp-meta">
              <span
                className="cs-tier-badge"
                style={{ color: tierColor, background: tierBg, borderColor: tierColor + '55' }}
              >
                {variant.tier}-Tier
              </span>
              <span className="cs-region-tag">{archetype.name}</span>
            </div>
            <div className="cs-playstyle-row">
              <span className="cs-playstyle">{variant.playstyle}</span>
              <span className="cs-dot">·</span>
              <span className="cs-difficulty">{variant.difficulty}</span>
            </div>
          </div>
        </div>

        {/* ── Right column: 3 stacked sections ── */}
        <div className="cs-right">

          {/* Carry Items */}
          <div className="cs-section">
            <div className="cs-section-title">Carry Items</div>
            <div className="cs-items-list">
              {Object.entries(variant.carryItems).map(([carrier, items]) => (
                <div key={carrier} className="cs-items-row">
                  <span className="cs-carrier">{carrier}</span>
                  <div className="cs-item-pills">
                    {items.map((item, i) => (
                      <span key={i} className="cs-item-pill">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Augments */}
          <div className="cs-section">
            <div className="cs-section-title">Top Augments</div>
            <div className="cs-aug-list">
              {topAugs.map((aug, i) => {
                const required = aug.note.toUpperCase().includes('REQUIRED')
                return (
                  <span key={i} className={`cs-aug-badge${required ? ' cs-aug-required' : ''}`}>
                    {aug.augment}
                  </span>
                )
              })}
              {topAugs.length === 0 && (
                <span className="cs-empty">No augment data</span>
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="cs-section">
            <div className="cs-section-title">Quick Tips</div>
            <div className="cs-tips-list">
              {variant.tips.map((tip, i) => (
                <div key={i} className="cs-tip">{tip}</div>
              ))}
              {variant.tips.length === 0 && (
                <span className="cs-empty">No tips listed</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
