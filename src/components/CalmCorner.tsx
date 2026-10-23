import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { CRISIS_RESOURCES } from '../lib/crisis'
import { moodById, type MoodId } from '../lib/moods'

const IDEAS = [
  'Drink a glass of water, slowly.',
  'Step outside for two minutes and notice three things you can see.',
  'Send a short message to someone you like. It can be just "hey".',
  'Put on one song you love and do nothing else while it plays.',
  'Unclench your jaw and drop your shoulders. Then do it once more.',
  'Write down the one thing that feels heaviest. Leave it on the page for now.',
  'Stretch your arms up high, then let them fall.',
]

// One breath: 4 seconds in, 2 hold, 6 out.
const PHASES = [
  { label: 'Breathe in', ms: 4000 },
  { label: 'Hold', ms: 2000 },
  { label: 'Breathe out', ms: 6000 },
]
const CYCLE_S = PHASES.reduce((s, p) => s + p.ms, 0) / 1000

function Breather() {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), PHASES[phase].ms)
    return () => clearTimeout(t)
  }, [phase])

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative grid size-48 place-items-center">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, var(--mood-calm) 0%, color-mix(in srgb, var(--mood-calm) 25%, transparent) 70%)' }}
          animate={reduce ? { scale: 0.85 } : { scale: [0.55, 1, 1, 0.55] }}
          transition={reduce ? undefined : { duration: CYCLE_S, times: [0, 4 / CYCLE_S, 6 / CYCLE_S, 1], ease: 'easeInOut', repeat: Infinity }}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative text-xl font-bold text-[#22343a]"
            aria-live="polite"
          >
            {PHASES[phase].label}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="text-center text-ink-soft">Follow the circle for a few breaths. There's no wrong way to do it.</p>
    </div>
  )
}

type Props = { mood: MoodId | null; onClose: () => void }

export function CalmCorner({ mood, onClose }: Props) {
  const [idea, setIdea] = useState(() => Math.floor(Math.random() * IDEAS.length))
  const closeRef = useRef<HTMLButtonElement>(null)
  const open = mood !== null

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {mood && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[rgb(29_23_48/0.35)] backdrop-blur-sm" onClick={onClose} />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="calm-title"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="relative flex max-h-[92dvh] w-full max-w-lg flex-col gap-5 overflow-y-auto rounded-t-xl bg-surface px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-lift sm:rounded-xl"
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-line sm:hidden" aria-hidden="true" />
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold tracking-wide text-ink-soft uppercase">Calm corner</p>
                <h2 id="calm-title" className="text-2xl font-extrabold text-balance">
                  Feeling {moodById(mood).words} is okay. Let's take a moment.
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close calm corner"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-bg-soft text-xl"
              >
                ×
              </button>
            </header>

            <Breather />

            <div className="flex flex-col gap-3 rounded-lg bg-bg-soft p-5">
              <p className="text-sm font-bold tracking-wide text-ink-soft uppercase">A small idea</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={idea}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-lg"
                >
                  {IDEAS[idea]}
                </motion.p>
              </AnimatePresence>
              <button
                type="button"
                onClick={() => setIdea((i) => (i + 1) % IDEAS.length)}
                className="self-start rounded-full border-2 border-line px-4 py-2 font-bold"
              >
                Show another idea
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-bold">If things feel like too much, you don't have to handle it alone.</p>
              <ul className="flex flex-col gap-2">
                {CRISIS_RESOURCES.map((r) => (
                  <li key={r.name}>
                    <a href={r.href} className="flex items-center justify-between gap-3 rounded-md border-2 border-line px-4 py-3">
                      <span className="min-w-0">
                        <span className="block font-bold">{r.name}</span>
                        <span className="block text-sm text-ink-soft">{r.note}</span>
                      </span>
                      <span className="shrink-0 text-right font-bold text-accent">{r.action}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink-soft">
                Mood Map isn't a medical or counseling service. These ideas are small comforts, not treatment.
              </p>
            </div>

            <button type="button" onClick={onClose} className="rounded-full bg-accent px-6 py-3.5 text-lg font-bold text-accent-ink">
              I'm okay for now
            </button>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
