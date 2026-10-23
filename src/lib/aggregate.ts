import { cellCenter, MIN_CHECKINS_TO_SHOW } from './grid'
import { MOODS, type MoodId } from './moods'

export type MoodCounts = Record<MoodId, number>

/** Check-in counts for one cell during one hour. This is the only shape the map ever sees. */
export type CellHour = { cell: string; hoursAgo: number; counts: MoodCounts }

export type CellMood = { cell: string; lngLat: [number, number]; counts: MoodCounts; total: number }

export const emptyCounts = (): MoodCounts => ({ joyful: 0, calm: 0, energized: 0, tired: 0, stressed: 0, sad: 0 })

export const sumCounts = (c: MoodCounts) => MOODS.reduce((s, m) => s + c[m.id], 0)

/**
 * Combine hourly counts into what the map shows at a moment in time:
 * the hours from `hoursAgo` back to `hoursAgo + windowHours - 1`.
 * Cells with fewer than MIN_CHECKINS_TO_SHOW check-ins are left out.
 */
export function cellsAt(rows: CellHour[], hoursAgo: number, windowHours = 3): CellMood[] {
  const byCell = new Map<string, MoodCounts>()
  for (const r of rows) {
    if (r.hoursAgo < hoursAgo || r.hoursAgo >= hoursAgo + windowHours) continue
    const c = byCell.get(r.cell) ?? emptyCounts()
    for (const m of MOODS) c[m.id] += r.counts[m.id]
    byCell.set(r.cell, c)
  }
  const out: CellMood[] = []
  for (const [cell, counts] of byCell) {
    const total = sumCounts(counts)
    if (total >= MIN_CHECKINS_TO_SHOW) out.push({ cell, lngLat: cellCenter(cell), counts, total })
  }
  return out
}

export function totalsOf(cells: CellMood[]): MoodCounts {
  const t = emptyCounts()
  for (const c of cells) for (const m of MOODS) t[m.id] += c.counts[m.id]
  return t
}
