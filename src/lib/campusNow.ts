/**
 * What campus feels like, for the map and the check-in results.
 * Today this is SAMPLE DATA. Milestone 4 swaps the inside of `useCampusRows` for the database.
 */
import { useMemo } from 'react'
import { cellsAt, sumCounts, totalsOf, type CellHour } from './aggregate'
import { groupByPlace } from './places'
import { makeSampleData } from './sampleData'
import type { MoodId } from './moods'

export const USING_SAMPLE_DATA = true

let cached: CellHour[] | null = null
export function useCampusRows() {
  return useMemo(() => (cached ??= makeSampleData()), [])
}

export function useCampusAt(hoursAgo: number) {
  const rows = useCampusRows()
  return useMemo(() => {
    const cells = cellsAt(rows, hoursAgo)
    const totals = totalsOf(cells)
    return { cells, places: groupByPlace(cells), totals, total: sumCounts(totals) }
  }, [rows, hoursAgo])
}

/** Quick numbers for someone who just checked in with `mood`. */
export function useSameMoodStats(mood: MoodId | null) {
  const now = useCampusAt(0)
  return useMemo(() => {
    if (!mood || now.total === 0) return null
    const share = now.totals[mood] / now.total
    const ranked = now.places
      .map((p) => ({ place: p, share: p.counts[mood] / p.total }))
      .filter((x) => x.share > 0)
      .sort((a, b) => b.share - a.share)
    const top = Object.entries(now.totals).sort((a, b) => b[1] - a[1])[0][0] as MoodId
    return { share, people: now.totals[mood], total: now.total, hotspot: ranked[0] ?? null, campusTop: top }
  }, [mood, now])
}
