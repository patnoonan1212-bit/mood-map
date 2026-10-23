/**
 * Your private journal. Stored ONLY in this browser (localStorage) and never sent anywhere.
 */
import { useEffect, useState } from 'react'
import { MOODS, type MoodId } from './moods'

export type JournalEntry = { at: string; mood: MoodId } // at = ISO time
export type DayExtras = { sleepHours?: number; activeMinutes?: number }
export type Journal = { entries: JournalEntry[]; days: Record<string, DayExtras> } // days keyed by YYYY-MM-DD

const KEY = 'moodmap.journal.v1'
const EVENT = 'moodmap:journal'

/** How good each mood feels, 0 to 100. Used for the mood score. */
export const MOOD_SCORE: Record<MoodId, number> = { joyful: 100, energized: 85, calm: 80, tired: 45, stressed: 25, sad: 15 }

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parseDay = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function read(): Journal {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (j && Array.isArray(j.entries)) return { entries: j.entries, days: j.days ?? {} }
  } catch {
    /* blocked or corrupt storage: start fresh */
  }
  return { entries: [], days: {} }
}

function write(j: Journal) {
  try {
    localStorage.setItem(KEY, JSON.stringify(j))
  } catch {
    /* storage full or blocked; the in-memory copy still works this session */
  }
  window.dispatchEvent(new Event(EVENT))
}

export function addEntry(mood: MoodId, at = new Date()) {
  const j = read()
  j.entries.push({ at: at.toISOString(), mood })
  write(j)
}

export function removeLastEntry() {
  const j = read()
  j.entries.pop()
  write(j)
}

export function setDayExtras(day: string, extras: DayExtras) {
  const j = read()
  j.days[day] = { ...j.days[day], ...extras }
  write(j)
}

export function clearJournal() {
  write({ entries: [], days: {} })
}

export function useJournal() {
  const [journal, setJournal] = useState<Journal>(read)
  useEffect(() => {
    const sync = () => setJournal(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return journal
}

// ---------- numbers for the journal screen ----------

/** Each day's entries, newest day first. */
export function byDay(entries: JournalEntry[]) {
  const map = new Map<string, JournalEntry[]>()
  for (const e of entries) {
    const k = dayKey(new Date(e.at))
    map.set(k, [...(map.get(k) ?? []), e])
  }
  return map
}

/** The mood that shows up most on a day (ties go to the latest). */
export function dayMood(list: JournalEntry[]): MoodId {
  const counts = new Map<MoodId, number>()
  let best: MoodId = list[list.length - 1].mood
  for (const e of list) {
    counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1)
    if ((counts.get(e.mood) ?? 0) >= (counts.get(best) ?? 0)) best = e.mood
  }
  return best
}

export function streaks(days: Set<string>, today = new Date()) {
  const d = new Date(today)
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1) // today isn't over yet
  let current = 0
  while (days.has(dayKey(d))) {
    current++
    d.setDate(d.getDate() - 1)
  }
  const sorted = [...days].sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const k of sorted) {
    const t = parseDay(k)
    run = prev && Math.round((t.getTime() - prev.getTime()) / 864e5) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = t
  }
  return { current, best }
}

export function averageScore(entries: JournalEntry[]) {
  if (!entries.length) return null
  return Math.round(entries.reduce((s, e) => s + MOOD_SCORE[e.mood], 0) / entries.length)
}

export function entriesSince(entries: JournalEntry[], daysBack: number, now = new Date()) {
  const from = new Date(now)
  from.setHours(0, 0, 0, 0)
  from.setDate(from.getDate() - (daysBack - 1))
  return entries.filter((e) => new Date(e.at) >= from)
}

/** Compare mood on well-rested days with short-sleep days. Needs a few days of each. */
export function sleepInsight(j: Journal) {
  const groups = { rested: [] as number[], short: [] as number[] }
  const days = byDay(j.entries)
  for (const [k, list] of days) {
    const h = j.days[k]?.sleepHours
    if (h == null) continue
    const score = averageScore(list)!
    ;(h >= 7 ? groups.rested : groups.short).push(score)
  }
  if (groups.rested.length < 3 || groups.short.length < 3) return null
  const avg = (a: number[]) => Math.round(a.reduce((s, x) => s + x, 0) / a.length)
  return { rested: avg(groups.rested), short: avg(groups.short) }
}

/** True once the person has checked in today. The live map unlocks after that. */
export const checkedInToday = (entries: JournalEntry[], now = new Date()) =>
  entries.some((e) => dayKey(new Date(e.at)) === dayKey(now))

export const currentStreak = (entries: JournalEntry[]) => streaks(new Set(byDay(entries).keys())).current

export const moodLabel = (id: MoodId) => MOODS.find((m) => m.id === id)!.label

/** Example journal for the preview button. Never saved. */
export function exampleJournal(now = new Date()): Journal {
  let s = 42
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  const entries: JournalEntry[] = []
  const days: Record<string, DayExtras> = {}
  for (let i = 40; i >= 0; i--) {
    if (i > 12 && r() < 0.2) continue
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const sleep = Math.round((5 + r() * 4) * 2) / 2
    days[dayKey(d)] = { sleepHours: sleep, activeMinutes: r() < 0.5 ? Math.round(r() * 60) : 0 }
    const n = 1 + Math.floor(r() * 2)
    for (let k = 0; k < n; k++) {
      d.setHours(9 + k * 6, Math.floor(r() * 60))
      const pool: MoodId[] = sleep >= 7 ? ['joyful', 'calm', 'energized', 'calm', 'tired'] : ['tired', 'stressed', 'calm', 'sad', 'tired']
      entries.push({ at: d.toISOString(), mood: pool[Math.floor(r() * pool.length)] })
    }
  }
  return { entries, days }
}
