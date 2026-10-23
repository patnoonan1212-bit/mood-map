import { motion } from 'framer-motion'
import type { MoodCounts } from '../lib/aggregate'
import { shares, weatherSentence } from '../lib/weather'
import { MoodFace } from './MoodFace'

type Props = { counts: MoodCounts; area: string; when: string; total: number; isSample: boolean }

export function WeatherCard({ counts, area, when, total, isSample }: Props) {
  const s = shares(counts).filter((x) => x.count > 0)
  const top = s[0]
  return (
    <section className="glass flex flex-col gap-3 rounded-xl p-4" aria-label="Campus mood weather">
      <div className="flex items-start gap-3">
        {top && (
          <motion.div key={top.mood.id} initial={{ scale: 0.6, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }}>
            <MoodFace mood={top.mood.id} className="size-12 shrink-0" />
          </motion.div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-extrabold tracking-wider text-ink-soft uppercase">Mood weather</p>
            {isSample && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">Sample data</span>}
          </div>
          <p className="text-lg leading-snug font-bold text-balance" aria-live="polite">
            {weatherSentence(counts, area, when)}
          </p>
        </div>
      </div>
      {total > 0 && (
        <>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-bg-soft" aria-hidden="true">
            {s.map((x) => (
              <motion.span key={x.mood.id} layout className="h-full" style={{ width: `${x.share * 100}%`, background: `var(${x.mood.cssVar})` }} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-soft">
            {s.map((x) => (
              <li key={x.mood.id} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: `var(${x.mood.cssVar})` }} aria-hidden="true" />
                {x.mood.label} {Math.round(x.share * 100)}%
              </li>
            ))}
            <li className="ml-auto tabular-nums">{total} check-ins</li>
          </ul>
        </>
      )}
    </section>
  )
}
