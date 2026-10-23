import type { MoodCounts } from '../lib/aggregate'
import { shares } from '../lib/feelings'
import { MoodFace } from './MoodFace'

/** A face for the main mood, wrapped in a ring that shows the whole mix of moods. */
export function MoodRing({ counts, size = 64, ring = 6 }: { counts: MoodCounts; size?: number; ring?: number }) {
  const s = shares(counts).filter((x) => x.count > 0)
  let at = 0
  const stops = s.map((x) => {
    const from = at
    at += x.share * 360
    return `var(${x.mood.cssVar}) ${from}deg ${at}deg`
  })
  const top = s[0]?.mood.id ?? 'calm'
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background: `conic-gradient(${stops.join(', ') || 'var(--line) 0deg 360deg'})` }}
      aria-hidden="true"
    >
      <span className="absolute rounded-full bg-surface" style={{ inset: ring }} />
      <MoodFace mood={top} className="relative" style={{ width: size - ring * 2 - 4, height: size - ring * 2 - 4 }} />
    </span>
  )
}
