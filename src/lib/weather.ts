import { sumCounts, type MoodCounts } from './aggregate'
import { MOODS, type Mood } from './moods'

export type MoodShare = { mood: Mood; count: number; share: number }

export function shares(counts: MoodCounts): MoodShare[] {
  const total = sumCounts(counts)
  return MOODS.map((mood) => ({ mood, count: counts[mood.id], share: total ? counts[mood.id] / total : 0 })).sort(
    (a, b) => b.count - a.count,
  )
}

/** "Campus is feeling mostly calm and a little sleepy right now." */
export function weatherSentence(counts: MoodCounts, area: string, when: string) {
  const s = shares(counts)
  if (!s[0] || s[0].count === 0) return `Not enough check-ins yet to read the sky ${when}.`
  const [top, second] = s
  const lead = top.share >= 0.45 ? 'mostly' : top.share >= 0.3 ? 'largely' : 'a mix, leaning'
  const tail = second && second.share >= 0.15 ? ` and a little ${second.mood.words}` : ''
  return `${area} is feeling ${lead} ${top.mood.words}${tail} ${when}.`
}

export function whenLabel(hoursAgo: number, now = new Date()) {
  if (hoursAgo === 0) return 'right now'
  const t = new Date(now.getTime() - hoursAgo * 36e5)
  return `around ${t.toLocaleTimeString([], { hour: 'numeric' })}`
}
