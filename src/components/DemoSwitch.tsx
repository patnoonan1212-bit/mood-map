import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { DEMO_SIZES, setDemoSize, useDemoSize, type DemoSize } from '../lib/demo'

/** The "Sample data" tag. Tapping it lets you show the app as a small pilot or a busy campus. */
export function DemoSwitch() {
  const size = useDemoSize()
  const [open, setOpen] = useState(false)
  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent"
      >
        Sample data{size === 'busy' ? ' · 10k/day' : ''} ▾
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 z-20 mt-2 flex w-60 flex-col gap-1 rounded-lg bg-surface p-2 shadow-lift"
            role="radiogroup"
            aria-label="Sample size"
          >
            <p className="px-2 pt-1 text-xs font-bold text-ink-soft">Made-up check-ins for testing. Show it as:</p>
            {(Object.keys(DEMO_SIZES) as DemoSize[]).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={size === k}
                onClick={() => {
                  setDemoSize(k)
                  setOpen(false)
                }}
                className={`rounded-md px-3 py-2 text-left font-bold ${size === k ? 'bg-bg-soft' : ''}`}
              >
                {DEMO_SIZES[k].label}
                <span className="block text-xs font-semibold text-ink-soft">About {DEMO_SIZES[k].people.toLocaleString()} people a day</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
