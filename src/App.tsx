import { CheckIn } from './components/CheckIn'
import { ThemeToggle } from './components/ThemeToggle'

export default function App() {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,var(--sky-top),var(--bg)_55%)]">
      <main className="mx-auto flex max-w-xl flex-col gap-8 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-16">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wide text-ink-soft uppercase">Penn State · University Park</p>
            <h1 className="text-2xl font-extrabold tracking-tight">Mood Map</h1>
          </div>
          <ThemeToggle />
        </header>
        <CheckIn />
      </main>
    </div>
  )
}
