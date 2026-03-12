import { useState, useMemo } from 'react'
import type { TFTData, RankedVariant, AugmentCategory } from '../lib/types'
import LineView from './LineView'
import AugmentPicker from './AugmentPicker'
import LineCard from './LineCard'
import { rankVariantsByAugments } from '../lib/recommend'
import { normalize } from '../lib/normalize'

interface AugmentModeProps {
  data: TFTData
}

// ── Tier → color & glow ───────────────────────────────────
const TIER_COLOR: Record<string, string> = {
  S: '#f0a830',
  A: '#f97316',
  B: '#eab308',
  X: '#14b8a6',
  C: '#7fa0be',
}

const TIER_GLOW: Record<string, string> = {
  S: '0 0 8px rgba(240,168,48,0.45)',
  X: '0 0 8px rgba(20,184,166,0.4)',
}

// ── Category pill ─────────────────────────────────────────
const CAT_STYLE: Record<AugmentCategory, { bg: string; color: string }> = {
  EMBLEM:   { bg: 'rgba(168,85,247,0.18)', color: '#c084fc' },
  ECON:     { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80' },
  COMBAT:   { bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
  HERO:     { bg: 'rgba(20,184,166,0.15)', color: '#2dd4bf' },
  REROLL:   { bg: 'rgba(249,115,22,0.15)', color: '#fb923c' },
  ARTIFACT: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
}

const CAT_FILTER_ORDER: AugmentCategory[] = ['ECON', 'COMBAT', 'EMBLEM', 'REROLL', 'ARTIFACT']

export default function AugmentMode({ data }: AugmentModeProps) {
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState<AugmentCategory | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<RankedVariant | null>(null)
  const [augments, setAugments] = useState<string[]>([])

  const variantMap = useMemo(() => {
    const map: Record<string, RankedVariant> = {}
    for (const arch of data.archetypes) {
      for (const variant of arch.variants) {
        map[variant.id] = { variant, archetype: arch, score: 0, reasons: [] }
      }
    }
    return map
  }, [data])

  const filteredSignals = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.augmentSignals.signals.filter(s =>
      (!q || s.augment.toLowerCase().includes(q)) &&
      (!catFilter || s.category === catFilter)
    )
  }, [query, catFilter, data.augmentSignals.signals])

  // Per-augment signal matches for the check section
  const augmentMatches = useMemo(() =>
    augments.map(aug => {
      const nAug = normalize(aug)
      const sig = data.augmentSignals.signals.find(
        s => normalize(s.augment) === nAug
      )
      const rv = sig?.primaryComp ? variantMap[sig.primaryComp] : undefined
      const secondaryRv = sig?.secondaryComp ? variantMap[sig.secondaryComp] : undefined
      return { aug, sig, rv, secondaryRv }
    }), [augments, data, variantMap])

  // Ranked comps by selected augments
  const ranked = useMemo(() => {
    if (augments.length === 0) return []
    return rankVariantsByAugments(augments, data).slice(0, 5)
  }, [augments, data])

  if (selectedVariant) {
    return (
      <div className="content-scroll">
        <LineView rv={selectedVariant} onBack={() => setSelectedVariant(null)} />
      </div>
    )
  }

  return (
    <div className="content-scroll aug-mode-bg">

      {/* ── Augment Check ── */}
      <div className="aug-check-section">
        <div className="section-label">Augment Check</div>
        <AugmentPicker selected={augments} onChange={setAugments} data={data} max={3} />

        {/* Per-augment signal rows */}
        {augmentMatches.length > 0 && (
          <div className="aug-check-matches">
            {augmentMatches.map(({ aug, sig, rv, secondaryRv }, i) => {
              if (!sig) return null
              const tier     = rv?.variant.tier ?? 'C'
              const color    = TIER_COLOR[tier] ?? TIER_COLOR.C
              const cat      = sig.category
              const catStyle = cat ? CAT_STYLE[cat] : null
              const required = sig.note?.includes('REQUIRED')
              const clickable = !!rv

              return (
                <div
                  key={i}
                  className={`signal-item signal-item--rich${clickable ? ' signal-item--clickable' : ''}`}
                  style={{ '--tier-color': color } as React.CSSProperties}
                  onClick={() => rv && setSelectedVariant(rv)}
                >
                  {catStyle && cat ? (
                    <span
                      className="signal-cat-pill"
                      style={{ background: catStyle.bg, color: catStyle.color }}
                    >
                      {cat}
                    </span>
                  ) : (
                    <span className="signal-cat-pill signal-cat-pill--empty" />
                  )}

                  <span className="signal-aug">{sig.augment}</span>
                  <span className="signal-arrow">→</span>

                  <span className="signal-comp-wrap">
                    <span className="signal-comp-row">
                      <span
                        className="signal-comp"
                        style={{
                          color,
                          textShadow: TIER_GLOW[tier] ?? 'none',
                        }}
                      >
                        {rv?.variant.name ?? (sig.primaryComp ?? 'Any')}
                      </span>
                      {required && (
                        <span className="signal-required-badge">REQUIRED</span>
                      )}
                    </span>
                    {sig.note && (
                      <span className="signal-note">
                        {sig.note.replace(' — REQUIRED', '').replace(' — required', '')}
                      </span>
                    )}
                    {secondaryRv && (
                      <span className="signal-secondary-row">
                        <span className="signal-secondary-label">also →</span>
                        <span
                          className="signal-comp"
                          style={{ color: TIER_COLOR[secondaryRv.variant.tier] ?? TIER_COLOR.C }}
                          onClick={e => { e.stopPropagation(); setSelectedVariant(secondaryRv) }}
                        >
                          {secondaryRv.variant.name}
                        </span>
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Ranked recommendations */}
        {ranked.length > 0 && (
          <>
            <div className="section-label" style={{ marginTop: 14 }}>Best Picks</div>
            {ranked.map((rv, i) => (
              <LineCard
                key={rv.variant.id}
                rv={rv}
                rank={i}
                showScore
                onClick={() => {
                  window.electronAPI?.setComp?.(rv.variant.id)
                  setSelectedVariant(rv)
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* ── Signal Browser ── */}
      <div className="section-label" style={{ marginTop: 20 }}>Key Augment Signals</div>
      <div className="cat-filter-chips">
        {CAT_FILTER_ORDER.map(cat => {
          const s = CAT_STYLE[cat]
          const active = catFilter === cat
          return (
            <button
              key={cat}
              className={`cat-chip${active ? ' cat-chip--active' : ''}`}
              style={active ? { background: s.bg, color: s.color, borderColor: s.color } : {}}
              onClick={() => setCatFilter(prev => prev === cat ? null : cat)}
            >
              {cat}
            </button>
          )
        })}
      </div>
      <input
        className="signal-search"
        type="text"
        placeholder="Search augments..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div className="signal-list">
        {filteredSignals.map((sig, i) => {
          const rv         = sig.primaryComp ? variantMap[sig.primaryComp] : undefined
          const secondaryRv = sig.secondaryComp ? variantMap[sig.secondaryComp] : undefined
          const tier    = rv?.variant.tier ?? 'C'
          const color   = TIER_COLOR[tier] ?? TIER_COLOR.C
          const cat     = sig.category
          const catStyle = cat ? CAT_STYLE[cat] : null
          const required = sig.note?.includes('REQUIRED')
          const clickable = !!rv

          return (
            <div
              key={i}
              className={`signal-item signal-item--rich${clickable ? ' signal-item--clickable' : ''}`}
              style={{ '--tier-color': color } as React.CSSProperties}
              onClick={() => rv && setSelectedVariant(rv)}
            >
              {catStyle && cat ? (
                <span
                  className="signal-cat-pill"
                  style={{ background: catStyle.bg, color: catStyle.color }}
                >
                  {cat}
                </span>
              ) : (
                <span className="signal-cat-pill signal-cat-pill--empty" />
              )}

              <span className="signal-aug">{sig.augment}</span>
              <span className="signal-arrow">→</span>

              <span className="signal-comp-wrap">
                <span className="signal-comp-row">
                  <span
                    className="signal-comp"
                    style={{
                      color,
                      textShadow: TIER_GLOW[tier] ?? 'none',
                    }}
                  >
                    {rv?.variant.name ?? (sig.primaryComp ?? 'Any')}
                  </span>
                  {required && (
                    <span className="signal-required-badge">REQUIRED</span>
                  )}
                </span>
                {sig.note && (
                  <span className="signal-note">
                    {sig.note.replace(' — REQUIRED', '').replace(' — required', '')}
                  </span>
                )}
                {secondaryRv && (
                  <span className="signal-secondary-row">
                    <span className="signal-secondary-label">also →</span>
                    <span
                      className="signal-comp"
                      style={{ color: TIER_COLOR[secondaryRv.variant.tier] ?? TIER_COLOR.C }}
                      onClick={e => { e.stopPropagation(); setSelectedVariant(secondaryRv) }}
                    >
                      {secondaryRv.variant.name}
                    </span>
                  </span>
                )}
              </span>
            </div>
          )
        })}
        {filteredSignals.length === 0 && (
          <div className="empty-state">No augments match "{query}"</div>
        )}
      </div>
    </div>
  )
}
