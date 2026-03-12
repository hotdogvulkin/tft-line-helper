import { useState } from 'react'
import type { BoardProgression, BoardStage, UnitPosition } from '../lib/types'

// ── Cost tier colours ─────────────────────────────────────────
const COST_COLOR: Record<number, string> = {
  1: '#9da3ae',
  2: '#22c55e',
  3: '#06b6d4',
  4: '#a855f7',
  5: '#eab308',
  7: '#ef4444',
}

// ── DDragon portrait slugs ────────────────────────────────────
const SLUG: Record<string, string> = {
  'Aatrox':           'Aatrox',
  'Ahri':             'Ahri',
  'Ambessa':          'Ambessa',
  'Anivia':           'Anivia',
  'Aphelios':         'Aphelios',
  'Ashe':             'Ashe',
  'Aurelion Sol':     'AurelionSol',
  'Azir':             'Azir',
  'Bard':             'Bard',
  "Bel'Veth":         'Belveth',
  'Braum':            'Braum',
  'Briar':            'Briar',
  'Caitlyn':          'Caitlyn',
  "Cho'Gath":         'Chogath',
  'Darius':           'Darius',
  'Diana':            'Diana',
  'Dr. Mundo':        'DrMundo',
  'Draven':           'Draven',
  'Ekko':             'Ekko',
  'Fiddlesticks':     'Fiddlesticks',
  'Fizz':             'Fizz',
  'Gangplank':        'Gangplank',
  'Galio':            'Galio',
  'Garen':            'Garen',
  'Graves':           'Graves',
  'Gwen':             'Gwen',
  'Illaoi':           'Illaoi',
  'Jarvan IV':        'JarvanIV',
  'Jayce':            'Jayce',
  'Jinx':             'Jinx',
  "Kai'Sa":           'Kaisa',
  'Kalista':          'Kalista',
  'Kennen':           'Kennen',
  'Kindred':          'Kindred',
  'Kobuko':           'Yuumi',
  'Kobuko & Yuumi':   'Yuumi',
  "Kog'Maw":          'KogMaw',
  'LeBlanc':          'Leblanc',
  'Leona':            'Leona',
  'Lissandra':        'Lissandra',
  'Lucian & Senna':   'Lucian',
  'Lulu':             'Lulu',
  'Lux':              'Lux',
  'Malzahar':         'Malzahar',
  'Mel':              'Mel',
  'Milio':            'Milio',
  'Miss Fortune':     'MissFortune',
  'Nasus':            'Nasus',
  'Nautilus':         'Nautilus',
  'Neeko':            'Neeko',
  'Nidalee':          'Nidalee',
  'Orianna':          'Orianna',
  'Ornn':             'Ornn',
  'Poppy':            'Poppy',
  'Qiyana':           'Qiyana',
  "Rek'Sai":          'RekSai',
  'Renekton':         'Renekton',
  'Rumble':           'Rumble',
  'Ryze':             'Ryze',
  'Annie':            'Annie',
  'Sejuani':          'Sejuani',
  'Seraphine':        'Seraphine',
  'Shyvana':          'Shyvana',
  'Skarner':          'Skarner',
  'Sett':             'Sett',
  'Shen':             'Shen',
  'Sion':             'Sion',
  'Singed':           'Singed',
  'Sona':             'Sona',
  'Swain':            'Swain',
  'Sylas':            'Sylas',
  'Tahm Kench':       'TahmKench',
  'Taric':            'Taric',
  'Teemo':            'Teemo',
  'Thresh':           'Thresh',
  'Tristana':         'Tristana',
  'Tryndamere':       'Tryndamere',
  'Twisted Fate':     'TwistedFate',
  'Vayne':            'Vayne',
  'Veigar':           'Veigar',
  'Viego':            'Viego',
  'Vi':               'Vi',
  'Volibear':         'Volibear',
  'Warwick':          'Warwick',
  'Wukong':           'MonkeyKing',
  'Xerath':           'Xerath',
  'Xin Zhao':         'XinZhao',
  'Yasuo':            'Yasuo',
  'Yone':             'Yone',
  'Yorick':           'Yorick',
  'Ziggs':            'Ziggs',
  'Zilean':           'Zilean',
}

const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/'

function portraitUrl(unit: string): string {
  const slug = SLUG[unit]
  return slug ? `${DDRAGON}${slug}.png` : ''
}

function shortName(unit: string): string {
  if (unit.startsWith('Dr. ')) return 'Mundo'
  return unit.split(' ')[0]
}

// ── Special non-champion units ────────────────────────────────
// Units with no DDragon portrait — custom label + color
const SPECIAL: Record<string, { label: string; color: string }> = {
  'Frozen Tower': { label: 'Tower', color: '#7dd3fc' },
  'Sand Soldier': { label: 'Sand',  color: '#fbbf24' },
  'T-Hex':        { label: 'T-Hex', color: '#60a5fa' },
  'Rift Herald':  { label: 'Herald',color: '#c084fc' },
  'Tibbers':      { label: 'Tibbers',color: '#f87171' },
  'Atakhan':      { label: 'Atakhan',color: '#ef4444' },
  'Brock':        { label: 'Brock',  color: '#f59e0b' },
  'Loris':        { label: 'Loris',  color: '#9da3ae' },
}

// ── Single champion hex ───────────────────────────────────────
interface ChampHexProps {
  pos: UnitPosition
}

function ChampHex({ pos }: ChampHexProps) {
  const [err, setErr] = useState(false)
  const special = SPECIAL[pos.unit]
  const color = special?.color ?? (COST_COLOR[pos.cost ?? 1] ?? '#9da3ae')
  const url = special ? '' : portraitUrl(pos.unit)

  return (
    <div className="tft-hex">
      <div className="tft-hex-circle" style={{ borderColor: color }}>
        {url && !err ? (
          <img
            className="tft-hex-img"
            src={url}
            alt={pos.unit}
            onError={() => setErr(true)}
          />
        ) : (
          <div className="tft-hex-fallback" style={{ background: color }}>
            {special ? special.label[0] : pos.unit[0]}
          </div>
        )}
        {pos.dt && <span className="tft-dt-badge">DT</span>}
      </div>
      <div className="tft-hex-name">{special?.label ?? shortName(pos.unit)}</div>
    </div>
  )
}

function EmptyHex() {
  return (
    <div className="tft-hex">
      <div className="tft-hex-circle tft-hex-empty" />
      <div className="tft-hex-name" />
    </div>
  )
}

// ── Hex grid ──────────────────────────────────────────────────
// Rows 3→0 top-to-bottom (3=frontline, 0=backline).
// Odd type-rows (1,3) are offset right by half a hex step.
export function HexGrid({ positions }: { positions: UnitPosition[] }) {
  const map = new Map<string, UnitPosition>()
  for (const p of positions) {
    map.set(`${p.row},${p.col}`, p)
  }

  return (
    <div className="tft-board">
      {[3, 2, 1, 0].map(rowIdx => (
        <div
          key={rowIdx}
          className={`tft-row${rowIdx % 2 === 1 ? ' tft-row-offset' : ''}`}
        >
          {Array.from({ length: 7 }, (_, colIdx) => {
            const pos = map.get(`${rowIdx},${colIdx}`)
            return pos
              ? <ChampHex key={colIdx} pos={pos} />
              : <EmptyHex key={colIdx} />
          })}
        </div>
      ))}
    </div>
  )
}

// ── Cost legend ───────────────────────────────────────────────
const COST_LABELS: [number, string][] = [
  [1, '1g'], [2, '2g'], [3, '3g'], [4, '4g'], [5, '5g'], [7, '★'],
]

function CostLegend() {
  return (
    <div className="tft-cost-legend">
      {COST_LABELS.map(([cost, label]) => (
        <span key={cost} className="tft-cost-pip">
          <span className="tft-cost-dot" style={{ background: COST_COLOR[cost] }} />
          {label}
        </span>
      ))}
    </div>
  )
}

// ── Stage unit chip list (for stages without positions) ───────
function UnitChips({ units }: { units: string[] }) {
  return (
    <div className="tft-unit-chips">
      {units.map((u, i) => (
        <span key={i} className="tft-unit-chip">{u}</span>
      ))}
    </div>
  )
}

// ── Early/Mid game plan row ───────────────────────────────────
function GamePlanRow({ label, stage }: { label: string; stage: BoardStage }) {
  return (
    <div className="tft-gp-row">
      <span className="tft-gp-label">{label}</span>
      <div className="tft-gp-traits">
        {stage.traits.map((t, i) => (
          <span key={i} className="tft-gp-trait">{t}</span>
        ))}
      </div>
      {stage.note && <span className="tft-gp-note">{stage.note}</span>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
interface TFTBoardProps {
  bp: BoardProgression
}

export default function TFTBoard({ bp }: TFTBoardProps) {
  return (
    <div className="tft-board-wrap">
      <HexGrid positions={bp.late.positions ?? []} />
      <CostLegend />
      <div className="tft-gameplan">
        <GamePlanRow label="Early" stage={bp.early} />
        <GamePlanRow label="Mid"   stage={bp.mid} />
      </div>
    </div>
  )
}
