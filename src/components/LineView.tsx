import { useState } from 'react'
import type { RankedVariant } from '../lib/types'
import TFTBoard from './TFTBoard'
import CheatSheet from './CheatSheet'

interface LineViewProps {
  rv: RankedVariant
  onBack: () => void
}

const TIER_CLASS: Record<string, string> = {
  S: 'badge-tier-S',
  A: 'badge-tier-A',
  B: 'badge-tier-B',
  C: 'badge-tier-C',
}

// ── Accordion section ────────────────────────────────────
interface SectionProps {
  icon: string
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({ icon, title, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="lv-block">
      <div className="lv-block-header" onClick={() => setOpen((o) => !o)}>
        <div className="lv-block-header-left">
          <span className="lv-block-icon">{icon}</span>
          <span className="lv-block-title">{title}</span>
        </div>
        <span className={`lv-block-chevron${open ? ' open' : ''}`}>▼</span>
      </div>
      {open && <div className="lv-block-body">{children}</div>}
    </div>
  )
}


// ── Main component ───────────────────────────────────────
export default function LineView({ rv, onBack }: LineViewProps) {
  const { variant, archetype } = rv
  const [cheatOpen, setCheatOpen] = useState(false)
  const sortedSynergies = [...variant.augmentSynergies].sort((a, b) => b.score - a.score)
  const bp = variant.boardProgression

  return (
    <div className="line-view">
      {cheatOpen && <CheatSheet rv={rv} onClose={() => setCheatOpen(false)} />}

      <div className="lv-top-row">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <button className="cs-trigger-btn" onClick={() => setCheatOpen(true)}>⚡ Cheat Sheet</button>
      </div>

      {/* Header */}
      <div className="lv-name">{variant.name}</div>
      <div className="lv-arch">{archetype.name} · {archetype.tier}-Tier Archetype</div>
      <div className="lv-badges">
        <span className={`badge ${TIER_CLASS[variant.tier] ?? 'badge-tier-C'}`}>{variant.tier}</span>
        <span className="badge badge-playstyle">{variant.playstyle}</span>
        <span className="badge badge-diff">{variant.difficulty}</span>
      </div>
      <div className="lv-desc">{variant.description}</div>

      <div className="lv-accordion">

        {/* Board Progression — always open, most scannable during game */}
        {bp && (
          <Section icon="📋" title="Board Progression" defaultOpen>
            <TFTBoard bp={bp} />
          </Section>
        )}

        {/* Gameplan */}
        <Section icon="🎯" title="Gameplan" defaultOpen>
          <div className="lv-text">{variant.gameplan}</div>
        </Section>

        {/* Conditions */}
        {variant.conditions.length > 0 && (
          <Section icon="⚡" title="Conditions" defaultOpen>
            <div className="lv-condition-chips">
              {variant.conditions.map((c, i) => (
                <div key={i} className="lv-condition-chip">
                  <span className="lv-condition-dot">›</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Core Units + Items — side by side sections */}
        <Section icon="⚔️" title="Core Units" defaultOpen>
          <div className="lv-units">
            {variant.coreUnits.map((u, i) => (
              <span key={i} className="lv-unit">{u}</span>
            ))}
          </div>
        </Section>

        <Section icon="🗡️" title="Carry Items" defaultOpen>
          <div className="lv-items-grid">
            {Object.entries(variant.carryItems).map(([carrier, items]) => (
              <div key={carrier} className="lv-items-row">
                <span className="lv-items-carrier">{carrier}</span>
                <div className="lv-items-list">
                  {items.map((item, i) => (
                    <span key={i} className="lv-item-chip">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Leveling */}
        <Section icon="📈" title="Leveling Pattern">
          <div className="lv-text">{variant.levelingPattern}</div>
        </Section>

        {/* Leveling Guide */}
        {variant.levelingGuide && variant.levelingGuide.length > 0 && (
          <Section icon="📊" title="Leveling Guide" defaultOpen>
            <div className="lv-guide-list">
              {variant.levelingGuide.map((step, i) => (
                <div key={i} className="lv-guide-step">{step}</div>
              ))}
            </div>
          </Section>
        )}

        {/* Augment Synergies */}
        <Section icon="✨" title={`Augment Synergies (${sortedSynergies.length})`}>
          <div className="lv-synergy-list">
            {sortedSynergies.map((s, i) => (
              <div key={i} className="lv-synergy-item">
                <span className="lv-syn-score">+{s.score}</span>
                <div className="lv-syn-right">
                  <span className="lv-syn-name">{s.augment}</span>
                  <span className="lv-syn-note">{s.note}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Avoid */}
        {variant.augmentAvoid.length > 0 && (
          <Section icon="🚫" title="Avoid">
            <div className="lv-avoid-list">
              {variant.augmentAvoid.map((a, i) => (
                <div key={i} className="lv-avoid-item">
                  <span className="lv-avoid-name">{a.augment}</span>
                  <span className="lv-avoid-note">{a.note}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Tips */}
        {variant.tips.length > 0 && (
          <Section icon="💡" title={`Tips (${variant.tips.length})`}>
            <div className="lv-tips-list">
              {variant.tips.map((t, i) => (
                <div key={i} className="lv-tip">{t}</div>
              ))}
            </div>
          </Section>
        )}

      </div>
    </div>
  )
}
