import { motion } from 'framer-motion'
import { ON_CAMPUS, ONLINE, URGENT, type Resource } from '../lib/support'

function ResourceList({ title, items }: { title: string; items: Resource[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-extrabold tracking-wider text-ink-soft uppercase">{title}</h4>
      <ul className="flex flex-col gap-2">
        {items.map((r) => (
          <li key={r.name}>
            <a
              href={r.href}
              target={r.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-md bg-bg-soft px-4 py-3"
            >
              <span className="min-w-0">
                <span className="block font-bold">{r.name}</span>
                <span className="block text-sm text-ink-soft">{r.what}</span>
              </span>
              <span className="shrink-0 text-right text-sm font-extrabold text-accent">{r.action}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** For Stressed and Sad check-ins: a breathing break, campus and online support, and crisis lines. */
export function SupportCard({ onBreathe }: { onBreathe: () => void }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-soft" aria-labelledby="support-title">
      <div>
        <h3 id="support-title" className="text-xl font-extrabold">Things that can help</h3>
        <p className="text-ink-soft">You don't have to sort this out alone. Pick whatever feels doable.</p>
      </div>
      <motion.button
        type="button"
        onClick={onBreathe}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-3 rounded-lg p-4 text-left font-extrabold"
        style={{ background: 'color-mix(in srgb, var(--mood-calm) 22%, var(--surface))' }}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--mood-calm)] text-white">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 9h10a3 3 0 1 0-3-3M4 15h14a3 3 0 1 1-3 3M4 12h7" />
          </svg>
        </span>
        <span>
          Take a 1-minute breathing break
          <span className="block text-sm font-bold text-ink-soft">A calm circle to breathe along with</span>
        </span>
      </motion.button>
      <ResourceList title="On campus" items={ON_CAMPUS} />
      <ResourceList title="Online" items={ONLINE} />
      <ResourceList title="Need to talk to someone now?" items={URGENT} />
      <p className="text-sm text-ink-soft">Mood Map isn't a medical or counseling service. If you or someone else is in danger, call 911.</p>
    </section>
  )
}
