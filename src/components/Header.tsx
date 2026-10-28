import { cn } from './ui/cn'

type HeaderProps = {
  small?: boolean
}

const leaf = cn('inline-block h-4 w-8.5 rounded-[100%_0] bg-pine-500')
const berry = cn('relative z-1 -mx-px inline-block size-2.75 rounded-full bg-berry-gloss')

export default function Header({ small = false }: HeaderProps) {
  return (
    <header className="mb-7 text-center" data-size={small ? 'small' : 'large'}>
      <div className="relative inline-flex h-7 items-center" aria-hidden="true">
        <span className={cn(leaf, '-mr-1 transform-[rotate(-20deg)]')} />
        <span className={berry} />
        <span className={cn(berry, '-translate-y-1.5')} />
        <span className={berry} />
        <span className={cn(leaf, '-ml-1 transform-[scaleX(-1)_rotate(-20deg)]')} />
      </div>
      <p className="mt-2.5 mb-3 font-display text-[clamp(0.8rem,3vw,0.95rem)] font-semibold tracking-[0.3em] text-cream uppercase opacity-85">
        The Christmas Draw
      </p>
      <h1
        className={cn(
          'font-script leading-[1.2] font-normal text-gold text-shadow-glow',
          small ? 'text-[clamp(2.4rem,11vw,3.4rem)]' : 'text-[clamp(3.4rem,15vw,5.2rem)]',
        )}
      >
        Secret Santa
      </h1>
    </header>
  )
}
