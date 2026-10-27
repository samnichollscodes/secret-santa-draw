import 'react'

// Allow CSS custom properties (e.g. `--drift`) in inline `style` objects.
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined
  }
}
