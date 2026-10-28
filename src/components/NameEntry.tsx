import { type SubmitEvent, useId, useState } from 'react'
import { findDrawProblem, type Household } from '../lib/draw'
import { findDuplicate, parseHouseholds, removePerson } from '../lib/households'
import Button from './ui/Button'
import Card from './ui/Card'
import { cardTitle, fieldLabel, hint, input as inputClasses, muted } from './ui/classes'

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
    <Card>
      <h2 className={cardTitle}>Who's in the draw?</h2>
      <p className={muted}>
        Add everyone taking part. You'll get a private link for each person — and even you won't
        know who's got who.
      </p>

      <form className="flex gap-2.5 max-[480px]:flex-col" onSubmit={addNames}>
        <input
          className={inputClasses}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Sam + Alex, Jo"
          aria-label="Name"
          aria-describedby={hintId}
        />
        <Button type="submit">Add</Button>
      </form>
      <p id={hintId} className={hint}>
        Separate people with commas. Join people with <strong>+</strong> if they shouldn't draw each
        other, like couples or housemates.
      </p>

      {total > 0 ? (
        <ul className="mt-4.5 flex flex-wrap gap-2">
          {households.map((household) => (
            <HouseholdChips
              key={household.join('+')}
              household={household}
              onRemove={(name) => onHouseholdsChange(removePerson(households, name))}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4.5 text-ink-soft italic">No elves on the list yet…</p>
      )}

      <label className="mt-5.5 mb-4.5 block">
        <span className={fieldLabel}>Message for everyone (optional)</span>
        <input
          className={inputClasses}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="e.g. £25 limit — presents on Christmas Eve!"
          maxLength={140}
        />
      </label>

      {error && <p className="mb-3.5 font-bold text-berry">{error}</p>}

      <Button size="large" onClick={onDraw} disabled={problem !== null}>
        Draw names ✨
      </Button>
      {total > 0 && problem && (
        <p className="mt-3.5 text-center leading-normal text-ink-soft" aria-live="polite">
          {problem}
        </p>
      )}
    </Card>
  )
}

type HouseholdChipsProps = {
  household: Household
  onRemove: (name: string) => void
}

function HouseholdChips({ household, onRemove }: HouseholdChipsProps) {
  const chips = household.map((name) => (
    <span
      key={name}
      className="inline-flex animate-pop items-center gap-1.5 rounded-full bg-pine-700 py-1.75 pr-2 pl-3.5 font-bold text-cream"
    >
      {name}
      <button
        type="button"
        className="size-[22px] cursor-pointer rounded-full bg-white/15 p-0 leading-none text-inherit hover:bg-berry"
        onClick={() => onRemove(name)}
        aria-label={`Remove ${name}`}
      >
        ×
      </button>
    </span>
  ))

  if (household.length === 1) return <li className="flex">{chips}</li>

  return (
    // People who won't draw each other, wrapped together in one dashed pill.
    <li
      data-testid="household"
      className="flex gap-1 rounded-full border-2 border-dashed border-pine-500 p-0.75"
    >
      <span className="sr-only">Household, won't draw each other: </span>
      {chips}
    </li>
  )
}
