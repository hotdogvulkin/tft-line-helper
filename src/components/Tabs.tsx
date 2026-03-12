interface TabsProps {
  active: number
  onChange: (i: number) => void
}

const TABS = ['Opener → Lines', 'Augments → Lines']

export default function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="tabs">
      {TABS.map((label, i) => (
        <button
          key={i}
          className={`tab-btn${active === i ? ' active' : ''}`}
          onClick={() => onChange(i)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
