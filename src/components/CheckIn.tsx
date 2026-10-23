import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { greeting } from '../lib/greeting'
import { addEntry, currentStreak, removeLastEntry, useJournal } from '../lib/journal'
import { moodById, NEEDS_CARE, type MoodId } from '../lib/moods'
import { CalmCorner } from './CalmCorner'
import { MoodFace } from './MoodFace'
import { MoodPicker } from './MoodPicker'

type Props = { onSeeMap?: () => void }

export function CheckIn({ onSeeMap }: Props) {
  const [picked, setPicked] = useState<MoodId | null>(null)
  const [calmFor, setCalmFor] = useState<MoodId | null>(null)
  const streak = currentStreak(useJournal().entries)
  const doneRef = useRef<HTMLDivElement>(null)

  const pick = (mood: MoodId) => {
    if (picked) return
    setPicked(mood)
    addEntry(mood)
    // Bring the thank-you, streak and map button into view.
    setTimeout(() => doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
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

      <div ref={doneRef} className="flex flex-col gap-6">
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
              <p className="flex items-start gap-1.5 font-bold text-ink-soft">
                <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-[var(--mood-energized)]" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.5c.6 3.2-1.3 4.9-2.8 6.6C7.6 10.9 6 12.7 6 15.2A6 6 0 0 0 18 15c0-2.6-1.4-4.3-2.6-5.6.1 1.6-.5 2.8-1.6 3.3.4-3.6-.6-7.4-1.8-10.2Z" />
                </svg>
                {streak === 1 ? 'Day 1. Your streak starts now.' : `${streak} days in a row. Keep it going!`}
              </p>
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

      </div>

      <CalmCorner mood={calmFor} onClose={() => setCalmFor(null)} />
    </section>
  )
}
