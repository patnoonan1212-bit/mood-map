import { motion } from 'framer-motion'
import { headline, sentence, shares } from '../lib/feelings'
import type { PlaceMood } from '../lib/places'
import { MoodBreakdown } from './MoodBreakdown'
import { MoodFace } from './MoodFace'

/** Details for one place, shown when its bubble is tapped. */
export function PlaceCard({ place, onClose }: { place: PlaceMood; onClose: () => void }) {
  return (
    <motion.section
      key={place.id}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass flex flex-col gap-4 rounded-xl p-5"
      aria-label={`How ${place.name} feels`}
    >
      <header className="flex items-start gap-3">
        <MoodFace mood={shares(place.counts)[0].mood.id} className="size-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl leading-tight font-extrabold">{place.name}</h2>
          <p className="font-bold">{headline(place.counts)}</p>
          <p className="text-sm text-ink-soft">{sentence(place.counts)} {place.total} check-ins.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-full bg-bg-soft text-xl">
          ×
        </button>
      </header>
      <MoodBreakdown counts={place.counts} />
    </motion.section>
  )
}
