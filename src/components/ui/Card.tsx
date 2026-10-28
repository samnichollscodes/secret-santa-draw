import type { ReactNode } from 'react'
import { cn } from './cn'

type CardProps = {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <section
      // The page is dark, but cards are light: draw native controls to match.
      className={cn(
        'relative rounded-[18px] bg-cream px-6 py-7 text-ink scheme-light shadow-card max-[480px]:px-4.5 max-[480px]:py-6',
        className,
      )}
    >
      {/* Candy-cane stripe along the top edge. */}
      <span
        aria-hidden="true"
        data-decorative
        className="absolute inset-x-4.5 top-0 h-1.5 rounded-b-md bg-candy-stripe"
      />
      {children}
    </section>
  )
}
