import { useState } from 'react'
import { setLastNote } from '../lib/journal'
import type { Mood } from '../lib/moods'

/** A private note on today's check-in, with gentle questions to get started. */
export function NoteCard({ mood }: { mood: Mood }) {
  const prompts = ['What did you do today?', 'What happened?', 'What was one good thing?', `Why ${mood.label.toLowerCase()}?`]
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  const addPrompt = (p: string) => {
    setSaved(false)
    setText((t) => `${t}${t && !t.endsWith('\n') ? '\n' : ''}${p} `)
    document.getElementById('checkin-note')?.focus()
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-surface p-5 shadow-soft" aria-labelledby="note-title">
      <div>
        <h3 id="note-title" className="text-xl font-extrabold">Add a note</h3>
        <p className="text-ink-soft">Just for you. It stays in your journal on this phone.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <button key={p} type="button" onClick={() => addPrompt(p)} className="rounded-full bg-bg-soft px-3 py-1.5 text-sm font-bold">
            + {p}
          </button>
        ))}
      </div>
      <textarea
        id="checkin-note"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setSaved(false)
        }}
        rows={4}
        maxLength={2000}
        placeholder={`What did you do, what happened, what was good, and why did you feel ${mood.label.toLowerCase()}?`}
        className="w-full resize-y rounded-lg border-2 border-line bg-bg px-4 py-3 text-base leading-relaxed text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setLastNote(text)
            setSaved(true)
          }}
          disabled={!text.trim()}
          className="rounded-full bg-ink px-5 py-2.5 font-extrabold text-surface disabled:opacity-40"
        >
          Save note
        </button>
        {saved && (
          <span className="font-bold text-ink-soft" role="status">
            Saved to your journal
          </span>
        )}
      </div>
    </section>
  )
}
