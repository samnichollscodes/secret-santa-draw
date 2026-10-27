import { type FormEvent, useEffect, useState } from 'react'
import { drawNames, encodeAssignment, giftLink } from '../lib/draw'

const STORAGE_KEY = 'nm-secret-santa'
const MIN_PEOPLE = 3

type GiftLink = {
  giver: string
  url: string
}

type SavedDraw = {
  names: string[]
  note: string
  links: GiftLink[] | null
}

function loadSaved(): Partial<SavedDraw> {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<SavedDraw>) ?? {}
  } catch {
    return {}
  }
}

export default function Organiser() {
  const [saved] = useState(loadSaved)
  const [names, setNames] = useState<string[]>(saved.names ?? [])
  const [note, setNote] = useState(saved.note ?? '')
  // Only the giver and their opaque token are kept — never the recipient.
  const [links, setLinks] = useState<GiftLink[] | null>(saved.links ?? null)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    try {
      const draw: SavedDraw = { names, note, links }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draw))
    } catch {
      // Storage unavailable (private mode etc.) — the app still works.
    }
  }, [names, note, links])

  function addNames(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const incoming = input
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter(Boolean)
    if (!incoming.length) return
    const existing = new Set(names.map((n) => n.toLowerCase()))
    const dupe = incoming.find((n) => existing.has(n.toLowerCase()))
    if (dupe) {
      setError(`${dupe} is already on the list.`)
      return
    }
    setNames([...names, ...incoming])
    setInput('')
    setError('')
  }

  function removeName(name: string) {
    setNames(names.filter((n) => n !== name))
  }

  function runDraw() {
    if (names.length < MIN_PEOPLE) {
      setError(`You need at least ${MIN_PEOPLE} people for a proper draw.`)
      return
    }
    // Show links in the order names were entered — the draw order would give
    // the game away, since each person buys for the next one in it.
    const pairs = drawNames(names).sort((a, b) => names.indexOf(a.giver) - names.indexOf(b.giver))
    setLinks(
      pairs.map(({ giver, recipient }) => ({
        giver,
        url: giftLink(encodeAssignment({ giver, recipient, note: note.trim() })),
      })),
    )
    setError('')
  }

  function startOver() {
    const message =
      'Start over? The links you have already generated will still work, but this list will be cleared.'
    if (!window.confirm(message)) return
    setLinks(null)
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000)
    } catch {
      window.prompt('Copy this link:', text)
    }
  }

  async function share(link: GiftLink) {
    const text = `🎅 ${link.giver}, your Secret Santa is ready! Open this link (just you!) to unwrap who you've got:`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Secret Santa', text, url: link.url })
        return
      } catch {
        // Cancelled — fall through to copying instead.
      }
    }
    copy(`${text}\n${link.url}`, link.giver)
  }

  if (links) {
    const allText = links.map((l) => `${l.giver}: ${l.url}`).join('\n')
    return (
      <section className="card">
        <h2>The names are in the hat! 🎩</h2>
        <p className="muted">
          Send each person their own link. Don't open them yourself — the link reveals who that
          person drew, so it would spoil the surprise.
        </p>
        <ul className="links">
          {links.map((link) => (
            <li key={link.giver} className="links__row">
              <span className="links__name">
                <span className="tag" aria-hidden="true">
                  🎁
                </span>{' '}
                For <strong>{link.giver}</strong>
              </span>
              <span className="links__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => copy(link.url, link.giver)}
                >
                  {copied === link.giver ? 'Copied!' : 'Copy link'}
                </button>
                <button type="button" className="btn btn--small" onClick={() => share(link)}>
                  Share
                </button>
              </span>
            </li>
          ))}
        </ul>
        <div className="row row--end">
          <button type="button" className="btn btn--ghost" onClick={() => copy(allText, '__all')}>
            {copied === '__all' ? 'Copied all!' : 'Copy all links'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={startOver}>
            Start over
          </button>
        </div>
      </section>
    )
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
          placeholder="Add a name (or several, separated by commas)"
          aria-label="Name"
        />
        <button className="btn" type="submit">
          Add
        </button>
      </form>

      {names.length > 0 ? (
        <ul className="chips">
          {names.map((name) => (
            <li key={name} className="chip">
              {name}
              <button
                type="button"
                className="chip__x"
                onClick={() => removeName(name)}
                aria-label={`Remove ${name}`}
              >
                ×
              </button>
            </li>
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
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. £25 limit — presents on Christmas Eve!"
          maxLength={140}
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button
        type="button"
        className="btn btn--big"
        onClick={runDraw}
        disabled={names.length < MIN_PEOPLE}
      >
        Draw names ✨
      </button>
      {names.length > 0 && names.length < MIN_PEOPLE && (
        <p className="muted center">Add {MIN_PEOPLE - names.length} more to draw.</p>
      )}
    </section>
  )
}
