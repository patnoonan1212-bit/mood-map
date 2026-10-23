import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type Props = { hoursAgo: number; onChange: (h: number) => void; maxHours?: number }

const label = (hoursAgo: number) =>
  hoursAgo === 0 ? 'Now' : new Date(Date.now() - hoursAgo * 36e5).toLocaleTimeString([], { hour: 'numeric' })

/** Slide left to go back in time. Play replays the last day hour by hour. */
export function TimeScrubber({ hoursAgo, onChange, maxHours = 23 }: Props) {
  const [playing, setPlaying] = useState(false)
  const value = maxHours - hoursAgo // slider runs left (past) to right (now)

  useEffect(() => {
    if (!playing) return
    if (hoursAgo === 0) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => onChange(hoursAgo - 1), 650)
    return () => clearTimeout(t)
  }, [playing, hoursAgo, onChange])

  const play = () => {
    if (playing) return setPlaying(false)
    if (hoursAgo === 0) onChange(maxHours)
    setPlaying(true)
  }

  return (
    <section className="glass flex items-center gap-3 rounded-xl p-3 pl-3.5" aria-label="Replay the last 24 hours">
      <motion.button
        type="button"
        onClick={play}
        whileTap={{ scale: 0.9 }}
        aria-label={playing ? 'Pause replay' : 'Replay the last 24 hours'}
        className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-ink shadow-soft"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
          {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l10.5-6.5z" />}
        </svg>
      </motion.button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-bold text-ink-soft">24 hours ago</span>
          <span className="font-extrabold tabular-nums">{label(hoursAgo)}</span>
        </div>
        <input
          id="time-scrubber"
          type="range"
          min={0}
          max={maxHours}
          step={1}
          value={value}
          onChange={(e) => {
            setPlaying(false)
            onChange(maxHours - Number(e.target.value))
          }}
          aria-label="Time of day"
          aria-valuetext={hoursAgo === 0 ? 'Now' : `${hoursAgo} hours ago, ${label(hoursAgo)}`}
          className="mood-range w-full"
        />
      </div>
    </section>
  )
}
