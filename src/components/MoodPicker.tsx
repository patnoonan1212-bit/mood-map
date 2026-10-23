import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MOODS, type MoodId } from '../lib/moods'
import { MoodFace } from './MoodFace'

type Props = {
  /** Called with the mood and the center of the tapped button, so the burst can start there. */
  onPick: (mood: MoodId, at: { x: number; y: number }) => void
}

const tint = (cssVar: string, pct: number, base = 'var(--surface)') => `color-mix(in srgb, var(${cssVar}) ${pct}%, ${base})`

/** Six big mood buttons. Each face acts out its feeling while it waits to be picked. */
export function MoodPicker({ onPick }: Props) {
  const reduce = useReducedMotion()
  return (
    <div role="radiogroup" aria-label="How are you feeling?" className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
      <AnimatePresence>
        {MOODS.map((m, i) => (
          <motion.button
            key={m.id}
            layoutId={`mood-card-${m.id}`}
            type="button"
            role="radio"
            aria-checked={false}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              onPick(m.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
            }}
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7, filter: 'blur(6px)', transition: { duration: 0.35 } }}
            transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 22 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.9 }}
            className="group relative isolate flex min-h-36 flex-col items-center justify-center gap-1.5 rounded-xl p-4"
            style={{
              background: `linear-gradient(160deg, ${tint(m.cssVar, 48)} 0%, ${tint(m.cssVar, 18)} 100%)`,
              boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.55), 0 10px 24px ${tint(m.cssVar, 40, 'transparent')}`,
            }}
          >
            <motion.span
              aria-hidden="true"
              className="absolute top-3 left-1/2 -z-10 size-24 -translate-x-1/2 rounded-full blur-xl"
              style={{ background: `var(${m.cssVar})` }}
              animate={reduce ? { opacity: 0.6 } : { opacity: [0.5, 0.8, 0.5], scale: [0.9, 1.05, 0.9] }}
              transition={reduce ? undefined : { duration: 4, delay: i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-gradient-to-b from-white/40 via-white/0 via-55% to-transparent dark:from-white/10"
            />
            <MoodFace mood={m.id} animated className="size-[78px] drop-shadow-[0_6px_10px_rgb(59_44_63/0.2)] transition-transform duration-300 group-hover:scale-110" />
            <span className="text-lg font-extrabold tracking-tight">{m.label}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
