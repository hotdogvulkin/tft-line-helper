import type { RankedVariant } from '../lib/types'

interface LineCardProps {
  rv: RankedVariant
  rank?: 'PRIMARY' | 'SECONDARY' | 'PIVOT' | number
  selected?: boolean
  showScore?: boolean
  onClick: () => void
}

const TIER_CLASS: Record<string, string> = {
  S: 'badge-tier-S',
  A: 'badge-tier-A',
  B: 'badge-tier-B',
  C: 'badge-tier-C',
}

const RANK_LABELS: Record<string, string> = {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
  PIVOT: 'PIVOT',
}

const RANK_CLASS: Record<string, string> = {
  PRIMARY: 'badge-rank-primary',
  SECONDARY: 'badge-rank-secondary',
  PIVOT: 'badge-rank-pivot',
}

export default function LineCard({
  rv,
  rank,
  selected,
  showScore = true,
  onClick,
}: LineCardProps) {
  const tierCls = TIER_CLASS[rv.variant.tier] ?? 'badge-tier-C'

  return (
    <div
      className={`line-card${selected ? ' selected' : ''}`}
      onClick={onClick}
    >
      <div className="line-card-header">
        <div className="line-card-left">
          <div className="line-card-name">{rv.variant.name}</div>
          <div className="line-card-arch">{rv.archetype.name}</div>
        </div>
        <div className="line-card-badges">
          {typeof rank === 'string' && (
            <span className={`badge ${RANK_CLASS[rank] ?? 'badge-rank-pivot'}`}>
              {RANK_LABELS[rank] ?? rank}
            </span>
          )}
          {typeof rank === 'number' && rank <= 5 && (
            <span className="badge badge-rank-secondary">#{rank + 1}</span>
          )}
          {rv.force && <span className="badge badge-force">LOCK IN</span>}
          <span className={`badge ${tierCls}`}>{rv.variant.tier}</span>
          <span className="badge badge-playstyle">{rv.variant.playstyle}</span>
          <span className="badge badge-diff">{rv.variant.difficulty}</span>
        </div>
      </div>

      {rv.variant.coreUnits.length > 0 && (
        <div className="lc-units">
          {rv.variant.coreUnits.slice(0, 6).map((u, i) => (
            <span key={i} className="lc-unit-chip">{u}</span>
          ))}
        </div>
      )}

      {showScore && rv.score > 0 && (
        <div className="line-card-score" style={{ marginTop: 5 }}>
          Score: <span>{rv.score}</span>
        </div>
      )}

      {rv.reasons.length > 0 && (
        <div className="line-card-reasons">
          {rv.reasons.slice(0, 3).map((r, i) => (
            <div
              key={i}
              className={`reason-item ${r.value > 0 ? 'positive' : 'negative'}`}
            >
              {r.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
