import type { ComponentProps } from 'react'
import { cn } from './cn'

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
}

const BASE = cn(
  'cursor-pointer rounded-[10px] font-bold whitespace-nowrap transition-[transform,box-shadow,opacity] duration-100 hover:enabled:-translate-y-px active:enabled:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45',
)

const VARIANTS = {
  primary: cn('bg-berry text-white shadow-button active:enabled:shadow-button-pressed'),
  ghost: cn('bg-transparent text-pine-500 shadow-ghost'),
}

const SIZES = {
  small: cn('px-3.5 py-2'),
  medium: cn('px-4.5 py-3'),
  large: cn('block w-full p-4 font-display text-[1.25rem]'),
}

export default function Button({
  variant = 'primary',
  size = 'medium',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  // Ghost buttons are always compact.
  const sizeClasses = SIZES[variant === 'ghost' ? 'small' : size]
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], sizeClasses, className)}
      {...props}
    />
  )
}
