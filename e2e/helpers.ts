import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

// WCAG 2.2 A and AA, which is the level the app aims for.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// axe can't measure contrast against the gradient page background, so it
// marks every contrast check "incomplete" instead of failing it. For the scan
// we swap in a solid colour: the lightest part of the gradient (pine-700 under
// the 12% gold glow), the worst case for the light text that sits on it.
// Purely decorative layers that axe can't see past are hidden too: the snow,
// the confetti and the candy-cane stripe on the cards (which sits in the
// card's top padding and never overlaps text).
const SCAN_STYLES = `
  body { background: #2f5136 !important; }
  .snow, .confetti, .card::before { display: none !important; }
`

export async function expectNoA11yViolations(page: Page): Promise<void> {
  const style = await page.addStyleTag({ content: SCAN_STYLES })
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  await style.evaluate((el) => el.parentNode?.removeChild(el))

  // Treat a contrast check axe couldn't decide as a failure, so contrast can
  // never be skipped silently again.
  const undecidedContrast = results.incomplete.filter((r) => r.id === 'color-contrast')
  const summary = [...results.violations, ...undecidedContrast].map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.map((n) => n.target.join(' ')),
  }))
  expect(summary).toEqual([])
}

export async function addNames(page: Page, names: string[]): Promise<void> {
  await page.getByRole('textbox', { name: 'Name' }).fill(names.join(', '))
  await page.getByRole('button', { name: 'Add' }).click()
}

// Runs a draw through the UI and returns the first person's gift link.
export async function drawAndGetLink(page: Page, names: string[]): Promise<string> {
  await page.goto('/')
  await addNames(page, names)
  await page.getByRole('button', { name: /Draw names/ }).click()
  const url = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('nm-secret-santa') ?? '{}') as {
      links?: { url: string }[]
    }
    return saved.links?.[0]?.url
  })
  if (!url) throw new Error('Draw did not produce any links')
  return url
}
