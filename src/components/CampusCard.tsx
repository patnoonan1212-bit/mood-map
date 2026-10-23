import type { MoodCounts } from '../lib/aggregate'
import { useDayTotal } from '../lib/campusNow'
import { headline, sentence, shares } from '../lib/feelings'
import { DemoSwitch } from './DemoSwitch'
import type { MapView } from './ViewSwitch'
import { ViewSwitch } from './ViewSwitch'
import { MoodFace } from './MoodFace'

type Props = { counts: MoodCounts; total: number; when: string; isSample: boolean; view: MapView; onView: (v: MapView) => void }

/** The summary at the top of the Map tab: how all of campus feels. */
export function CampusCard({ counts, total, when, isSample, view, onView }: Props) {
  const has = shares(counts)[0]?.count > 0
  const today = useDayTotal()
  return (
    <section className="glass flex flex-col gap-3 rounded-xl p-4" aria-label="How campus feels">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-extrabold tracking-wider text-ink-soft uppercase">Campus · {when}</p>
          {isSample && <DemoSwitch />}
        </div>
        <ViewSwitch value={view} onChange={onView} />
      </div>
      <div className="flex items-center gap-3" aria-live="polite">
        {has && <MoodFace mood={shares(counts)[0].mood.id} className="size-14 shrink-0" />}
        <div className="min-w-0">
          <p className="text-xl leading-tight font-extrabold">{headline(counts)}</p>
          <p className="text-ink-soft">{sentence(counts, 'people on campus')}</p>
          <p className="text-sm font-bold text-ink-soft tabular-nums">
            {total.toLocaleString()} in the last 3 hours · {today.toLocaleString()} today
          </p>
        </div>
      </div>
    </section>
  )
}
