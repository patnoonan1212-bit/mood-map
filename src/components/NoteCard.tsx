import { setLastNote } from '../lib/journal'
import type { Mood } from '../lib/moods'
import { NoteEditor } from './NoteEditor'

/** A private note on today's check-in, with gentle questions to get started. */
export function NoteCard({ mood }: { mood: Mood }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-surface p-5 shadow-soft" aria-labelledby="note-title">
      <div>
        <h3 id="note-title" className="text-xl font-extrabold">Add a note</h3>
        <p className="text-ink-soft">Just for you. It stays in your journal on this phone.</p>
      </div>
      <NoteEditor mood={mood} onSave={setLastNote} />
    </section>
  )
}
