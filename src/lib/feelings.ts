import { sumCounts, type MoodCounts } from './aggregate'
import { MOODS, type Mood } from './moods'

export type MoodShare = { mood: Mood; count: number; share: number }

export function shares(counts: MoodCounts): MoodShare[] {
  const total = sumCounts(counts)
  return MOODS.map((mood) => ({ mood, count: counts[mood.id], share: total ? counts[mood.id] / total : 0 })).sort(
    (a, b) => b.count - a.count,
  )
}

/** Short headline for a place, like "Mostly calm" or "Calm and tired". */
export function headline(counts: MoodCounts) {
  const [top, second] = shares(counts)
  if (!top || top.count === 0) return 'Not enough check-ins yet'
  const name = top.mood.label.toLowerCase()
  if (top.share >= 0.5 || !second || second.share < 0.2) return `Mostly ${name}`
  return `${top.mood.label} and ${second.mood.label.toLowerCase()}`
}

/** One plain sentence, like "Most people here feel calm. Some feel tired." */
export function sentence(counts: MoodCounts, who = 'people here') {
  const [top, second] = shares(counts)
  if (!top || top.count === 0) return 'Not enough people have checked in yet.'
  const lead = top.share >= 0.5 ? `Most ${who} feel` : `A lot of ${who} feel`
  const tail = second && second.share >= 0.15 ? ` Some feel ${second.mood.label.toLowerCase()}.` : ''
  return `${lead} ${top.mood.label.toLowerCase()}.${tail}`
}

export function timeLabel(hoursAgo: number, now = new Date()) {
  if (hoursAgo === 0) return 'Right now'
  return new Date(now.getTime() - hoursAgo * 36e5).toLocaleTimeString([], { hour: 'numeric' })
}
