/**
 * SAMPLE DATA ONLY. Made-up check-ins around Penn State so the map has something to show
 * before real people use it. Delete this file (and its import in MapScreen) before launch.
 */
import { emptyCounts, type CellHour } from './aggregate'
import { toCell } from './grid'
import { MOODS, type MoodId } from './moods'

type Spot = {
  name: string
  at: [number, number] // [lat, lng]
  busy: number // how many people check in here per hour at peak
  spread: number // meters
  mood: (hour: number) => Partial<Record<MoodId, number>>
}

const night = (h: number) => h < 6 || h >= 23

const SPOTS: Spot[] = [
  { name: 'Pattee and Paterno Library', at: [40.7982, -77.8652], busy: 14, spread: 120,
    mood: (h) => (h >= 18 || h < 2 ? { stressed: 5, tired: 4, calm: 2, sad: 1, unmotivated: 2 } : { calm: 4, stressed: 3, motivated: 4, energized: 1, tired: 2 }) },
  { name: 'HUB-Robeson Center', at: [40.7983, -77.8606], busy: 16, spread: 130,
    mood: (h) => (h >= 11 && h < 15 ? { energized: 5, joyful: 4, calm: 2, stressed: 1 } : { joyful: 3, calm: 3, tired: 2, energized: 2 }) },
  { name: 'Old Main lawn', at: [40.7963, -77.8627], busy: 8, spread: 110,
    mood: () => ({ calm: 6, joyful: 3, tired: 1 }) },
  { name: 'Downtown, College Ave and Allen St', at: [40.7935, -77.8598], busy: 13, spread: 170,
    mood: (h) => (h >= 19 || h < 2 ? { joyful: 6, energized: 5, tired: 1, sad: 1 } : { calm: 3, joyful: 3, energized: 2, stressed: 1 }) },
  { name: 'East Halls', at: [40.8043, -77.8555], busy: 12, spread: 160,
    mood: (h) => (night(h) || h < 10 ? { tired: 7, calm: 2, sad: 1, unmotivated: 2 } : { joyful: 3, energized: 3, tired: 3, unmotivated: 2, stressed: 1 }) },
  { name: 'West Halls', at: [40.7951, -77.8704], busy: 8, spread: 130,
    mood: (h) => (night(h) ? { tired: 5, calm: 3, sad: 1 } : { calm: 3, joyful: 2, tired: 2, unmotivated: 2, sad: 1 }) },
  { name: 'Pollock Halls', at: [40.7995, -77.8566], busy: 8, spread: 130,
    mood: (h) => (night(h) ? { tired: 5, sad: 2, calm: 2 } : { calm: 3, joyful: 3, tired: 2 }) },
  { name: 'Business and IST buildings', at: [40.7935, -77.8670], busy: 10, spread: 140,
    mood: (h) => (h >= 8 && h < 18 ? { stressed: 5, tired: 3, motivated: 3, energized: 2, sad: 1 } : { tired: 3, calm: 2, unmotivated: 3 }) },
  { name: 'Rec Hall and the gyms', at: [40.7965, -77.8697], busy: 7, spread: 120,
    mood: () => ({ energized: 7, motivated: 5, joyful: 3, tired: 1 }) },
  { name: 'The Arboretum', at: [40.8068, -77.8692], busy: 5, spread: 160,
    mood: () => ({ calm: 7, joyful: 3 }) },
  { name: 'Beaver Stadium area', at: [40.8122, -77.8562], busy: 6, spread: 220,
    mood: () => ({ energized: 5, joyful: 5, stressed: 1 }) },
  // Off campus: apartments and neighborhoods around State College.
  { name: 'South side apartments', at: [40.7862, -77.8545], busy: 6, spread: 260,
    mood: (h) => (night(h) ? { tired: 4, joyful: 3, calm: 2, sad: 1 } : { calm: 3, tired: 2, unmotivated: 2, motivated: 2 }) },
  { name: 'Highlands neighborhood', at: [40.7880, -77.8695], busy: 4, spread: 260,
    mood: (h) => (h >= 18 ? { joyful: 4, calm: 3, tired: 2 } : { calm: 3, motivated: 2, tired: 2, stressed: 1 }) },
  { name: 'East College Ave', at: [40.7960, -77.8380], busy: 4, spread: 280,
    mood: () => ({ calm: 3, tired: 3, stressed: 2, unmotivated: 2, joyful: 1 }) },
  { name: 'North Atherton', at: [40.8190, -77.8820], busy: 3, spread: 320,
    mood: () => ({ calm: 3, motivated: 2, tired: 2, stressed: 2, sad: 1 }) },
]

// How busy campus is at each hour of the day (0 = midnight), from 0 to 1.
const ACTIVITY = [0.45, 0.38, 0.3, 0.25, 0.22, 0.22, 0.28, 0.4, 0.5, 0.7, 0.8, 0.9, 1, 1, 0.95, 0.9, 0.85, 0.85, 0.9, 0.95, 0.9, 0.8, 0.65, 0.5]

function rng(seed: number) {
  let s = seed % 2147483647 || 1
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function pickMood(weights: Partial<Record<MoodId, number>>, r: number): MoodId {
  const total = Object.values(weights).reduce((a, b) => a + (b ?? 0), 0)
  let x = r * total
  for (const m of MOODS) {
    x -= weights[m.id] ?? 0
    if (x <= 0) return m.id
  }
  return 'calm'
}

// How campus as a whole tends to feel at each hour, for check-ins away from the named spots.
const anywhere = (h: number): Partial<Record<MoodId, number>> =>
  h < 7 || h >= 23
    ? { tired: 5, calm: 3, sad: 1, unmotivated: 2, stressed: 1 }
    : h < 12
      ? { tired: 3, calm: 3, motivated: 3, energized: 2, joyful: 2, stressed: 2, unmotivated: 1 }
      : h < 18
        ? { calm: 3, joyful: 3, energized: 3, motivated: 2, stressed: 3, tired: 2, unmotivated: 1, sad: 1 }
        : { joyful: 4, calm: 3, energized: 2, tired: 3, stressed: 2, sad: 1, unmotivated: 1 }

// Rough box around central campus and downtown, for scattered check-ins.
const SCATTER = { lat: [40.7905, 40.8115], lng: [-77.8735, -77.8525] }

/**
 * 24 hours of fake hourly counts, ending at `now`. Same output all day, so screens don't jump.
 * `scale` multiplies how many people check in (1 is a small pilot, about 8.5 is 10,000 people a day).
 */
export function makeSampleData(now = new Date(), scale = 1): CellHour[] {
  const day = Math.floor(now.getTime() / 864e5)
  const rand = rng(day * 7919 + 13)
  const rows = new Map<string, CellHour>()

  for (let hoursAgo = 0; hoursAgo < 24; hoursAgo++) {
    const hour = (now.getHours() - hoursAgo + 24) % 24
    for (const spot of SPOTS) {
      const n = Math.round(spot.busy * scale * ACTIVITY[hour] * (0.6 + rand() * 0.8))
      const weights = spot.mood(hour)
      for (let i = 0; i < n; i++) {
        // Random point within `spread` meters of the spot.
        const d = Math.sqrt(rand()) * spot.spread * (scale > 1 ? 1.4 : 1)
        const a = rand() * Math.PI * 2
        const lat = spot.at[0] + (d * Math.cos(a)) / 111_320
        const lng = spot.at[1] + (d * Math.sin(a)) / (111_320 * Math.cos((spot.at[0] * Math.PI) / 180))
        const cell = toCell(lat, lng)
        const key = `${cell}:${hoursAgo}`
        const row = rows.get(key) ?? { cell, hoursAgo, counts: emptyCounts() }
        row.counts[pickMood(weights, rand())]++
        rows.set(key, row)
      }
    }
    // On a busy campus, people check in everywhere: dorms, walkways, apartments downtown.
    const scattered = scale > 1 ? Math.round(30 * scale * ACTIVITY[hour] * (0.8 + rand() * 0.4)) : 0
    for (let i = 0; i < scattered; i++) {
      const lat = SCATTER.lat[0] + rand() * (SCATTER.lat[1] - SCATTER.lat[0])
      const lng = SCATTER.lng[0] + rand() * (SCATTER.lng[1] - SCATTER.lng[0])
      const cell = toCell(lat, lng)
      const key = `${cell}:${hoursAgo}`
      const row = rows.get(key) ?? { cell, hoursAgo, counts: emptyCounts() }
      row.counts[pickMood(anywhere(hour), rand())]++
      rows.set(key, row)
    }
  }
  return [...rows.values()]
}
