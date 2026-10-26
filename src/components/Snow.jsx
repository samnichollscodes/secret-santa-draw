import { useState } from 'react'

function makeFlakes(count) {
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
export default function Snow({ count = 60 }) {
  const [flakes] = useState(() => makeFlakes(count))

  return (
    <div className="snow" aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="flake"
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
