import 'react'

// Allow CSS custom properties (e.g. `--drift`) in inline `style` objects.
declare module 'react' {
  // biome-ignore lint/style/useConsistentTypeDefinitions: module augmentation needs an interface to merge with React's.
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined
  }
}
