import { motion } from 'framer-motion'
import { headline, shares } from '../lib/feelings'
import type { PlaceMood } from '../lib/places'
import { MoodFace } from './MoodFace'

/** The same places as the map, as an easy-to-read list. Busiest first. */
export function PlaceList({ places, onSelect }: { places: PlaceMood[]; onSelect: (id: string) => void }) {
  if (!places.length)
    return <p className="rounded-lg bg-surface p-5 text-center text-ink-soft shadow-soft">Not enough check-ins at this hour to show any places yet.</p>
  return (
    <ul className="flex flex-col gap-2.5">
      {places.map((p, i) => (
        <motion.li key={p.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <button type="button" onClick={() => onSelect(p.id)} className="flex w-full items-center gap-3 rounded-lg bg-surface p-3 pr-4 text-left shadow-soft">
            <MoodFace mood={shares(p.counts)[0].mood.id} className="size-12 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-lg font-extrabold">{p.name}</span>
              <span className="block text-ink-soft">{headline(p.counts)}</span>
            </span>
            <span className="shrink-0 text-sm font-bold text-ink-soft tabular-nums">{p.total} check-ins</span>
          </button>
        </motion.li>
      ))}
    </ul>
  )
}
