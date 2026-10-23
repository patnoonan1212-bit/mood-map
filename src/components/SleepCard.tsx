import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { dayKey, setDayExtras, useJournal } from '../lib/journal'
import { SLEEP_TIPS } from '../lib/sleep'

const APPS = ['Apple Health', 'Fitbit', 'Oura', 'Google Fit']

/** For Tired check-ins: sleep tips, last night's hours, and connecting a sleep app. */
export function SleepCard() {
  const today = dayKey(new Date())
  const hours = useJournal().days[today]?.sleepHours
  const [tip, setTip] = useState(() => Math.floor(Math.random() * SLEEP_TIPS.length))
  const [appNote, setAppNote] = useState<string | null>(null)
  const set = (v: number) => setDayExtras(today, { sleepHours: Math.min(14, Math.max(0, v)) })

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-soft" aria-labelledby="sleep-title">
      <div>
        <h3 id="sleep-title" className="text-xl font-extrabold">Let's get you some better sleep</h3>
        <p className="text-ink-soft">Small changes add up. Here's one to try tonight.</p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg p-4" style={{ background: 'color-mix(in srgb, var(--mood-tired) 20%, var(--surface))' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tip} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <p className="text-lg font-extrabold">{SLEEP_TIPS[tip].title}</p>
            <p>{SLEEP_TIPS[tip].body}</p>
          </motion.div>
        </AnimatePresence>
        <button type="button" onClick={() => setTip((t) => (t + 1) % SLEEP_TIPS.length)} className="self-start text-sm font-extrabold text-accent">
          Another tip ({tip + 1} of {SLEEP_TIPS.length}) →
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <label htmlFor="sleep-last-night" className="font-extrabold">
          How long did you sleep last night?
        </label>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => set((hours ?? 7) - 0.5)} aria-label="Less sleep" className="grid size-10 place-items-center rounded-full bg-bg-soft text-xl font-bold">−</button>
          <output id="sleep-last-night" className="w-14 text-center text-lg font-extrabold tabular-nums">{hours == null ? '–' : `${hours}h`}</output>
          <button type="button" onClick={() => set((hours ?? 7) + 0.5)} aria-label="More sleep" className="grid size-10 place-items-center rounded-full bg-bg-soft text-xl font-bold">+</button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-ink-soft">Or connect your sleep app</p>
        <div className="flex flex-wrap gap-2">
          {APPS.map((a) => (
            <button key={a} type="button" onClick={() => setAppNote(a)} className="rounded-full border-2 border-line px-3.5 py-1.5 text-sm font-bold">
              {a}
            </button>
          ))}
        </div>
        {appNote && (
          <p className="text-sm text-ink-soft" role="status">
            Connecting {appNote} is coming soon. For now, add your hours above and your journal will track them.
          </p>
        )}
      </div>
    </section>
  )
}
