// The eight moods people can pick. Order here is the order of the buttons.
export const MOODS = [
  { id: 'joyful', label: 'Joyful', cssVar: '--mood-joyful', words: 'joyful' },
  { id: 'calm', label: 'Calm', cssVar: '--mood-calm', words: 'calm' },
  { id: 'energized', label: 'Energized', cssVar: '--mood-energized', words: 'energized' },
  { id: 'motivated', label: 'Motivated', cssVar: '--mood-motivated', words: 'motivated' },
  { id: 'tired', label: 'Tired', cssVar: '--mood-tired', words: 'sleepy' },
  { id: 'unmotivated', label: 'Unmotivated', cssVar: '--mood-unmotivated', words: 'unmotivated' },
  { id: 'stressed', label: 'Stressed', cssVar: '--mood-stressed', words: 'stressed' },
  { id: 'sad', label: 'Sad', cssVar: '--mood-sad', words: 'a bit blue' },
] as const

export type MoodId = (typeof MOODS)[number]['id']
export type Mood = (typeof MOODS)[number]

export const moodById = (id: MoodId): Mood => MOODS.find((m) => m.id === id)!

/** Moods that open the Calm Corner after a check-in. */
export const NEEDS_CARE: readonly MoodId[] = ['stressed', 'sad']
