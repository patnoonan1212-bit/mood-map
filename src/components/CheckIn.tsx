import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { greeting } from '../lib/greeting'
import { addEntry, removeLastEntry } from '../lib/journal'
import type { MoodId } from '../lib/moods'
import { CalmCorner } from './CalmCorner'
import { EmotionBurst } from './EmotionBurst'
import { MoodPicker } from './MoodPicker'
import { MoodResult } from './MoodResult'

type Props = { onSeeMap?: () => void }

export function CheckIn({ onSeeMap }: Props) {
  const reduce = useReducedMotion()
  const [picked, setPicked] = useState<MoodId | null>(null)
  const [burst, setBurst] = useState<{ mood: MoodId; x: number; y: number; key: number } | null>(null)
  const [calmFor, setCalmFor] = useState<MoodId | null>(null)

  const pick = (mood: MoodId, at: { x: number; y: number }) => {
    if (picked) return
    addEntry(mood)
    if (!reduce) {
      // Start the burst on the next frame, outside the layout change below, so it plays in full.
      requestAnimationFrame(() => setBurst({ mood, ...at, key: Date.now() }))
      setTimeout(() => setBurst(null), 2400)
    }
    setPicked(mood)
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    document.querySelector('main')?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  const change = () => {
    removeLastEntry()
    setPicked(null)
  }

  return (
    <section className="flex flex-col gap-6" aria-labelledby="checkin-title">
      <AnimatePresence initial={false}>
        {!picked && (
          <motion.div key="intro" exit={{ opacity: 0, height: 0, marginBottom: -24 }} transition={{ duration: 0.3 }} className="flex flex-col gap-1 overflow-hidden">
            <p className="text-lg font-bold text-ink-soft">{greeting()}</p>
            <h2 id="checkin-title" className="text-3xl font-extrabold tracking-tight text-balance">
              How are you feeling right now?
            </h2>
            <p className="text-ink-soft">One tap. Anonymous. Nobody can see who you are.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <LayoutGroup>
        <AnimatePresence mode="popLayout" initial={false}>
          {!picked ? (
            <motion.div key="picker" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <MoodPicker onPick={pick} />
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
              <MoodResult mood={picked} onSeeMap={onSeeMap} onChange={change} onBreathe={() => setCalmFor(picked)} />
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>

      {burst && <EmotionBurst key={burst.key} mood={burst.mood} x={burst.x} y={burst.y} />}
      <CalmCorner mood={calmFor} onClose={() => setCalmFor(null)} />
    </section>
  )
}
