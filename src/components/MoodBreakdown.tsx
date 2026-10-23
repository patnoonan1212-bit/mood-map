import { motion } from 'framer-motion'
import type { MoodCounts } from '../lib/aggregate'
import { shares } from '../lib/feelings'
import { MoodFace } from './MoodFace'

/** Each mood with a face, its name, a bar and a percentage. Never relies on color alone. */
export function MoodBreakdown({ counts }: { counts: MoodCounts }) {
  const s = shares(counts).filter((x) => x.count > 0)
  return (
    <ul className="flex flex-col gap-2">
      {s.map((x) => (
        <li key={x.mood.id} className="flex items-center gap-3">
          <MoodFace mood={x.mood.id} className="size-8 shrink-0" />
          <span className="w-24 shrink-0 font-bold">{x.mood.label}</span>
          <span className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-bg-soft" aria-hidden="true">
            <motion.span
              className="block h-full rounded-full"
              style={{ background: `var(${x.mood.cssVar})` }}
              initial={{ width: 0 }}
              animate={{ width: `${x.share * 100}%` }}
              transition={{ type: 'spring', stiffness: 160, damping: 24 }}
            />
          </span>
          <span className="w-11 shrink-0 text-right font-bold tabular-nums">{Math.round(x.share * 100)}%</span>
        </li>
      ))}
    </ul>
  )
}
