import type { AugmentRecommendation } from '../lib/types'

interface AugmentListsProps {
  commit: AugmentRecommendation[]
  flex: AugmentRecommendation[]
  avoid: AugmentRecommendation[]
}

function AugList({
  title,
  kind,
  items,
}: {
  title: string
  kind: 'commit' | 'flex' | 'avoid'
  items: AugmentRecommendation[]
}) {
  if (items.length === 0) return null
  return (
    <div className="aug-list-block">
      <div className={`aug-list-title ${kind}`}>{title}</div>
      <div className="aug-list-items">
        {items.map((item, i) => (
          <div key={i} className={`aug-list-item${kind === 'avoid' ? ' avoid' : ''}`}>
            <span className="aug-list-item-name">{item.augment}</span>
            <span className="aug-list-item-reason" title={item.reason}>
              {item.reason}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AugmentLists({ commit, flex, avoid }: AugmentListsProps) {
  return (
    <div className="aug-lists">
      <AugList title="Commit Augments (Primary line)" kind="commit" items={commit} />
      <AugList title="Flex Augments (Top 3 lines)" kind="flex" items={flex} />
      <AugList title="Avoid" kind="avoid" items={avoid} />
    </div>
  )
}
