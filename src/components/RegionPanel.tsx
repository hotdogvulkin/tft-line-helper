import type { RankedVariant } from '../lib/types'

const TIER_COLOR: Record<string, string> = {
  S: '#f59e0b',
  A: '#3b82f6',
  B: '#22c55e',
  C: '#6b7280',
}

const PLAYSTYLE_LABEL: Record<string, string> = {
  fast8:           'Fast 8',
  fast9:           'Fast 9',
  fast9_cashout:   'Fast 9',
  reroll:          'Reroll',
  reroll_cashout:  'Reroll',
  fast8_or_fast10: 'Fast 8/10',
}

function formatItems(carryItems: Record<string, string[]>): string {
  const entries = Object.entries(carryItems)
  if (entries.length === 0) return ''
  return entries
    .slice(0, 2)
    .map(([unit, items]) => `${unit}: ${items.slice(0, 3).join(' + ')}`)
    .join(' · ')
}

function formatAugments(synergies: { augment: string; score: number; note: string }[]): string {
  return [...synergies]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(a => a.augment)
    .join(' · ')
}

interface RegionPanelProps {
  regionName: string
  variants: RankedVariant[]
  accentColor: string
  onSelectVariant: (rv: RankedVariant) => void
  onClose: () => void
}

export default function RegionPanel({
  regionName,
  variants,
  accentColor,
  onSelectVariant,
  onClose,
}: RegionPanelProps) {
  // accentColor is always a 6-digit hex — append 66 for ~40% opacity border
  const accentBorder = `${accentColor}66`

  return (
    <div className="rp-panel">
      <div className="rp-header">
        <button className="rp-close" onClick={onClose} title="Back">←</button>
        <span className="rp-region-name" style={{ color: accentColor }}>
          {regionName}
        </span>
      </div>

      <div className="rp-cards">
        {variants.length === 0 ? (
          <div className="rp-empty">No comps for this region.</div>
        ) : (
          variants.map(rv => {
            const tierColor = TIER_COLOR[rv.variant.tier] ?? '#6b7280'
            const itemStr   = formatItems(rv.variant.carryItems)
            const augStr    = formatAugments(rv.variant.augmentSynergies)

            return (
              <div
                key={rv.variant.id}
                className="rp-card"
                style={{ borderColor: accentBorder }}
                onClick={() => onSelectVariant(rv)}
              >
                <div className="rp-card-top">
                  <span className="rp-card-name">{rv.variant.name}</span>
                  <div className="rp-card-badges">
                    <span
                      className="rp-tier-badge"
                      style={{ color: tierColor, borderColor: `${tierColor}99` }}
                    >
                      {rv.variant.tier}
                    </span>
                    <span className="rp-card-style">
                      {PLAYSTYLE_LABEL[rv.variant.playstyle] ?? rv.variant.playstyle}
                    </span>
                  </div>
                </div>

                {rv.variant.coreUnits.length > 0 && (
                  <div className="rp-units">
                    {rv.variant.coreUnits.slice(0, 6).map((u, i) => (
                      <span key={i} className="rp-unit-pill">{u}</span>
                    ))}
                  </div>
                )}

                {rv.variant.gameplan && (
                  <div className="rp-wincon">{rv.variant.gameplan}</div>
                )}

                {itemStr && (
                  <div className="rp-meta-line">
                    <span className="rp-meta-label">Items</span>
                    <span className="rp-meta-value">{itemStr}</span>
                  </div>
                )}

                {augStr && (
                  <div className="rp-meta-line">
                    <span className="rp-meta-label">Augs</span>
                    <span className="rp-meta-value">{augStr}</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
