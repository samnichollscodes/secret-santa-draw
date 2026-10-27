import { useEffect, useRef, useState } from 'react'
import { formatNames } from '../lib/draw'
import type { GiftLink } from '../lib/storage'
import ConfirmDialog from './ConfirmDialog'

type DrawResultsProps = {
  links: GiftLink[]
  onLinksChange: (links: GiftLink[]) => void
  onStartOver: () => void
}

// Text the browser wouldn't let us copy, shown so it can be copied by hand.
type ManualCopy = {
  label: string
  text: string
}

const ALL = '__all'

function shareMessage(giver: string): string {
  return `🎅 ${giver}, your Secret Santa is ready! Open this link (just you!) to unwrap who you've got:`
}

export default function DrawResults({ links, onLinksChange, onStartOver }: DrawResultsProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [manualCopy, setManualCopy] = useState<ManualCopy | null>(null)
  const [confirming, setConfirming] = useState(false)
  const manualCopyRef = useRef<HTMLTextAreaElement>(null)
  const sentCount = links.filter((l) => l.sent).length
  const sentNames = links.filter((l) => l.sent).map((l) => l.giver)

  // Each time there's something new to copy by hand, select it ready to copy.
  useEffect(() => {
    if (!manualCopy) return
    manualCopyRef.current?.focus()
    manualCopyRef.current?.select()
  }, [manualCopy])

  function setSent(giver: string, sent: boolean) {
    onLinksChange(links.map((l) => (l.giver === giver ? { ...l, sent } : l)))
  }

  async function copy(text: string, id: string, label: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      setManualCopy(null)
      setCopied(id)
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000)
      return true
    } catch {
      // Copying is blocked here (some in-app browsers do this), so show the
      // text instead. We don't use window.prompt: those browsers block it too.
      setManualCopy({ label, text })
      return false
    }
  }

  async function copyLink(link: GiftLink) {
    if (await copy(link.url, link.giver, `${link.giver}'s link`)) setSent(link.giver, true)
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
    const message = `${text}\n${link.url}`
    if (await copy(message, link.giver, `${link.giver}'s message`)) setSent(link.giver, true)
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

      {manualCopy && (
        <div className="manual-copy">
          <label className="field">
            <span>This browser blocked copying. Here's {manualCopy.label} to copy yourself:</span>
            <textarea
              ref={manualCopyRef}
              className="input manual-copy__text"
              value={manualCopy.text}
              readOnly
              rows={3}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <p className="hint">Tick "Sent" once you've sent it.</p>
          <div className="row row--end">
            <button type="button" className="btn btn--ghost" onClick={() => setManualCopy(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      <div className="row row--end">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => copy(allText, ALL, 'every link')}
        >
          {copied === ALL ? 'Copied all!' : 'Copy all links'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setConfirming(true)}>
          Start over
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Start over?"
        confirmLabel="Yes, start over"
        cancelLabel="Keep these links"
        onConfirm={() => {
          setConfirming(false)
          onStartOver()
        }}
        onCancel={() => setConfirming(false)}
      >
        {sentNames.length === 0 ? (
          <p>These links will be thrown away and you'll draw again with the same names.</p>
        ) : (
          <>
            <p>
              You've already sent links to <strong>{formatNames(sentNames)}</strong>.
            </p>
            <p>
              Their old links will still open, but they'll show this draw, not the new one. Everyone
              would need a new link.
            </p>
          </>
        )}
      </ConfirmDialog>
    </section>
  )
}
