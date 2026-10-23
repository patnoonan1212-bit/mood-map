import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { greeting } from '../lib/greeting'
import { addEntry, removeLastEntry } from '../lib/journal'
import { moodById, NEEDS_CARE, type MoodId } from '../lib/moods'
import { CalmCorner } from './CalmCorner'
import { MoodFace } from './MoodFace'
import { MoodPicker } from './MoodPicker'

type Props = { onSeeMap?: () => void }

export function CheckIn({ onSeeMap }: Props) {
  const [picked, setPicked] = useState<MoodId | null>(null)
  const [calmFor, setCalmFor] = useState<MoodId | null>(null)

  const pick = (mood: MoodId) => {
    if (picked) return
    setPicked(mood)
    addEntry(mood)
    // Give the bounce a moment to play before the calm corner slides up.
    if (NEEDS_CARE.includes(mood)) setTimeout(() => setCalmFor(mood), 650)
  }

  return (
    <section className="flex flex-col gap-6" aria-labelledby="checkin-title">
      <div className="flex flex-col gap-1">
        <p className="text-lg font-bold text-ink-soft">{greeting()}</p>
        <h2 id="checkin-title" className="text-3xl font-extrabold tracking-tight text-balance">
          How are you feeling right now?
        </h2>
        <p className="text-ink-soft">One tap. Anonymous. Nobody can see who you are.</p>
      </div>

      <MoodPicker selected={picked} onPick={pick} disabled={picked !== null} />

      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 220, damping: 24 }}
            className="glass flex items-center gap-4 rounded-lg p-4"
            role="status"
          >
            <MoodFace mood={picked} className="size-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">Thanks. You're counted as {moodById(picked).label.toLowerCase()}.</p>
              <p className="text-ink-soft">Your tap shows up on the campus map in a few minutes.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                removeLastEntry()
                setPicked(null)
              }}
              className="shrink-0 rounded-full px-3 py-2 font-bold text-accent"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {picked && onSeeMap && (
        <motion.button
          type="button"
          onClick={onSeeMap}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          whileTap={{ scale: 0.95 }}
          className="self-center rounded-full bg-accent px-7 py-3.5 text-lg font-extrabold text-accent-ink shadow-soft"
        >
          See how campus feels →
        </motion.button>
      )}

      <CalmCorner mood={calmFor} onClose={() => setCalmFor(null)} />
    </section>
  )
}
