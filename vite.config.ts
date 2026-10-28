import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative asset paths so the build works from any folder (e.g. GitHub Pages).
  base: './',
  test: {
    // Unit tests live next to the code; Playwright owns e2e/.
    include: ['src/**/*.test.ts'],
  },
})
