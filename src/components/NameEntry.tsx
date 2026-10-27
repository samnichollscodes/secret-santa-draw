import { type SubmitEvent, useId, useState } from 'react'
import { findDrawProblem, type Household } from '../lib/draw'
import { findDuplicate, parseHouseholds, removePerson } from '../lib/households'

type NameEntryProps = {
  households: Household[]
  onHouseholdsChange: (households: Household[]) => void
  note: string
  onNoteChange: (note: string) => void
  onDraw: () => void
}

export default function NameEntry({
  households,
  onHouseholdsChange,
  note,
  onNoteChange,
  onDraw,
}: NameEntryProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const hintId = useId()
  const total = households.flat().length
  const problem = findDrawProblem(households)

  function addNames(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const incoming = parseHouseholds(input)
    if (!incoming.length) return
    const dupe = findDuplicate(households, incoming)
    if (dupe) {
      setError(`${dupe} is already on the list.`)
      return
    }
    onHouseholdsChange([...households, ...incoming])
    setInput('')
    setError('')
  }

  return (
    <section className="card">
      <h2>Who's in the draw?</h2>
      <p className="muted">
        Add everyone taking part. You'll get a private link for each person — and even you won't
        know who's got who.
      </p>

      <form className="row" onSubmit={addNames}>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Sam + Alex, Jo"
          aria-label="Name"
          aria-describedby={hintId}
        />
        <button className="btn" type="submit">
          Add
        </button>
      </form>
      <p id={hintId} className="hint">
        Separate people with commas. Join people with <strong>+</strong> if they shouldn't draw each
        other, like couples or housemates.
      </p>

      {total > 0 ? (
        <ul className="chips">
          {households.map((household) => (
            <HouseholdChips
              key={household.join('+')}
              household={household}
              onRemove={(name) => onHouseholdsChange(removePerson(households, name))}
            />
          ))}
        </ul>
      ) : (
        <p className="empty">No elves on the list yet…</p>
      )}

      <label className="field">
        <span>Message for everyone (optional)</span>
        <input
          className="input"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="e.g. £25 limit — presents on Christmas Eve!"
          maxLength={140}
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button type="button" className="btn btn--big" onClick={onDraw} disabled={problem !== null}>
        Draw names ✨
      </button>
      {total > 0 && problem && (
        <p className="muted center draw-hint" aria-live="polite">
          {problem}
        </p>
      )}
    </section>
  )
}

type HouseholdChipsProps = {
  household: Household
  onRemove: (name: string) => void
}

function HouseholdChips({ household, onRemove }: HouseholdChipsProps) {
  const chips = household.map((name) => (
    <span key={name} className="chip">
      {name}
      <button
        type="button"
        className="chip__x"
        onClick={() => onRemove(name)}
        aria-label={`Remove ${name}`}
      >
        ×
      </button>
    </span>
  ))

  if (household.length === 1) return <li className="chips__item">{chips}</li>

  return (
    <li className="chips__item household">
      <span className="sr-only">Household, won't draw each other: </span>
      {chips}
    </li>
  )
}
