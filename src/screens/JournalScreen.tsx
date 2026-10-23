import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { MoodFace } from '../components/MoodFace'
import {
  averageScore,
  byDay,
  clearJournal,
  dayKey,
  dayMood,
  entriesSince,
  exampleJournal,
  moodLabel,
  setDayExtras,
  sleepInsight,
  streaks,
  useJournal,
  type Journal,
} from '../lib/journal'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function scoreWord(score: number) {
  if (score >= 80) return 'Sunny'
  if (score >= 65) return 'Mostly bright'
  if (score >= 50) return 'Partly cloudy'
  if (score >= 35) return 'Overcast'
  return 'Stormy'
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-surface p-4 shadow-soft">
      <span className="text-xs font-extrabold tracking-wider text-ink-soft uppercase">{label}</span>
      <span className="text-3xl font-extrabold tabular-nums">{value}</span>
      <span className="text-sm text-ink-soft">{sub}</span>
    </div>
  )
}

function Calendar({ journal }: { journal: Journal }) {
  const [offset, setOffset] = useState(0)
  const days = useMemo(() => byDay(journal.entries), [journal])
  const first = new Date()
  first.setDate(1)
  first.setMonth(first.getMonth() + offset)
  const monthName = first.toLocaleDateString([], { month: 'long', year: 'numeric' })
  const lead = (first.getDay() + 6) % 7
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const today = dayKey(new Date())

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-soft" aria-label="Mood calendar">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold">{monthName}</h3>
        <div className="flex gap-1">
          <button type="button" onClick={() => setOffset((o) => o - 1)} aria-label="Previous month" className="grid size-10 place-items-center rounded-full bg-bg-soft text-xl">‹</button>
          <button type="button" onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset === 0} aria-label="Next month" className="grid size-10 place-items-center rounded-full bg-bg-soft text-xl disabled:opacity-30">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-xs font-bold text-ink-soft" aria-hidden="true">{d}</span>
        ))}
        {Array.from({ length: lead }, (_, i) => <span key={`x${i}`} />)}
        {Array.from({ length: count }, (_, i) => {
          const date = new Date(first.getFullYear(), first.getMonth(), i + 1)
          const k = dayKey(date)
          const list = days.get(k)
          const mood = list ? dayMood(list) : null
          return (
            <div
              key={k}
              role="img"
              aria-label={`${date.toLocaleDateString([], { month: 'long', day: 'numeric' })}: ${mood ? moodLabel(mood) : 'no check-in'}`}
              className={`relative grid aspect-square place-items-center rounded-[10px] text-sm font-bold ${k === today ? 'ring-2 ring-ink' : ''}`}
              style={{ background: mood ? `var(--mood-${mood})` : 'var(--bg-soft)', color: mood ? '#3b2c3f' : 'var(--ink-soft)' }}
            >
              {i + 1}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Stepper({ id, label, value, unit, step, max, onChange }: { id: string; label: string; value: number | undefined; unit: string; step: number; max: number; onChange: (v: number) => void }) {
  const v = value ?? 0
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="font-bold">{label}</label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, v - step))} aria-label={`Less ${label.toLowerCase()}`} className="grid size-10 place-items-center rounded-full bg-bg-soft text-xl font-bold">−</button>
        <output id={id} className="w-20 text-center text-lg font-extrabold tabular-nums">{value == null ? '–' : `${v} ${unit}`}</output>
        <button type="button" onClick={() => onChange(Math.min(max, v + step))} aria-label={`More ${label.toLowerCase()}`} className="grid size-10 place-items-center rounded-full bg-bg-soft text-xl font-bold">+</button>
      </div>
    </div>
  )
}

export default function JournalScreen() {
  const real = useJournal()
  const [preview, setPreview] = useState(false)
  const [confirmErase, setConfirmErase] = useState(false)
  const isEmpty = real.entries.length === 0
  const journal = isEmpty && preview ? exampleJournal() : real
  const showingExample = isEmpty && preview

  const dayset = useMemo(() => new Set(byDay(journal.entries).keys()), [journal])
  const { current, best } = streaks(dayset)
  const week = entriesSince(journal.entries, 7)
  const score = averageScore(week)
  const monthCount = entriesSince(journal.entries, new Date().getDate()).length
  const insight = sleepInsight(journal)
  const today = dayKey(new Date())
  const extras = journal.days[today] ?? {}
  const recent = [...journal.entries].reverse().slice(0, 6)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-[calc(112px+env(safe-area-inset-bottom))]">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold tracking-wide text-ink-soft uppercase">Just for you</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Your journal</h1>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm font-bold text-ink-soft shadow-soft">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="3" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>
          Only on this phone
        </span>
      </header>

      {isEmpty && (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-line p-5">
          <p className="text-lg font-bold">{showingExample ? 'You are looking at example data.' : 'Your journal starts with your first check-in.'}</p>
          <p className="text-ink-soft">
            {showingExample
              ? 'None of this is yours. Check in to start your own history.'
              : 'Each tap is saved here, privately, so you can see your streaks and patterns over time.'}
          </p>
          <button type="button" onClick={() => setPreview((p) => !p)} className="self-start rounded-full bg-accent px-5 py-2.5 font-bold text-accent-ink">
            {showingExample ? 'Hide example' : 'Preview with example data'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Tile label="Streak" value={`${current}`} sub={`best ${best} days`} />
        <Tile label="Score" value={score == null ? '–' : `${score}`} sub={score == null ? 'this week' : scoreWord(score)} />
        <Tile label="Check-ins" value={`${monthCount}`} sub="this month" />
      </div>

      <Calendar journal={journal} />

      <section className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-soft" aria-label="Sleep and activity today">
        <div>
          <h3 className="text-lg font-extrabold">Sleep and activity</h3>
          <p className="text-sm text-ink-soft">Add today's numbers to see how they line up with your mood.</p>
        </div>
        <Stepper id="sleep-hours" label="Sleep" unit="h" step={0.5} max={14} value={extras.sleepHours}
          onChange={(v) => !showingExample && setDayExtras(today, { sleepHours: v })} />
        <Stepper id="active-minutes" label="Active" unit="min" step={10} max={300} value={extras.activeMinutes}
          onChange={(v) => !showingExample && setDayExtras(today, { activeMinutes: v })} />
        {insight && (
          <p className="rounded-lg bg-bg-soft p-3 text-sm">
            On days you sleep 7 hours or more, your mood score averages <b>{insight.rested}</b>, compared with <b>{insight.short}</b> on shorter nights.
          </p>
        )}
      </section>

      {recent.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="Recent check-ins">
          <h3 className="text-sm font-extrabold tracking-wider text-ink-soft uppercase">Recent check-ins</h3>
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {recent.map((e) => (
                <motion.li key={e.at} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3 shadow-soft">
                  <MoodFace mood={e.mood} className="size-9 shrink-0" />
                  <span className="font-bold">{moodLabel(e.mood)}</span>
                  <span className="ml-auto text-sm text-ink-soft tabular-nums">
                    {new Date(e.at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-soft" aria-label="Connected apps">
        <div>
          <h3 className="text-lg font-extrabold">Connect your apps</h3>
          <p className="text-sm text-ink-soft">Bring in sleep and runs automatically. Your data would stay on this phone.</p>
        </div>
        <ul className="flex flex-col gap-2">
          {[
            { name: 'Strava', what: 'Runs, rides and walks', status: 'Coming soon' },
            { name: 'Fitbit', what: 'Sleep and steps', status: 'Coming soon' },
            { name: 'Oura', what: 'Sleep and readiness', status: 'Coming soon' },
            { name: 'Apple Health and Google Health Connect', what: 'Needs the App Store or Play Store version of Mood Map', status: 'Later' },
          ].map((a) => (
            <li key={a.name} className="flex items-center justify-between gap-3 rounded-md bg-bg-soft px-4 py-3">
              <span className="min-w-0">
                <span className="block font-bold">{a.name}</span>
                <span className="block text-sm text-ink-soft">{a.what}</span>
              </span>
              <span className="shrink-0 rounded-full border-2 border-line px-3 py-1 text-sm font-bold text-ink-soft">{a.status}</span>
            </li>
          ))}
        </ul>
      </section>

      {!isEmpty && (
        <div className="flex flex-col items-start gap-2">
          {!confirmErase ? (
            <button type="button" onClick={() => setConfirmErase(true)} className="text-sm font-bold text-ink-soft underline underline-offset-4">
              Erase my journal from this phone
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface p-3 shadow-soft">
              <span className="font-bold">Erase every entry? This can't be undone.</span>
              <button type="button" onClick={() => { clearJournal(); setConfirmErase(false) }} className="rounded-full bg-[var(--mood-stressed)] px-4 py-2 font-bold text-white">Erase</button>
              <button type="button" onClick={() => setConfirmErase(false)} className="rounded-full px-4 py-2 font-bold">Keep it</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
