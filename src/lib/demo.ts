/**
 * Demo sizes for the SAMPLE data, so the app can be shown as a small pilot or as a busy campus.
 * Pick one in the app by tapping the "Sample data" tag, or open the app with #demo-10k or
 * #demo-pilot at the end of its address. Goes away with the sample data before launch.
 */
import { useEffect, useState } from 'react'

export type DemoSize = 'pilot' | 'busy'

export const DEMO_SIZES: Record<DemoSize, { label: string; people: number; scale: number }> = {
  pilot: { label: 'Small pilot', people: 300, scale: 1 },
  busy: { label: '10,000 daily users', people: 10_000, scale: 6 },
}

const KEY = 'moodmap.demoSize'
const EVENT = 'moodmap:demo'

function read(): DemoSize {
  const hash = location.hash.toLowerCase()
  if (hash === '#demo-10k') return 'busy'
  if (hash === '#demo-pilot') return 'pilot'
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'busy' || v === 'pilot') return v
  } catch {
    /* storage blocked */
  }
  return 'pilot'
}

export function setDemoSize(size: DemoSize) {
  try {
    localStorage.setItem(KEY, size)
  } catch {
    /* storage blocked; still switches for this visit */
  }
  if (location.hash.startsWith('#demo')) history.replaceState(null, '', location.pathname + location.search)
  current = size
  window.dispatchEvent(new Event(EVENT))
}

let current: DemoSize | null = null
export const demoSize = () => (current ??= read())

export function useDemoSize() {
  const [size, setSize] = useState<DemoSize>(demoSize)
  useEffect(() => {
    const sync = () => setSize(demoSize())
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])
  return size
}
