import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export type Tab = 'checkin' | 'map' | 'journal'

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: 'checkin',
    label: 'Check in',
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.8 14.2q3.2 3 6.4 0" />
        <path d="M9.3 9.8h.01M14.7 9.8h.01" strokeWidth="2.6" />
      </>
    ),
  },
  {
    id: 'map',
    label: 'Map',
    icon: (
      <>
        <path d="M3.5 6.5l5.5-2.5 6 2.5 5.5-2.5v13.5l-5.5 2.5-6-2.5-5.5 2.5z" />
        <path d="M9 4v13.5M15 6.5V20" />
      </>
    ),
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: (
      <>
        <rect x="4.5" y="5" width="15" height="15" rx="3.5" />
        <path d="M4.5 9.5h15M9 3.5v3M15 3.5v3" />
        <path d="M8.5 13.5h.01M12 13.5h.01M15.5 13.5h.01M8.5 16.5h.01M12 16.5h.01" strokeWidth="2.6" />
      </>
    ),
  },
]

export function TabBar({ active, onChange, mapLocked }: { active: Tab; onChange: (t: Tab) => void; mapLocked?: boolean }) {
  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(12px,env(safe-area-inset-bottom))]"
    >
      <ul className="glass pointer-events-auto mx-auto flex max-w-sm items-stretch justify-between gap-1 rounded-full p-1.5">
        {TABS.map((t) => {
          const on = t.id === active
          return (
            <li key={t.id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(t.id)}
                aria-current={on ? 'page' : undefined}
                className={`relative isolate flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-full text-xs font-extrabold transition-colors ${on ? 'text-accent-ink' : 'text-ink-soft'}`}
              >
                {on && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-accent shadow-soft"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {t.icon}
                </svg>
                {t.label}
                {t.id === 'map' && mapLocked && (
                  <span className="absolute top-1.5 right-[calc(50%-22px)] grid size-5 place-items-center rounded-full bg-ink text-surface" aria-label="locked until you check in">
                    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11" />
                    </svg>
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
