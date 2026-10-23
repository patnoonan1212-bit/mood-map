import { useId, useState } from 'react'
import type { Mood } from '../lib/moods'

/** Questions that help get a note started. Tapping one adds it to the note. */
export const notePrompts = (mood: Mood) => ['What did you do today?', 'What happened?', 'What was one good thing?', `Why ${mood.label.toLowerCase()}?`]

type Props = { mood: Mood; initial?: string; onSave: (text: string) => void; onCancel?: () => void; autoFocus?: boolean }

export function NoteEditor({ mood, initial = '', onSave, onCancel, autoFocus }: Props) {
  const id = useId()
  const [text, setText] = useState(initial)
  const [saved, setSaved] = useState(false)

  const addPrompt = (p: string) => {
    setSaved(false)
    setText((t) => `${t}${t && !t.endsWith('\n') ? '\n' : ''}${p} `)
    document.getElementById(id)?.focus()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {notePrompts(mood).map((p) => (
          <button key={p} type="button" onClick={() => addPrompt(p)} className="rounded-full bg-bg-soft px-3 py-1.5 text-sm font-bold">
            + {p}
          </button>
        ))}
      </div>
      <textarea
        id={id}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => {
          setText(e.target.value)
          setSaved(false)
        }}
        rows={4}
        maxLength={2000}
        aria-label="Note"
        placeholder={`What did you do, what happened, what was good, and why did you feel ${mood.label.toLowerCase()}?`}
        className="w-full resize-y rounded-lg border-2 border-line bg-bg px-4 py-3 text-base leading-relaxed text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            onSave(text)
            setSaved(true)
          }}
          disabled={text.trim() === initial.trim()}
          className="rounded-full bg-ink px-5 py-2.5 font-extrabold text-surface disabled:opacity-40"
        >
          Save note
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-2 py-2 font-bold text-ink-soft">
            Cancel
          </button>
        )}
        {saved && (
          <span className="font-bold text-ink-soft" role="status">
            Saved to your journal
          </span>
        )}
      </div>
    </div>
  )
}
