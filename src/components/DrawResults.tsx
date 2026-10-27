import { useState } from 'react'
import { formatNames } from '../lib/draw'
import type { GiftLink } from '../lib/storage'

type DrawResultsProps = {
  links: GiftLink[]
  onLinksChange: (links: GiftLink[]) => void
  onStartOver: () => void
}

const ALL = '__all'

function shareMessage(giver: string): string {
  return `🎅 ${giver}, your Secret Santa is ready! Open this link (just you!) to unwrap who you've got:`
}

function confirmStartOver(links: GiftLink[]): boolean {
  const sent = links.filter((l) => l.sent).map((l) => l.giver)
  if (sent.length === 0) {
    return window.confirm("Start over? These links will be thrown away and you'll draw again.")
  }
  return window.confirm(
    `You've already sent links to ${formatNames(sent)}. ` +
      "Their old links will still open, but they'll show this draw, not the new one, so everyone would need a new link.\n\n" +
      'Start over anyway?',
  )
}

export default function DrawResults({ links, onLinksChange, onStartOver }: DrawResultsProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const sentCount = links.filter((l) => l.sent).length

  function setSent(giver: string, sent: boolean) {
    onLinksChange(links.map((l) => (l.giver === giver ? { ...l, sent } : l)))
  }

  async function copy(text: string, id: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000)
      return true
    } catch {
      window.prompt('Copy this link:', text)
      return false
    }
  }

  async function copyLink(link: GiftLink) {
    if (await copy(link.url, link.giver)) setSent(link.giver, true)
  }

  async function share(link: GiftLink) {
    const text = shareMessage(link.giver)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Secret Santa', text, url: link.url })
        setSent(link.giver, true)
        return
      } catch (err) {
        // They closed the share sheet, so nothing was sent.
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Sharing isn't working here — fall back to copying instead.
      }
    }
    if (await copy(`${text}\n${link.url}`, link.giver)) setSent(link.giver, true)
  }

  function startOver() {
    if (confirmStartOver(links)) onStartOver()
  }

  const allText = links.map((l) => `${l.giver}: ${l.url}`).join('\n')

  return (
    <section className="card">
      <h2>The names are in the hat! 🎩</h2>
      <p className="muted">
        Send each person their own link. Don't open them yourself — the link reveals who that person
        drew, so it would spoil the surprise.
      </p>
      <p className="sent-progress" aria-live="polite">
        {sentCount === links.length
          ? 'All links sent! 🎉'
          : `${sentCount} of ${links.length} links sent`}
      </p>
      <ul className="links">
        {links.map((link) => (
          <li key={link.giver} className={`links__row ${link.sent ? 'links__row--sent' : ''}`}>
            <span className="links__name">
              <span className="tag" aria-hidden="true">
                🎁
              </span>{' '}
              For <strong>{link.giver}</strong>
            </span>
            <span className="links__actions">
              <button type="button" className="btn btn--ghost" onClick={() => copyLink(link)}>
                {copied === link.giver ? 'Copied!' : 'Copy link'}
              </button>
              <button type="button" className="btn btn--small" onClick={() => share(link)}>
                Share
              </button>
              <label className="sent">
                <input
                  type="checkbox"
                  checked={link.sent}
                  onChange={(e) => setSent(link.giver, e.target.checked)}
                />
                Sent<span className="sr-only"> to {link.giver}</span>
              </label>
            </span>
          </li>
        ))}
      </ul>
      <div className="row row--end">
        <button type="button" className="btn btn--ghost" onClick={() => copy(allText, ALL)}>
          {copied === ALL ? 'Copied all!' : 'Copy all links'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={startOver}>
          Start over
        </button>
      </div>
    </section>
  )
}
