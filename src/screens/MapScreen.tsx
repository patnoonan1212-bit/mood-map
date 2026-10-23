import { AnimatePresence } from 'framer-motion'
import { useMemo, useState } from 'react'
import { CampusCard } from '../components/CampusCard'
import { MoodMap } from '../components/MoodMap'
import { PlaceCard } from '../components/PlaceCard'
import { PlaceList } from '../components/PlaceList'
import { TimeScrubber } from '../components/TimeScrubber'
import type { MapView } from '../components/ViewSwitch'
import { cellsAt, sumCounts, totalsOf } from '../lib/aggregate'
import { timeLabel } from '../lib/feelings'
import { groupByPlace } from '../lib/places'
import { makeSampleData } from '../lib/sampleData'

export default function MapScreen() {
  // Milestone 3 uses made-up data. Milestone 4 swaps this for real check-ins from the database.
  const rows = useMemo(() => makeSampleData(), [])
  const [hoursAgo, setHoursAgo] = useState(0)
  const [view, setView] = useState<MapView>('map')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const cells = useMemo(() => cellsAt(rows, hoursAgo), [rows, hoursAgo])
  const places = useMemo(() => groupByPlace(cells), [cells])
  const totals = useMemo(() => totalsOf(cells), [cells])
  const selected = places.find((p) => p.id === selectedId) ?? null

  const [hasPicked, setHasPicked] = useState(false)

  const choose = (id: string | null) => {
    setSelectedId(id)
    if (id) setHasPicked(true)
    if (id) setView('map')
  }

  return (
    <div className="relative h-full overflow-hidden">
      <MoodMap places={places} selectedId={selectedId} onSelect={choose} />

      {view === 'list' && <div className="absolute inset-0 bg-bg/85 backdrop-blur-md" aria-hidden="true" />}

      <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[calc(92px+env(safe-area-inset-bottom))] flex flex-col gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="pointer-events-auto mx-auto w-full max-w-lg">
          <CampusCard
            counts={totals}
            total={sumCounts(totals)}
            when={timeLabel(hoursAgo)}
            isSample
            view={view}
            onView={(v) => {
              setView(v)
              setSelectedId(null)
            }}
          />
        </div>

        {view === 'list' && (
          <div className="pointer-events-auto mx-auto -mx-1 w-full max-w-lg min-h-0 flex-1 overflow-y-auto px-1 pb-2">
            <PlaceList places={places} onSelect={choose} />
          </div>
        )}

        <div className="pointer-events-auto mx-auto mt-auto flex w-full max-w-lg flex-col gap-3">
          <AnimatePresence mode="wait">
            {selected && view === 'map' && <PlaceCard key={selected.id} place={selected} onClose={() => setSelectedId(null)} />}
          </AnimatePresence>
          {view === 'map' && !selected && !hasPicked && places.length > 0 && (
            <p className="self-center rounded-full bg-ink px-4 py-2 text-sm font-bold text-surface shadow-soft">
              Tap a face to see how that place feels
            </p>
          )}
          {!(selected && view === 'map') && <TimeScrubber hoursAgo={hoursAgo} onChange={setHoursAgo} />}
        </div>
      </div>
    </div>
  )
}
