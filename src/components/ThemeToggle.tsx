import { motion } from 'framer-motion'
import { useTheme } from '../lib/theme'

export function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="glass grid size-12 place-items-center rounded-full text-ink"
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        {isDark ? (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" fillOpacity=".15" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4.2" fill="currentColor" fillOpacity=".15" />
            <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
          </>
        )}
      </svg>
    </motion.button>
  )
}
