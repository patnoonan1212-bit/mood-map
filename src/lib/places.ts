/**
 * Named spots on campus. Each area's check-ins are grouped under the nearest spot,
 * so people see "Pattee Library" instead of an abstract grid. Check-ins farther away (off campus)
 * are grouped into neighborhood-sized areas named by where they are, like "Off campus · 1.2 km SW".
 * Coordinates are [longitude, latitude]. Edit this list to fit your pilot area.
 */
import { cellToLatLng, cellToParent } from 'h3-js'
import { CAMPUS } from './campus'
import { MIN_CHECKINS_TO_SHOW } from './grid'
import { emptyCounts, sumCounts, type CellMood, type MoodCounts } from './aggregate'
import { MOODS } from './moods'

// `core` places frame the map when it first opens; the rest are a short scroll away.
export type Place = { id: string; name: string; at: [number, number]; core?: boolean }

export const PLACES: Place[] = [
  { id: 'pattee', core: true, name: 'Pattee Library', at: [-77.8652, 40.7982] },
  { id: 'hub', core: true, name: 'The HUB', at: [-77.8606, 40.7983] },
  { id: 'oldmain', core: true, name: 'Old Main', at: [-77.8627, 40.7963] },
  { id: 'downtown', core: true, name: 'Downtown', at: [-77.8598, 40.7935] },
  { id: 'east', core: true, name: 'East Halls', at: [-77.8555, 40.8043] },
  { id: 'west', core: true, name: 'West Halls', at: [-77.8704, 40.7951] },
  { id: 'pollock', core: true, name: 'Pollock Halls', at: [-77.8566, 40.7995] },
  { id: 'north', core: true, name: 'North Halls', at: [-77.8625, 40.8022] },
  { id: 'ist', core: true, name: 'Business and IST', at: [-77.867, 40.7935] },
  { id: 'rec', core: true, name: 'Rec Hall', at: [-77.8697, 40.7965] },
  { id: 'arboretum', name: 'The Arboretum', at: [-77.8692, 40.8068] },
  { id: 'bjc', name: 'Bryce Jordan Center', at: [-77.8566, 40.8086] },
  { id: 'stadium', name: 'Beaver Stadium', at: [-77.8562, 40.8122] },
]

export type PlaceMood = Place & { counts: MoodCounts; total: number }

// Rough meters between two [lng, lat] points (fine at campus scale).
function meters(a: [number, number], b: [number, number]) {
  const dy = (a[1] - b[1]) * 111_320
  const dx = (a[0] - b[0]) * 111_320 * Math.cos((a[1] * Math.PI) / 180)
  return Math.hypot(dx, dy)
}

const MAX_DISTANCE_M = 500

export function nearestPlace(lngLat: [number, number]) {
  let best: Place | null = null
  let bestD = Infinity
  for (const p of PLACES) {
    const d = meters(lngLat, p.at)
    if (d < bestD) [best, bestD] = [p, d]
  }
  return bestD <= MAX_DISTANCE_M ? best : null
}

/** Add up areas into named places. Places under the privacy minimum are left out. */
// Off-campus areas: H3 resolution 7 hexagons, about 2.5 km across (a neighborhood).
const OFF_CAMPUS_RESOLUTION = 7
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

/** A place for check-ins that aren't near any named campus spot. */
function offCampusPlace(cell: string): Place {
  const parent = cellToParent(cell, OFF_CAMPUS_RESOLUTION)
  const [lat, lng] = cellToLatLng(parent)
  const at: [number, number] = [lng, lat]
  const km = meters(at, CAMPUS.center) / 1000
  const dx = (lng - CAMPUS.center[0]) * Math.cos((lat * Math.PI) / 180)
  const dy = lat - CAMPUS.center[1]
  const dir = COMPASS[Math.round(((Math.atan2(dx, dy) * 180) / Math.PI + 360) / 45) % 8]
  return { id: `off-${parent}`, name: `Off campus · ${km.toFixed(1)} km ${dir}`, at }
}

export function groupByPlace(cells: CellMood[]): PlaceMood[] {
  const byId = new Map<string, PlaceMood>()
  for (const c of cells) {
    const p = nearestPlace(c.lngLat) ?? offCampusPlace(c.cell)
    const g = byId.get(p.id) ?? { ...p, counts: emptyCounts(), total: 0 }
    for (const m of MOODS) g.counts[m.id] += c.counts[m.id]
    g.total = sumCounts(g.counts)
    byId.set(p.id, g)
  }
  return [...byId.values()].filter((p) => p.total >= MIN_CHECKINS_TO_SHOW).sort((a, b) => b.total - a.total)
}
