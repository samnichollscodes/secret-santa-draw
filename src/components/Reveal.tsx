import { useMemo, useState } from 'react'
import { decodeAssignment } from '../lib/draw'
import Card from './ui/Card'
import { cardTitle, muted } from './ui/classes'
import { cn } from './ui/cn'

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

// Confetti bursting from the box.
function Confetti() {
  const [pieces] = useState(makeConfetti)
  return (
    <div
      aria-hidden="true"
      data-decorative
      className="pointer-events-none absolute bottom-37.5 left-1/2 z-4 size-0 motion-reduce:hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className={cn(
            'absolute animate-burst opacity-0',
            p.round ? 'size-2.25 rounded-full' : 'h-3.5 w-2 rounded-xs',
          )}
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

const bow = cn(
  'absolute -bottom-1.5 h-9 w-13 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] border-[9px] border-gold',
)

// The present. Its look in each stage comes from the `data-stage` on the
// surrounding `group`, via Tailwind's group-data-[stage=…] variants.
function Present({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Unwrap your present"
      className="relative z-2 size-47.5 cursor-pointer [-webkit-tap-highlight-color:transparent] group-data-[stage=idle]:animate-wiggle group-data-[stage=shaking]:animate-shake group-data-[stage=idle]:hover:[animation-duration:1s] focus-visible:rounded-lg focus-visible:outline-3 focus-visible:outline-offset-8 focus-visible:outline-gold disabled:cursor-default motion-reduce:animate-none"
    >
      <span className="absolute inset-x-0 bottom-34 z-3 h-10.5 origin-[20%_100%] rounded-md shadow-gift-lid bg-gift-lid group-data-[stage=open]:animate-lid-off">
        <span className="absolute bottom-full left-1/2 size-0">
          <span className={cn(bow, 'right-0.5 -rotate-18')} />
          <span className={cn(bow, 'left-0.5 rotate-18')} />
          <span className="absolute -bottom-2 -left-2.75 h-5 w-5.5 rounded-md bg-bow-knot" />
        </span>
      </span>
      <span className="absolute inset-x-2.5 bottom-0 h-35 rounded-[4px_4px_8px_8px] shadow-gift-box bg-gift-box group-data-[stage=open]:animate-glow after:absolute after:inset-0 after:rounded-[inherit] after:bg-gift-dots after:content-['']" />
    </button>
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
      <Card className="text-center">
        <h2 className={cardTitle}>Oh no, a broken bauble! 🎄</h2>
        <p className={muted}>
          This link doesn't look quite right. Ask whoever sent it for a fresh copy.
        </p>
      </Card>
    )
  }

  const { giver, recipient, note } = assignment

  function unwrap() {
    if (stage !== 'idle') return
    setStage('shaking')
    setTimeout(() => setStage('open'), 900)
  }

  return (
    <section className="text-center">
      <h2 className="mb-1.5 font-display text-[clamp(1.7rem,7vw,2.4rem)] font-bold">
        {stage === 'open' ? 'Ho ho ho!' : `Merry Christmas, ${giver}!`}
      </h2>
      <p className="mx-auto min-h-[3em] max-w-[26em] leading-normal text-cream/80">
        {stage === 'open'
          ? `${giver}, you're Secret Santa for…`
          : 'Santa left a little something for you. Tap the present to unwrap it.'}
      </p>

      <div data-stage={stage} className="group relative flex h-100 items-end justify-center pb-5">
        {stage === 'open' && <Confetti />}

        <div
          aria-live="polite"
          // Starts small and hidden inside the box, then rises out of it.
          className="absolute bottom-10 left-1/2 z-1 w-[min(300px,calc(100%-20px))] transform-[translate(-50%,40px)_scale(0.5)] rounded-[14px] bg-cream px-5 pt-4.5 pb-5 text-ink opacity-0 shadow-name-card group-data-[stage=open]:animate-rise"
        >
          {stage === 'open' && (
            <>
              <span className="block text-[0.8rem] font-bold tracking-[0.18em] text-ink-soft uppercase">
                You're buying for
              </span>
              <span
                data-testid="recipient"
                className="mt-1 block font-display text-[clamp(2rem,9vw,2.8rem)] leading-[1.15] font-extrabold wrap-anywhere text-berry-dark"
              >
                {recipient}
              </span>
            </>
          )}
        </div>

        <Present disabled={stage !== 'idle'} onClick={unwrap} />
      </div>

      {stage === 'open' && (
        <div className="animate-fade-up">
          {note && (
            <p
              data-testid="note"
              className="mb-3 inline-block rounded-xl border border-gold/40 bg-cream/8 px-4 py-2.5 text-gold-light"
            >
              📜 {note}
            </p>
          )}
          <p className="mb-4.5 leading-normal text-cream/70">Shh… keep it secret! 🤫</p>
        </div>
      )}
    </section>
  )
}
