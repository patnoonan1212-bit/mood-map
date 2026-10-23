import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MOODS, type MoodId } from '../lib/moods'
import { MoodFace } from './MoodFace'

type Props = {
  selected: MoodId | null
  onPick: (mood: MoodId) => void
  disabled?: boolean
}

const tint = (cssVar: string, pct: number, base = 'var(--surface)') =>
  `color-mix(in srgb, var(${cssVar}) ${pct}%, ${base})`

/** Little sparks that fly out of a button when it is chosen. */
function Burst({ cssVar }: { cssVar: string }) {
  const sparks = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 + 0.3
    const dist = 70 + (i % 3) * 14
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 6 + (i % 3) * 3 }
  })
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
      <motion.span
        className="absolute size-24 rounded-full border-4"
        style={{ borderColor: `var(${cssVar})` }}
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: s.size, height: s.size, background: i % 2 ? `var(${cssVar})` : 'white' }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: s.x, y: s.y, scale: 0.2, opacity: 0 }}
          transition={{ duration: 0.75, ease: [0.2, 0.8, 0.3, 1] }}
        />
      ))}
    </div>
  )
}

export function MoodPicker({ selected, onPick, disabled }: Props) {
  const reduce = useReducedMotion()

  return (
    <div role="radiogroup" aria-label="How are you feeling?" className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
      {MOODS.map((m, i) => {
        const isOn = selected === m.id
        const isDimmed = selected !== null && !isOn
        return (
          <motion.button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={isOn}
            disabled={disabled}
            onClick={() => onPick(m.id)}
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{
              opacity: isDimmed ? 0.45 : 1,
              y: 0,
              scale: isOn ? [1, 1.1, 0.96, 1.03] : isDimmed ? 0.96 : 1,
            }}
            transition={{
              opacity: { delay: selected ? 0 : 0.05 * i, duration: 0.3 },
              y: { delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 22 },
              scale: isOn ? { duration: 0.5, ease: 'easeOut' } : { type: 'spring', stiffness: 300, damping: 22 },
            }}
            whileHover={disabled ? undefined : { y: -4 }}
            whileTap={disabled ? undefined : { scale: 0.9 }}
            className="group relative isolate flex min-h-36 flex-col items-center justify-center gap-2 overflow-visible rounded-xl p-4 disabled:cursor-default"
            style={{
              background: `linear-gradient(160deg, ${tint(m.cssVar, 48)} 0%, ${tint(m.cssVar, 18)} 100%)`,
              boxShadow: isOn
                ? `0 0 0 3px var(--surface), 0 0 0 6px var(${m.cssVar}), 0 14px 34px ${tint(m.cssVar, 55, 'transparent')}`
                : `inset 0 1px 0 rgb(255 255 255 / 0.55), 0 10px 24px ${tint(m.cssVar, 40, 'transparent')}`,
            }}
          >
            {/* Soft glow that breathes behind the face */}
            <motion.span
              aria-hidden="true"
              className="absolute top-3 left-1/2 -z-10 size-24 -translate-x-1/2 rounded-full blur-xl"
              style={{ background: `var(${m.cssVar})` }}
              animate={reduce ? { opacity: 0.6 } : { opacity: [0.5, 0.8, 0.5], scale: [0.9, 1.05, 0.9] }}
              transition={reduce ? undefined : { duration: 4, delay: i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Glassy shine across the top */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-gradient-to-b from-white/40 via-white/0 via-55% to-transparent dark:from-white/10"
            />

            <motion.span
              className="block drop-shadow-[0_6px_10px_rgb(59_44_63/0.18)]"
              animate={reduce ? undefined : { y: [0, -4, 0], rotate: [0, i % 2 ? 3 : -3, 0] }}
              transition={reduce ? undefined : { duration: 3.2, delay: i * 0.35, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MoodFace mood={m.id} className="size-[72px] transition-transform duration-300 group-hover:scale-110" />
            </motion.span>
            <span className="text-lg font-extrabold tracking-tight">{m.label}</span>

            <AnimatePresence>
              {isOn && (
                <motion.span
                  key="check"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.15 }}
                  className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-ink text-surface shadow-soft"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                </motion.span>
              )}
            </AnimatePresence>
            {isOn && !reduce && <Burst cssVar={m.cssVar} />}
          </motion.button>
        )
      })}
    </div>
  )
}
