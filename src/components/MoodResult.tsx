import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { USING_SAMPLE_DATA, useSameMoodStats } from '../lib/campusNow'
import { currentStreak, useJournal } from '../lib/journal'
import { moodById, type MoodId } from '../lib/moods'
import { MoodFace } from './MoodFace'
import { DemoSwitch } from './DemoSwitch'
import { MotivationCard } from './MotivationCard'
import { NoteCard } from './NoteCard'
import { SleepCard } from './SleepCard'
import { SupportCard } from './SupportCard'

const LINES: Record<MoodId, string> = {
  joyful: 'Love that. Spread it around.',
  motivated: "Let's go. Make it count.",
  unmotivated: 'Some days are like that. Start small.',
  calm: 'Nice and steady. Enjoy it.',
  energized: 'Ride that wave.',
  tired: 'Rest is productive too.',
  stressed: "That's a lot. Let's make it lighter.",
  sad: "It's okay to feel this way.",
}

const tint = (cssVar: string, pct: number) => `color-mix(in srgb, var(${cssVar}) ${pct}%, var(--surface))`

function Stat({ big, small, icon, i }: { big: string; small: string; icon?: ReactNode; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 + i * 0.08, type: 'spring', stiffness: 260, damping: 24 }}
      className="flex min-w-0 flex-col gap-0.5 rounded-lg bg-surface p-4 shadow-soft"
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {icon}
        <span className="truncate text-2xl font-extrabold tabular-nums">{big}</span>
      </span>
      <span className="text-sm leading-snug text-ink-soft">{small}</span>
    </motion.div>
  )
}

type Props = { mood: MoodId; onSeeMap?: () => void; onChange: () => void; onBreathe: () => void }

/** What someone sees right after checking in: their mood, how campus compares, and what might help. */
export function MoodResult({ mood, onSeeMap, onChange, onBreathe }: Props) {
  const m = moodById(mood)
  const stats = useSameMoodStats(mood)
  const streak = currentStreak(useJournal().entries)
  const word = m.label.toLowerCase()

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        layoutId={`mood-card-${mood}`}
        className="relative isolate flex flex-col items-center gap-2 overflow-hidden rounded-xl px-5 pt-6 pb-5 text-center"
        style={{
          background: `linear-gradient(160deg, ${tint(m.cssVar, 60)} 0%, ${tint(m.cssVar, 22)} 100%)`,
          boxShadow: `0 16px 40px color-mix(in srgb, var(${m.cssVar}) 40%, transparent)`,
        }}
      >
        <span aria-hidden="true" className="absolute top-2 left-1/2 -z-10 size-44 -translate-x-1/2 rounded-full blur-2xl" style={{ background: `var(${m.cssVar})`, opacity: 0.7 }} />
        <MoodFace mood={mood} animated className="size-32 drop-shadow-[0_10px_16px_rgb(59_44_63/0.25)]" />
        <p className="text-sm font-extrabold tracking-wider text-ink-soft uppercase">You're feeling</p>
        <h2 className="text-4xl font-black tracking-tight">{m.label}</h2>
        <p className="text-lg font-bold text-ink-soft">{LINES[mood]}</p>
      </motion.div>

      {stats && (
        <section className="flex flex-col gap-2" aria-label="How campus compares">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold tracking-wider text-ink-soft uppercase">Campus right now</h3>
            {USING_SAMPLE_DATA && <DemoSwitch />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.people > 0 ? (
              <Stat i={0} big={`${Math.max(1, Math.round(stats.share * 100))}%`} small={`of campus feels ${word} too`} />
            ) : (
              <Stat i={0} big="You're first" small={`to check in ${word} this hour`} />
            )}
            {stats.hotspot ? (
              <Stat i={1} big={stats.hotspot.place.name} small={`most ${word} spot right now`} />
            ) : (
              <Stat i={1} big={`${stats.total}`} small="check-ins on campus right now" />
            )}
            <Stat i={2} big={`${streak} ${streak === 1 ? 'day' : 'days'}`} small={streak > 1 ? 'check-in streak. Keep it going!' : 'streak started. Come back tomorrow!'} />
            <Stat i={3} big={moodById(stats.campusTop).label} small="how most of campus feels" icon={<MoodFace mood={stats.campusTop} className="size-7 shrink-0" />} />
          </div>
        </section>
      )}

      {(mood === 'stressed' || mood === 'sad') && <SupportCard onBreathe={onBreathe} />}
      {mood === 'tired' && <SleepCard />}
      {mood === 'unmotivated' && <MotivationCard />}

      <NoteCard mood={m} />

      <div className="flex flex-col items-center gap-2 pt-2">
        {onSeeMap && (
          <motion.button
            type="button"
            onClick={onSeeMap}
            whileTap={{ scale: 0.95 }}
            className="w-full max-w-sm rounded-full bg-accent px-7 py-4 text-lg font-extrabold text-accent-ink shadow-soft"
          >
            See how campus feels →
          </motion.button>
        )}
        <button type="button" onClick={onChange} className="px-4 py-2 font-bold text-ink-soft underline underline-offset-4">
          Change my answer
        </button>
      </div>
    </div>
  )
}
