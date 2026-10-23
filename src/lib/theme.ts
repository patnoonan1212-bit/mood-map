import { useCallback, useEffect, useState } from 'react'

// Light is the default look. 'system' (follow the phone) is still supported if we ever want it back.
export type ThemeChoice = 'system' | 'light' | 'dark'

const KEY = 'moodmap.theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* storage can be blocked; fall back to the default */
  }
  return 'light'
}

function apply(choice: ThemeChoice) {
  const dark = choice === 'dark' || (choice === 'system' && media().matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  return dark
}

/** Light/dark handling: follows the phone's setting until the person picks one. */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(readChoice)
  const [isDark, setIsDark] = useState(() => document.documentElement.dataset.theme === 'dark')

  useEffect(() => {
    setIsDark(apply(choice))
    if (choice !== 'system') return
    const mq = media()
    const onChange = () => setIsDark(apply('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [choice])

  const choose = useCallback((next: ThemeChoice) => {
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
    setChoice(next)
  }, [])

  /** One-tap toggle: flips to the opposite of what is showing now. */
  const toggle = useCallback(() => choose(isDark ? 'light' : 'dark'), [choose, isDark])

  return { choice, isDark, choose, toggle }
}
