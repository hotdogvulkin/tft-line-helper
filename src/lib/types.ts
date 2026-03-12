export interface UnitPosition {
  unit: string
  row: number    // 0 = backline, 3 = frontline
  col: number    // 0-6 left to right
  cost?: number  // 1 2 3 4 5 7
  dt?: boolean   // Double Trouble pair
}

export interface BoardStage {
  stage: string
  units: string[]
  traits: string[]
  note: string
  positions?: UnitPosition[]
}

export interface BoardProgression {
  early: BoardStage
  mid: BoardStage
  late: BoardStage
}

export interface AugmentSynergy {
  augment: string
  score: number
  note: string
}

export interface AugmentAvoid {
  augment: string
  note: string
}

export interface CarryItems {
  [key: string]: string[]
}

export interface Variant {
  id: string
  name: string
  tier: string
  playstyle: string
  difficulty: string
  description: string
  gameplan: string
  conditions: string[]
  coreUnits: string[]
  carryItems: CarryItems
  levelingPattern: string
  levelingGuide?: string[]
  boardProgression?: BoardProgression
  augmentSynergies: AugmentSynergy[]
  augmentAvoid: AugmentAvoid[]
  tips: string[]
}

export interface Archetype {
  id: string
  name: string
  tier: string
  description: string
  variants: Variant[]
}

export interface AugmentCategories {
  econ: string[]
  reroll: string[]
  combat_ap: string[]
  combat_ad: string[]
  emblem: string[]
  artifact: string[]
}

export type AugmentCategory = 'EMBLEM' | 'ECON' | 'COMBAT' | 'HERO' | 'REROLL' | 'ARTIFACT'

export interface AugmentSignal {
  augment: string
  primaryComp?: string
  secondaryComp?: string
  note: string
  category?: AugmentCategory
}

export interface AugmentSignals {
  description: string
  signals: AugmentSignal[]
}

export interface MetaData {
  set: number
  setName: string
  patch: string
  lastUpdated: string
  description: string
}

export interface TFTData {
  meta: MetaData
  archetypes: Archetype[]
  augmentCategories: AugmentCategories
  augmentSignals: AugmentSignals
}

export interface ScoreResult {
  score: number
  reasons: ReasonEntry[]
}

export interface ReasonEntry {
  text: string
  value: number
}

export interface RankedVariant {
  variant: Variant
  archetype: Archetype
  score: number
  reasons: ReasonEntry[]
  force?: boolean
}

export interface AugmentRecommendation {
  augment: string
  score: number
  reason: string
}
