import { useState, useRef, useEffect } from 'react'
import { buildAugmentUniverse } from '../lib/scoring'
import type { TFTData } from '../lib/types'

interface AugmentPickerProps {
  selected: string[]
  onChange: (augs: string[]) => void
  data: TFTData
  max?: number
}

export default function AugmentPicker({
  selected,
  onChange,
  data,
  max = 3,
}: AugmentPickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const universe = buildAugmentUniverse(data)

  const filtered = query.length >= 1
    ? universe
        .filter(
          (a) =>
            a.toLowerCase().includes(query.toLowerCase()) &&
            !selected.includes(a)
        )
        .slice(0, 30)
    : []

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function pick(aug: string) {
    if (selected.length < max) {
      onChange([...selected, aug])
    }
    setQuery('')
    setOpen(false)
  }

  function remove(aug: string) {
    onChange(selected.filter((a) => a !== aug))
  }

  return (
    <div>
      <div className="aug-search-wrap" ref={wrapRef}>
        <input
          className="aug-search"
          placeholder={
            selected.length >= max
              ? `Max ${max} augments selected`
              : 'Search augments…'
          }
          value={query}
          disabled={selected.length >= max}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => query.length >= 1 && setOpen(true)}
        />
        {open && filtered.length > 0 && (
          <div className="aug-dropdown">
            {filtered.map((aug) => (
              <div
                key={aug}
                className="aug-dropdown-item"
                onMouseDown={() => pick(aug)}
              >
                {aug}
              </div>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="aug-chips">
          {selected.map((aug) => (
            <span key={aug} className="aug-chip">
              {aug}
              <button className="aug-chip-x" onClick={() => remove(aug)}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
