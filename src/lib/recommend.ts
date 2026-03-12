import type {
  TFTData,
  RankedVariant,
  AugmentRecommendation,
} from './types'
import { scoreVariant, buildAugmentUniverse } from './scoring'

const FORCE_THRESHOLD = 30

/**
 * Rank ALL variants for augment-first mode.
 */
export function rankVariantsByAugments(
  selectedAugments: string[],
  data: TFTData
): RankedVariant[] {
  const results: RankedVariant[] = []

  for (const arch of data.archetypes) {
    for (const variant of arch.variants) {
      const { score, reasons } = scoreVariant(variant, selectedAugments, data)
      results.push({
        variant,
        archetype: arch,
        score,
        reasons,
        force: score >= FORCE_THRESHOLD,
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results
}

/**
 * Rank variants for opener-first mode.
 * Tries to match archetype id to opener key; falls back to full ranking.
 */
export function rankVariantsByOpener(
  opener: string,
  data: TFTData
): RankedVariant[] {
  const openerKey = opener.toLowerCase()

  // Find matching archetypes (id contains opener key)
  const matchingArchetypes = data.archetypes.filter((a) =>
    a.id.toLowerCase().includes(openerKey)
  )

  let pool: RankedVariant[] = []

  if (matchingArchetypes.length > 0) {
    for (const arch of matchingArchetypes) {
      for (const variant of arch.variants) {
        pool.push({
          variant,
          archetype: arch,
          score: 0,
          reasons: [{ text: `Matches ${opener} opener`, value: 5 }],
        })
      }
    }
  }

  // If fewer than 3 candidates from opener match, pad with all variants scored by tier
  if (pool.length < 3) {
    const tierOrder: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 }
    const allVariants: RankedVariant[] = []
    for (const arch of data.archetypes) {
      for (const variant of arch.variants) {
        if (pool.some((p) => p.variant.id === variant.id)) continue
        allVariants.push({
          variant,
          archetype: arch,
          score: tierOrder[variant.tier] ?? 0,
          reasons: [
            { text: `${variant.tier}-tier line`, value: tierOrder[variant.tier] ?? 0 },
          ],
        })
      }
    }
    allVariants.sort((a, b) => b.score - a.score)
    pool = [...pool, ...allVariants]
  }

  // Sort pool: opener matches first (by tier), then rest by score
  pool.sort((a, b) => {
    const aMatch = matchingArchetypes.some((m) => m.id === a.archetype.id)
    const bMatch = matchingArchetypes.some((m) => m.id === b.archetype.id)
    if (aMatch && !bMatch) return -1
    if (!aMatch && bMatch) return 1
    const tierOrder: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 }
    return (tierOrder[b.variant.tier] ?? 0) - (tierOrder[a.variant.tier] ?? 0)
  })

  return pool
}

/** Compute augment recommendations for a set of top-ranked variants */
export function recommendAugments(
  topVariants: RankedVariant[],
  data: TFTData,
  topN = 8
): {
  commit: AugmentRecommendation[]
  flex: AugmentRecommendation[]
  avoid: AugmentRecommendation[]
} {
  const universe = buildAugmentUniverse(data)
  const weights = [1.0, 0.7, 0.5]

  // Commit: only primary (rank 0)
  const primary = topVariants[0]
  const commitScores: AugmentRecommendation[] = universe
    .map((aug) => {
      const { score, reasons } = scoreVariant(primary.variant, [aug], data)
      return {
        augment: aug,
        score,
        reason: reasons[0]?.text ?? '',
      }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)

  // Flex: weighted sum across top 3
  const flexTop = topVariants.slice(0, 3)
  const flexScores: AugmentRecommendation[] = universe
    .map((aug) => {
      let totalScore = 0
      let bestReason = ''
      let bestVal = -Infinity
      flexTop.forEach((rv, i) => {
        const { score, reasons } = scoreVariant(rv.variant, [aug], data)
        totalScore += score * (weights[i] ?? 0.3)
        if (score > bestVal && reasons[0]) {
          bestVal = score
          bestReason = `${rv.variant.name}: ${reasons[0].text}`
        }
      })
      return { augment: aug, score: totalScore, reason: bestReason }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)

  // Avoid: from primary's augmentAvoid
  const avoid: AugmentRecommendation[] = primary.variant.augmentAvoid.map(
    (a) => ({
      augment: a.augment,
      score: -12,
      reason: a.note,
    })
  )

  return { commit: commitScores, flex: flexScores, avoid }
}
