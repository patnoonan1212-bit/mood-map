import { motion } from 'framer-motion'
import { ThemeToggle } from './components/ThemeToggle'
import { MOODS } from './lib/moods'

// Milestone 1: a preview of the design system (colors, type, shapes) before real screens exist.
export default function App() {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,var(--sky-top),var(--bg)_55%)]">
      <main className="mx-auto flex max-w-xl flex-col gap-8 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-16">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wide text-ink-soft uppercase">Penn State · University Park</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-balance">Mood Map</h1>
          </div>
          <ThemeToggle />
        </header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="glass flex flex-col gap-3 rounded-xl p-6"
        >
          <h2 className="text-2xl font-bold">How's the sky over campus?</h2>
          <p className="text-lg leading-relaxed text-ink-soft">
            Tap how you feel. Everyone's taps blend into soft clouds of color, so you can see the
            emotional weather around you. Nobody can see who you are.
          </p>
          <button className="mt-2 self-start rounded-full bg-accent px-6 py-3 text-lg font-bold text-accent-ink shadow-soft">
            Check in
          </button>
        </motion.section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold tracking-wide text-ink-soft uppercase">Mood colors</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MOODS.map((m, i) => (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
                className="flex items-center gap-3 rounded-lg bg-surface p-4 shadow-soft"
              >
                <span
                  className="size-10 shrink-0 rounded-full"
                  style={{ background: `radial-gradient(circle at 35% 35%, white -40%, var(${m.cssVar}) 60%)` }}
                  aria-hidden="true"
                />
                <span className="text-lg font-bold">{m.label}</span>
              </motion.li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-2 rounded-lg bg-bg-soft p-5">
          <h2 className="text-sm font-bold tracking-wide text-ink-soft uppercase">Type</h2>
          <p className="text-3xl font-extrabold">Mostly calm, a little sleepy</p>
          <p className="text-lg">Body text is Nunito, rounded and easy to read at any size.</p>
          <p className="text-sm text-ink-soft">Small print and captions use the softer ink.</p>
        </section>
      </main>
    </div>
  )
}
