import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import type { TFTData, RankedVariant } from '../lib/types'
import RegionPanel from './RegionPanel'

interface RegionDef {
  id: string
  name: string
  glowColor: string
  points: string
  centerX: number
  centerY: number
}

// Coordinates in 1366x768 SVG space (viewBox="0 0 1366 768").
const REGIONS: RegionDef[] = [
  { id:'freljord',     name:'Freljord',     glowColor:'#7dd3fc',
    points:'350,221 410,209 476,209 536,217 576,224 615,228 642,244 649,263 635,283 609,302 589,317 562,329 529,333 489,327 450,321 410,313 370,302 344,283 330,259 337,236',
    centerX:495, centerY:271 },

  { id:'ionia',        name:'Ionia',        glowColor:'#f472b6',
    points:'1020,209 1073,197 1139,194 1205,201 1245,217 1265,236 1258,259 1239,286 1225,313 1205,341 1179,364 1146,379 1106,383 1066,371 1033,352 1013,329 1004,302 1003,271 1007,240',
    centerX:1128, centerY:287 },

  { id:'noxus',        name:'Noxus',        glowColor:'#f87171',
    points:'595,294 649,286 702,283 755,286 808,294 847,306 861,325 847,344 828,364 808,379 768,391 728,399 682,397 635,391 602,375 582,356 580,337 585,317',
    centerX:715, centerY:340 },

  { id:'demacia',      name:'Demacia',      glowColor:'#fde68a',
    points:'264,329 357,321 443,325 509,333 536,351 529,371 509,391 483,410 436,423 383,428 330,420 284,405 261,383 257,360',
    centerX:399, centerY:375 },

  { id:'piltover',     name:'Piltover',     glowColor:'#60a5fa',
    points:'695,410 755,405 814,410 832,423 828,439 814,453 778,462 741,464 704,457 686,441 686,426',
    centerX:758, centerY:435 },

  { id:'shurima',      name:'Shurima',      glowColor:'#fbbf24',
    points:'470,488 529,476 595,472 668,468 721,470 768,472 808,480 841,484 887,482 927,488 953,499 960,518 951,538 934,557 914,573 887,583 847,588 808,592 768,594 728,592 688,587 649,576 615,565 582,552 556,538 529,522 503,505',
    centerX:744, centerY:528 },

  { id:'targon',       name:'Targon',       glowColor:'#a78bfa',
    points:'452,561 503,555 556,557 606,565 629,580 633,600 619,619 593,637 556,648 513,650 473,640 447,621 439,600 443,578',
    centerX:533, centerY:601 },

  { id:'ixtal',        name:'Ixtal',        glowColor:'#4ade80',
    points:'834,499 887,488 940,488 987,495 1013,511 1020,530 1013,552 993,569 964,583 927,592 890,596 854,590 824,576 810,559 814,538 821,518',
    centerX:912, centerY:543 },

  { id:'shadow_isles', name:'Shadow Isles', glowColor:'#34d399',
    points:'1190,555 1221,549 1256,555 1274,569 1269,586 1243,598 1208,600 1182,589 1172,573',
    centerX:1224, centerY:575 },

  { id:'bilgewater',   name:'Bilgewater',   glowColor:'#38bdf8',
    points:'1003,443 1040,437 1079,443 1097,459 1089,476 1066,490 1030,495 1003,488 987,472 991,454',
    centerX:1038, centerY:466 },

  { id:'void',         name:'The Void',     glowColor:'#c084fc',
    points:'784,600 834,594 887,596 927,604 951,619 947,637 924,650 887,655 845,654 808,645 781,629 771,614',
    centerX:862, centerY:625 },

  { id:'bandle_city',  name:'Bandle City',  glowColor:'#fb923c',
    points:'81,462 125,454 169,459 195,474 187,493 155,505 115,504 85,490 72,474',
    centerX:132, centerY:479 },
]

const REGION_VARIANT_IDS: Record<string, string[]> = {
  piltover:     ['piltover_warden_thex', 'zaun_zaunara'],
  void:         ['void_kaisa'],
  noxus:        ['noxus_mel_fast9', 'noxus_kindred_fast9', 'noxus_leblanc_atakhan'],
  ionia:        ['ionia_yone', 'ionia_ahri_yone_reroll'],
  shadow_isles: ['si_warden_kalista', 'si_viego_ruined_king'],
  ixtal:        ['ixtal_sandy_brock'],
  shurima:      ['shurima_arcanist_annie', 'shurima_demacia_ryze_sett'],
  freljord:     ['freljord_lissandraphine'],
  demacia:      ['demacia_lux', 'demacia_sona_reroll'],
  bilgewater:   ['bilgewater_tahm_mf'],
  targon:       ['targon_asol_flex'],
  bandle_city:  ['bandle_city_yordle_arcanist', 'bandle_city_veigar_yordle'],
}

const IMG_SIZE   = 1092
const NAVBAR_H   = 96   // combined height of the two header bars

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

interface Tooltip { x: number; y: number; name: string; count: number }

interface RuneterraMapProps {
  data: TFTData
  onSelectVariant: (rv: RankedVariant) => void
}

function computeBaseZoom(W: number, H: number) {
  const scale = W / IMG_SIZE
  const ty = -(W - H) * 0.25
  return { scale, tx: 0, ty }
}

export default function RuneterraMap({ data, onSelectVariant }: RuneterraMapProps) {
  const [selectedRegion,    setSelectedRegion]    = useState<string | null>(null)
  const [hoveredRegion,     setHoveredRegion]      = useState<string | null>(null)
  const [zoom,              setZoom]              = useState({ scale: 1, tx: 0, ty: 0 })
  const [tooltip,           setTooltip]           = useState<Tooltip | null>(null)
  const [noCompsToast,      setNoCompsToast]      = useState<string | null>(null)
  const [transitionEnabled, setTransitionEnabled] = useState(false)

  const containerRef  = useRef<HTMLDivElement>(null)
  const toastTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const zoomRef       = useRef({ scale: 1, tx: 0, ty: 0 })
  const baseScaleRef  = useRef(1)
  const isDraggingRef = useRef(false)
  const didDragRef    = useRef(false)
  const dragStartRef  = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const lastPinchDist = useRef<number | null>(null)
  const pinchBaseZoom = useRef({ scale: 1, tx: 0, ty: 0 })

  const updateZoom = useCallback((next: { scale: number; tx: number; ty: number }) => {
    zoomRef.current = next
    setZoom(next)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const refit = () => {
      const { scale, tx, ty } = computeBaseZoom(el.clientWidth, el.clientHeight)
      baseScaleRef.current = scale
      updateZoom({ scale, tx, ty })
    }
    refit()
    const ro = new ResizeObserver(refit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [updateZoom])

  const variantMap = useMemo(() => {
    const map: Record<string, RankedVariant> = {}
    for (const arch of data.archetypes) {
      for (const variant of arch.variants) {
        map[variant.id] = { variant, archetype: arch, score: 0, reasons: [] }
      }
    }
    return map
  }, [data])

  const hasComps = useCallback(
    (id: string) => (REGION_VARIANT_IDS[id] ?? []).length > 0,
    []
  )

  const clampPan = useCallback((scale: number, tx: number, ty: number) => {
    const el = containerRef.current
    if (!el) return { tx, ty }
    const W = el.clientWidth
    const H = el.clientHeight
    const d = IMG_SIZE * scale
    return {
      tx: Math.min(0, Math.max(W - d, tx)),
      ty: Math.min(0, Math.max(H - d, ty)),
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setTransitionEnabled(false)
      const rect = el.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const prev = zoomRef.current
      const minScale = baseScaleRef.current
      const maxScale = baseScaleRef.current * 4
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      const newScale = Math.min(maxScale, Math.max(minScale, prev.scale * factor))
      const svgX = (mouseX - prev.tx) / prev.scale
      const svgY = (mouseY - prev.ty) / prev.scale
      const { tx, ty } = clampPan(newScale, mouseX - svgX * newScale, mouseY - svgY * newScale)
      updateZoom({ scale: newScale, tx, ty })
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [clampPan, updateZoom])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDragRef.current = true
      if (!didDragRef.current) return
      const scale = zoomRef.current.scale
      const { tx, ty } = clampPan(scale, dragStartRef.current.tx + dx, dragStartRef.current.ty + dy)
      updateZoom({ scale, tx, ty })
    }
    const handleMouseUp = () => {
      isDraggingRef.current = false
      if (containerRef.current) containerRef.current.style.cursor = ''
      setTimeout(() => { didDragRef.current = false }, 0)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [clampPan, updateZoom])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setTransitionEnabled(false)
    isDraggingRef.current = true
    didDragRef.current = false
    dragStartRef.current = { x: e.clientX, y: e.clientY, tx: zoomRef.current.tx, ty: zoomRef.current.ty }
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      lastPinchDist.current = Math.hypot(dx, dy)
      pinchBaseZoom.current = { ...zoomRef.current }
      setTransitionEnabled(false)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2 || lastPinchDist.current === null) return
    e.preventDefault()
    const dx = e.touches[1].clientX - e.touches[0].clientX
    const dy = e.touches[1].clientY - e.touches[0].clientY
    const dist = Math.hypot(dx, dy)
    const base = pinchBaseZoom.current
    const newScale = Math.min(baseScaleRef.current * 4, Math.max(baseScaleRef.current, base.scale * (dist / lastPinchDist.current)))
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
    const svgX = (midX - base.tx) / base.scale
    const svgY = (midY - base.ty) / base.scale
    const { tx, ty } = clampPan(newScale, midX - svgX * newScale, midY - svgY * newScale)
    updateZoom({ scale: newScale, tx, ty })
  }, [clampPan, updateZoom])

  const handleTouchEnd = useCallback(() => { lastPinchDist.current = null }, [])

  const computeRegionZoom = useCallback((region: RegionDef, panelOpen: boolean) => {
    const el = containerRef.current
    if (!el) return { scale: 1, tx: 0, ty: 0 }
    const W = el.clientWidth
    const H = el.clientHeight
    const effectiveScale = baseScaleRef.current * 2.5
    // SVG viewBox is 1366×768 but the element is IMG_SIZE×IMG_SIZE with
    // preserveAspectRatio="none", so convert SVG coords → image pixel coords.
    const pixelX = region.centerX * IMG_SIZE / 1366
    const pixelY = region.centerY * IMG_SIZE / 768
    const targetX = panelOpen ? W * 0.27 : W * 0.5
    const targetY = NAVBAR_H + (H - NAVBAR_H) / 2
    const { tx, ty } = clampPan(effectiveScale, targetX - pixelX * effectiveScale, targetY - pixelY * effectiveScale)
    return { scale: effectiveScale, tx, ty }
  }, [clampPan])

  const handleRegionClick = useCallback((region: RegionDef) => {
    if (didDragRef.current) return
    if (!hasComps(region.id)) {
      if (toastTimer.current) clearTimeout(toastTimer.current)
      setNoCompsToast(region.name)
      toastTimer.current = setTimeout(() => setNoCompsToast(null), 2500)
      return
    }
    const resetZoom = () => {
      const el = containerRef.current
      if (!el) return
      setSelectedRegion(null)
      setTransitionEnabled(true)
      updateZoom(computeBaseZoom(el.clientWidth, el.clientHeight))
      setTimeout(() => setTransitionEnabled(false), 420)
    }
    if (selectedRegion === region.id) { resetZoom(); return }
    setSelectedRegion(region.id)
    setTransitionEnabled(true)
    updateZoom(computeRegionZoom(region, true))
    setTimeout(() => setTransitionEnabled(false), 420)
  }, [selectedRegion, computeRegionZoom, hasComps, updateZoom])

  const handleClose = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setSelectedRegion(null)
    setTransitionEnabled(true)
    updateZoom(computeBaseZoom(el.clientWidth, el.clientHeight))
    setTimeout(() => setTransitionEnabled(false), 420)
  }, [updateZoom])

  const handleReset = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setSelectedRegion(null)
    setTransitionEnabled(true)
    updateZoom(computeBaseZoom(el.clientWidth, el.clientHeight))
    setTimeout(() => setTransitionEnabled(false), 420)
  }, [updateZoom])

  const handleMouseMoveTooltip = useCallback((e: React.MouseEvent, region: RegionDef) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const count = (REGION_VARIANT_IDS[region.id] ?? []).length
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, name: region.name, count })
  }, [])

  const selectedDef   = REGIONS.find(r => r.id === selectedRegion)
  const panelVariants = selectedRegion
    ? (REGION_VARIANT_IDS[selectedRegion] ?? []).flatMap(id => variantMap[id] ? [variantMap[id]] : [])
    : []
  const userScale = zoom.scale / Math.max(baseScaleRef.current, 0.001)
  const isZoomed  = userScale > 1.05
  const zoomLabel = isZoomed ? `${userScale.toFixed(1)}×` : null

  return (
    <div
      className="runeterra-container"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="runeterra-zoom"
        style={{
          transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})`,
          transformOrigin: '0 0',
          transition: transitionEnabled ? 'transform 0.4s cubic-bezier(0.4,0,0.2,1)' : 'none',
        }}
      >
        <img
          className="runeterra-bg-img"
          src="/Runeterra Map 2.png"
          width={IMG_SIZE}
          height={IMG_SIZE}
          alt="Map of Runeterra"
          draggable={false}
        />

        <svg
          viewBox="0 0 1366 768"
          preserveAspectRatio="none"
          className="runeterra-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="regionGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="rgba(0,0,0,0.95)" />
            </filter>
          </defs>

          {/* ── Interactive polygon zones ── */}
          {REGIONS.map(region => {
            const isSel = selectedRegion === region.id
            const isHov = hoveredRegion  === region.id
            const hasC  = hasComps(region.id)
            const fill  = isSel
              ? hexToRgba(region.glowColor, 0.22)
              : isHov ? hexToRgba(region.glowColor, 0.15) : 'transparent'

            return (
              <g key={region.id}>
                {/* Glow bloom on selected */}
                {isSel && (
                  <polygon
                    points={region.points}
                    fill="none"
                    stroke={region.glowColor}
                    strokeWidth="8"
                    opacity={0.40}
                    filter="url(#regionGlow)"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                <polygon
                  points={region.points}
                  fill={fill}
                  stroke={isSel || isHov ? region.glowColor : 'none'}
                  strokeWidth={isSel ? 2 : 1.5}
                  strokeOpacity={isSel ? 0.90 : 0.60}
                  style={{
                    cursor: hasC ? 'pointer' : 'default',
                    transition: 'fill 0.15s, stroke-opacity 0.15s',
                  }}
                  onClick={() => handleRegionClick(region)}
                  onMouseEnter={(e) => { setHoveredRegion(region.id); handleMouseMoveTooltip(e, region) }}
                  onMouseMove={(e)  => handleMouseMoveTooltip(e, region)}
                  onMouseLeave={() => { setHoveredRegion(null); setTooltip(null) }}
                />
              </g>
            )
          })}

          {/* ── Always-visible labels ── */}
          {/* ASPECT_CORRECT counteracts the non-uniform viewBox→element scaling:
              viewBox is 1366×768 but the SVG element is 1092×1092 (square).
              preserveAspectRatio="none" compresses x by 1092/1366 and stretches
              y by 1092/768, squishing text glyphs to ~56% width.
              Scaling local x by 1366/768 restores uniform apparent scale. */}
          {REGIONS.map(region => {
            const hasC = hasComps(region.id)
            const cx   = region.centerX
            const cy   = region.centerY
            const ac   = (1366 / 768).toFixed(6)  // aspect correction ≈ 1.779167

            return (
              <g key={`lbl-${region.id}`} style={{ pointerEvents: 'none' }}>
                {/* Region name */}
                <g transform={`translate(${cx},${cy}) scale(${ac},1)`}>
                  <text
                    x={0}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="'Cinzel', serif"
                    fill="#e8dcc8"
                    filter="url(#textShadow)"
                    style={{ letterSpacing: '1.5px' }}
                  >
                    {region.name.toUpperCase()}
                  </text>
                </g>
                {/* Comp dot (pulsing) or "no comps" subtitle */}
                {hasC ? (
                  <g transform={`translate(${cx},${cy + 14}) scale(${ac},1)`}>
                    <circle
                      cx={0}
                      cy={0}
                      r="2.5"
                      fill={region.glowColor}
                      className="rt-comp-dot"
                    />
                  </g>
                ) : (
                  <g transform={`translate(${cx},${cy + 14}) scale(${ac},1)`}>
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="8"
                      fontWeight="400"
                      fontFamily="'Cinzel', serif"
                      fill="#a09070"
                      filter="url(#textShadow)"
                      style={{ letterSpacing: '1px' }}
                    >
                      NO COMPS
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {isZoomed && (
        <div className="rt-map-controls">
          {zoomLabel && <span className="rt-zoom-label">{zoomLabel}</span>}
          <button className="rt-reset-btn" onClick={handleReset}>⟲ Reset</button>
        </div>
      )}

      <div className={`runeterra-panel${selectedRegion ? ' open' : ''}`}>
        {selectedDef && (
          <RegionPanel
            regionName={selectedDef.name}
            variants={panelVariants}
            accentColor={selectedDef.glowColor}
            onSelectVariant={onSelectVariant}
            onClose={handleClose}
          />
        )}
      </div>

      {noCompsToast && (
        <div className="rt-no-comps-toast">
          <span className="rt-toast-region">{noCompsToast}</span>
          <span className="rt-toast-msg">No meta comps this patch</span>
        </div>
      )}

      {tooltip && hoveredRegion && (
        <div className="rt-tooltip" style={{ left: tooltip.x + 14, top: tooltip.y - 48 }}>
          <span className="rt-tooltip-name">{tooltip.name}</span>
          {tooltip.count > 0 && (
            <span className="rt-tooltip-count">
              {tooltip.count === 1 ? '1 comp' : `${tooltip.count} comps`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
