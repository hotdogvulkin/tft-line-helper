import type {
  Variant,
  TFTData,
  ScoreResult,
  ReasonEntry,
  AugmentCategories,
} from './types'
import { normalize } from './normalize'

/** Map a selected augment into zero or more category keys */
function getCategories(
  aug: string,
  cats: AugmentCategories
): (keyof AugmentCategories)[] {
  const n = normalize(aug)
  const result: (keyof AugmentCategories)[] = []
  for (const key of Object.keys(cats) as (keyof AugmentCategories)[]) {
    if (cats[key].some((c) => normalize(c) === n)) {
      result.push(key)
    }
  }
  return result
}

/** Returns true if the meta-label synergy applies to the selected augment's categories */
function categoryLabelApplies(
  label: string,
  augCategories: (keyof AugmentCategories)[]
): boolean {
  const n = normalize(label)
  if (
    n.includes('econ augment') ||
    n.includes('econ augments')
  ) {
    return augCategories.includes('econ')
  }
  if (n.includes('combat augment') || n.includes('combat augments')) {
    return (
      augCategories.includes('combat_ap') ||
      augCategories.includes('combat_ad')
    )
  }
  if (n.includes('item augment') || n.includes('item augments')) {
    return (
      augCategories.includes('emblem') ||
      augCategories.includes('artifact') ||
      augCategories.includes('combat_ap') ||
      augCategories.includes('combat_ad')
    )
  }
  if (n.includes('reroll augment') || n.includes('reroll augments')) {
    return augCategories.includes('reroll')
  }
  if (n.includes('ap item') || n.includes('ap or ad')) {
    return augCategories.includes('combat_ap') || augCategories.includes('artifact')
  }
  if (n.includes('ad item') || n.includes('ad/tank')) {
    return augCategories.includes('combat_ad') || augCategories.includes('artifact')
  }
  return false
}

/**
 * Score a variant against a list of selected augments.
 * Returns { score, reasons } where reasons are sorted by |value| desc.
 */
export function scoreVariant(
  variant: Variant,
  selectedAugments: string[],
  data: TFTData
): ScoreResult {
  const reasons: ReasonEntry[] = []
  let total = 0

  for (const aug of selectedAugments) {
    const nAug = normalize(aug)
    const augCategories = getCategories(aug, data.augmentCategories)

    // --- Direct synergy match ---
    for (const syn of variant.augmentSynergies) {
      const nSyn = normalize(syn.augment)

      if (nSyn === nAug) {
        // Exact match
        total += syn.score
        reasons.push({
          text: `"${syn.augment}" synergy (+${syn.score}): ${syn.note}`,
          value: syn.score,
        })
        break
      } else if (categoryLabelApplies(syn.augment, augCategories)) {
        // Category fallback
        total += syn.score
        reasons.push({
          text: `${aug} → ${syn.augment} (+${syn.score}): ${syn.note}`,
          value: syn.score,
        })
        break
      }
    }

    // --- Signal bonus ---
    for (const signal of data.augmentSignals.signals) {
      if (normalize(signal.augment) !== nAug) continue
      if (signal.primaryComp === variant.id) {
        total += 25
        reasons.push({
          text: `Signals ${variant.id} as PRIMARY (+25): ${signal.note}`,
          value: 25,
        })
      } else if (signal.secondaryComp === variant.id) {
        total += 12
        reasons.push({
          text: `Signals ${variant.id} as secondary (+12): ${signal.note}`,
          value: 12,
        })
      }
    }

    // --- Avoid penalty ---
    for (const avoid of variant.augmentAvoid) {
      const nAvoid = normalize(avoid.augment)
      if (nAvoid === nAug || categoryLabelApplies(avoid.augment, augCategories)) {
        total -= 12
        reasons.push({
          text: `⚠ "${aug}" conflicts (−12): ${avoid.note}`,
          value: -12,
        })
      }
    }
  }

  // Sort reasons by absolute contribution descending, take top 4
  reasons.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

  return { score: total, reasons: reasons.slice(0, 4) }
}

/** Collect every augment name from categories + signals as the recommendation universe */
export function buildAugmentUniverse(data: TFTData): string[] {
  const set = new Set<string>()
  for (const list of Object.values(data.augmentCategories)) {
    for (const a of list) set.add(a)
  }
  for (const sig of data.augmentSignals.signals) {
    set.add(sig.augment)
  }
  // Also collect all named augments from variants
  for (const arch of data.archetypes) {
    for (const v of arch.variants) {
      for (const s of v.augmentSynergies) set.add(s.augment)
      for (const a of v.augmentAvoid) set.add(a.augment)
    }
  }
  return Array.from(set)
}
