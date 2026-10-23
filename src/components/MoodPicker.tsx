import { motion } from 'framer-motion'
import { MOODS, type MoodId } from '../lib/moods'
import { MoodFace } from './MoodFace'

type Props = {
  selected: MoodId | null
  onPick: (mood: MoodId) => void
  disabled?: boolean
}

export function MoodPicker({ selected, onPick, disabled }: Props) {
  return (
    <div role="radiogroup" aria-label="How are you feeling?" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {MOODS.map((m, i) => {
        const isOn = selected === m.id
        return (
          <motion.button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={isOn}
            disabled={disabled}
            onClick={() => onPick(m.id)}
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: isOn ? [1, 1.08, 0.97, 1] : 1 }}
            transition={{
              opacity: { delay: 0.05 * i },
              y: { delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 22 },
              scale: isOn ? { duration: 0.45, ease: 'easeOut' } : { delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 22 },
            }}
            whileHover={disabled ? undefined : { y: -3 }}
            whileTap={disabled ? undefined : { scale: 0.92 }}
            className={[
              'relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 p-4',
              'bg-surface shadow-soft transition-colors disabled:cursor-default',
              isOn ? 'border-ink' : 'border-transparent',
            ].join(' ')}
            style={isOn ? { background: `color-mix(in srgb, var(${m.cssVar}) 22%, var(--surface))` } : undefined}
          >
            <MoodFace mood={m.id} className="size-16" />
            <span className="text-lg font-bold">{m.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
