// Class lists shared by elements that aren't worth their own component.
// Each is wrapped in cn() only so Biome's Tailwind rules check it.

import { cn } from './cn'

export const cardTitle = cn('mt-1 mb-2 font-display text-[1.6rem] font-bold text-berry-dark')

export const muted = cn('mb-4.5 leading-normal text-ink-soft')

export const hint = cn('mt-2 text-[0.85rem] leading-[1.45] text-ink-soft')

export const fieldLabel = cn('mb-1.5 block text-[0.9rem] font-bold text-ink-soft')

export const input = cn(
  'w-full min-w-0 flex-1 rounded-[10px] border-2 border-parchment bg-white px-3.5 py-3 text-ink transition-[border-color] duration-150 outline-none placeholder:text-placeholder focus:border-gold',
)

export const buttonRow = cn('flex flex-wrap justify-end gap-2.5')
