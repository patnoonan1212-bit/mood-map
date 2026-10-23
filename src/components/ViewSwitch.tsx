import { motion } from 'framer-motion'

export type MapView = 'map' | 'list'

export function ViewSwitch({ value, onChange }: { value: MapView; onChange: (v: MapView) => void }) {
  return (
    <div role="radiogroup" aria-label="Show as" className="flex shrink-0 rounded-full bg-bg-soft p-1">
      {(['map', 'list'] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`relative isolate rounded-full px-3.5 py-1.5 text-sm font-extrabold capitalize ${value === v ? 'text-ink' : 'text-ink-soft'}`}
        >
          {value === v && (
            <motion.span layoutId="view-pill" className="absolute inset-0 -z-10 rounded-full bg-surface shadow-soft" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
          )}
          {v}
        </button>
      ))}
    </div>
  )
}
