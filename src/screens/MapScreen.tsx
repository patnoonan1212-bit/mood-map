import { useMemo, useState } from 'react'
import { MoodMap } from '../components/MoodMap'
import { TimeScrubber } from '../components/TimeScrubber'
import { WeatherCard } from '../components/WeatherCard'
import { cellsAt, sumCounts, totalsOf } from '../lib/aggregate'
import { CAMPUS } from '../lib/campus'
import { makeSampleData } from '../lib/sampleData'
import { whenLabel } from '../lib/weather'

export default function MapScreen() {
  // Milestone 3 uses made-up data. Milestone 4 swaps this for real check-ins from the database.
  const rows = useMemo(() => makeSampleData(), [])
  const [hoursAgo, setHoursAgo] = useState(0)
  const cells = useMemo(() => cellsAt(rows, hoursAgo), [rows, hoursAgo])
  const totals = useMemo(() => totalsOf(cells), [cells])

  return (
    <div className="relative h-full overflow-hidden">
      <MoodMap cells={cells} />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="pointer-events-auto mx-auto w-full max-w-lg">
          <WeatherCard counts={totals} total={sumCounts(totals)} area={CAMPUS.areaName} when={whenLabel(hoursAgo)} isSample />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom))] px-4">
        <div className="pointer-events-auto mx-auto w-full max-w-lg">
          <TimeScrubber hoursAgo={hoursAgo} onChange={setHoursAgo} />
        </div>
      </div>
    </div>
  )
}
