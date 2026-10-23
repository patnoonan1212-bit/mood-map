import { motion } from 'framer-motion'
import { MOODS } from '../lib/moods'
import { MoodFace } from '../components/MoodFace'

/** Shown on the Map tab until today's check-in. Seeing campus is the reward for sharing your own mood. */
export default function MapLocked({ onCheckIn }: { onCheckIn: () => void }) {
  return (
    <div className="relative grid h-full place-items-center overflow-hidden bg-[linear-gradient(180deg,var(--sky-top),var(--bg))] px-6 pb-28">
      {/* Soft drifting faces behind the message hint at what's waiting. */}
      <div className="pointer-events-none absolute inset-0 blur-[2px]" aria-hidden="true">
        {MOODS.map((m, i) => (
          <motion.span
            key={m.id}
            className="absolute opacity-40"
            style={{ left: `${10 + ((i * 37) % 75)}%`, top: `${12 + ((i * 53) % 65)}%` }}
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MoodFace mood={m.id} className="size-20" />
          </motion.span>
        ))}
      </div>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative flex max-w-sm flex-col items-center gap-4 rounded-xl p-7 text-center"
      >
        <span className="grid size-16 place-items-center rounded-full bg-accent/15 text-accent">
          <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="5" y="10.5" width="14" height="10" rx="3" />
            <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
          </svg>
        </span>
        <h1 className="text-2xl font-extrabold text-balance">Check in to see how campus feels</h1>
        <p className="text-ink-soft">Share your mood for today, anonymously, and the live campus map unlocks. It takes one tap.</p>
        <motion.button
          type="button"
          onClick={onCheckIn}
          whileTap={{ scale: 0.95 }}
          className="rounded-full bg-accent px-7 py-3.5 text-lg font-extrabold text-accent-ink shadow-soft"
        >
          Check in now
        </motion.button>
      </motion.section>
    </div>
  )
}
