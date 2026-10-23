import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { MOTIVATION_TIPS } from '../lib/motivation'

/** For Unmotivated check-ins: one small, doable way to get started. */
export function MotivationCard() {
  const [tip, setTip] = useState(() => Math.floor(Math.random() * MOTIVATION_TIPS.length))
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-soft" aria-labelledby="motivation-title">
      <div>
        <h3 id="motivation-title" className="text-xl font-extrabold">A tiny way to get going</h3>
        <p className="text-ink-soft">No pressure. Just one small step.</p>
      </div>
      <div className="flex flex-col gap-2 rounded-lg p-4" style={{ background: 'color-mix(in srgb, var(--mood-motivated) 18%, var(--surface))' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tip} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <p className="text-lg font-extrabold">{MOTIVATION_TIPS[tip].title}</p>
            <p>{MOTIVATION_TIPS[tip].body}</p>
          </motion.div>
        </AnimatePresence>
        <button type="button" onClick={() => setTip((t) => (t + 1) % MOTIVATION_TIPS.length)} className="self-start text-sm font-extrabold text-accent">
          Another idea ({tip + 1} of {MOTIVATION_TIPS.length}) →
        </button>
      </div>
    </section>
  )
}
