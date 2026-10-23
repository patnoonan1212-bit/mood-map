import { CheckIn } from '../components/CheckIn'
import { ThemeToggle } from '../components/ThemeToggle'
import { CAMPUS } from '../lib/campus'

export default function CheckInScreen({ onSeeMap }: { onSeeMap: () => void }) {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,var(--sky-top),var(--bg)_55%)]">
      <div className="mx-auto flex max-w-xl flex-col gap-8 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-[calc(112px+env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wide text-ink-soft uppercase">{CAMPUS.name} · University Park</p>
            <h1 className="text-2xl font-extrabold tracking-tight">Mood Map</h1>
          </div>
          <ThemeToggle />
        </header>
        <CheckIn onSeeMap={onSeeMap} />
      </div>
    </div>
  )
}
