import { useState } from 'react'

function makeFlakes(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 3 + Math.random() * 6,
    duration: 8 + Math.random() * 12,
    delay: -Math.random() * 20,
    drift: (Math.random() - 0.5) * 80,
    opacity: 0.4 + Math.random() * 0.6,
  }))
}

// Gently falling snowflakes, purely decorative.
type SnowProps = {
  count?: number
}

export default function Snow({ count = 60 }: SnowProps) {
  const [flakes] = useState(() => makeFlakes(count))

  return (
    <div
      aria-hidden="true"
      data-decorative
      data-testid="snow"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden motion-reduce:hidden"
    >
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute -top-2.5 animate-snowfall rounded-full bg-white blur-[0.5px]"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            '--drift': `${f.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
