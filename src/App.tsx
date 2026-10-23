import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useState } from 'react'
import { TabBar, type Tab } from './components/TabBar'
import CheckInScreen from './screens/CheckInScreen'
import JournalScreen from './screens/JournalScreen'
import MapLocked from './screens/MapLocked'
import { checkedInToday, useJournal } from './lib/journal'

// The map library is large, so it only loads when someone opens the Map tab.
const MapScreen = lazy(() => import('./screens/MapScreen'))

export default function App() {
  const [tab, setTab] = useState<Tab>('checkin')
  const unlocked = checkedInToday(useJournal().entries)

  return (
    <div className="relative h-full overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`h-full ${tab === 'map' ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          {tab === 'checkin' && <CheckInScreen onSeeMap={() => setTab('map')} />}
          {tab === 'map' && !unlocked && <MapLocked onCheckIn={() => setTab('checkin')} />}
          {tab === 'map' && unlocked && (
            <Suspense fallback={<div className="grid h-full place-items-center text-ink-soft">Loading the map…</div>}>
              <MapScreen />
            </Suspense>
          )}
          {tab === 'journal' && <JournalScreen />}
        </motion.main>
      </AnimatePresence>
      <TabBar active={tab} onChange={setTab} mapLocked={!unlocked} />
    </div>
  )
}
