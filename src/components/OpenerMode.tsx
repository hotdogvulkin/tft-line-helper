import { useState, useEffect } from 'react'
import type { TFTData, RankedVariant } from '../lib/types'

const isElectron = () => typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
import LineView from './LineView'
import RuneterraMap from './RuneterraMap'

interface OpenerModeProps {
  data: TFTData
}

export default function OpenerMode({ data }: OpenerModeProps) {
  const [selectedVariant, setSelectedVariant] = useState<RankedVariant | null>(null)

  useEffect(() => {
    if (selectedVariant && isElectron()) {
      window.electronAPI?.setComp?.(selectedVariant.variant.id)
    }
  }, [selectedVariant])

  if (selectedVariant) {
    return (
      <div className="content-scroll">
        <LineView rv={selectedVariant} onBack={() => setSelectedVariant(null)} />
      </div>
    )
  }

  return (
    <div className="opener-map-view">
      <RuneterraMap data={data} onSelectVariant={setSelectedVariant} />
    </div>
  )
}
