import { useMemo, useState } from 'react'
import { decodeAssignment } from '../lib/draw'

type Stage = 'idle' | 'shaking' | 'open'

const CONFETTI_COLOURS = ['#e8c15a', '#c8102e', '#f6efe1', '#1f7a4d', '#ffd98a']

function makeConfetti() {
  return Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 700,
    y: -150 - Math.random() * 400,
    rotate: Math.random() * 720 - 360,
    delay: Math.random() * 0.25,
    colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
    round: Math.random() > 0.6,
  }))
}

function Confetti() {
  const [pieces] = useState(makeConfetti)
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`confetti__piece ${p.round ? 'confetti__piece--round' : ''}`}
          style={{
            background: p.colour,
            animationDelay: `${p.delay}s`,
            '--x': `${p.x}px`,
            '--y': `${p.y}px`,
            '--r': `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  )
}

type RevealProps = {
  token: string
}

export default function Reveal({ token }: RevealProps) {
  const assignment = useMemo(() => decodeAssignment(token), [token])
  // idle → shaking → open
  const [stage, setStage] = useState<Stage>('idle')

  if (!assignment) {
    return (
      <section className="card center">
        <h2>Oh no, a broken bauble! 🎄</h2>
        <p className="muted">
          This link doesn't look quite right. Ask whoever sent it for a fresh copy.
        </p>
      </section>
    )
  }

  const { giver, recipient, note } = assignment

  function unwrap() {
    if (stage !== 'idle') return
    setStage('shaking')
    setTimeout(() => setStage('open'), 900)
  }

  return (
    <section className="reveal">
      <h2 className="reveal__hello">
        {stage === 'open' ? 'Ho ho ho!' : `Merry Christmas, ${giver}!`}
      </h2>
      <p className="reveal__hint">
        {stage === 'open'
          ? `${giver}, you're Secret Santa for…`
          : 'Santa left a little something for you. Tap the present to unwrap it.'}
      </p>

      <div className={`gift-stage gift-stage--${stage}`}>
        {stage === 'open' && <Confetti />}

        <div className="name-card" aria-live="polite">
          {stage === 'open' && (
            <>
              <span className="name-card__label">You're buying for</span>
              <span className="name-card__name">{recipient}</span>
            </>
          )}
        </div>

        <button
          type="button"
          className="gift"
          onClick={unwrap}
          disabled={stage !== 'idle'}
          aria-label="Unwrap your present"
        >
          <span className="gift__lid">
            <span className="gift__bow">
              <span className="bow bow--l" />
              <span className="bow bow--r" />
              <span className="bow__knot" />
            </span>
          </span>
          <span className="gift__box" />
        </button>
      </div>

      {stage === 'open' && (
        <div className="reveal__footer">
          {note && <p className="note">📜 {note}</p>}
          <p className="muted">Shh… keep it secret! 🤫</p>
        </div>
      )}
    </section>
  )
}
