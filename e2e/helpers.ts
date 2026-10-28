import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { type Assignment, decodeAssignment, encodeAssignment } from '../src/lib/draw'
import { expect } from './fixtures'

// WCAG 2.2 A and AA, which is the level the app aims for.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// axe can't measure contrast against the gradient page background, so it
// marks every contrast check "incomplete" instead of failing it. For the scan
// we swap in a solid colour: the lightest part of the gradient (pine-700 under
// the 12% gold glow), the worst case for the light text that sits on it.
// Purely decorative layers that axe can't see past are hidden too: the snow,
// the confetti and the candy-cane stripe on the cards (which sits in the
// card's top padding and never overlaps text).
// While a modal dialog is open, the page behind it can't be reached, but axe
// doesn't understand the top layer dialogs sit in and gives up on the dialog's
// contrast because it "overlaps" that page. So only the dialog is left showing.
const SCAN_STYLES = `
  body { background: #2f5136 !important; }
  .snow, .confetti, .card::before { display: none !important; }
  body:has(dialog[open]) * { visibility: hidden !important; }
  dialog[open], dialog[open] * { visibility: visible !important; }
`

// Waits for one-off animations (chips popping in, the present opening) so axe
// doesn't measure text while it's still fading in. The snow loops forever, so
// it's skipped.
async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  )
}

export async function expectNoA11yViolations(page: Page): Promise<void> {
  await waitForAnimations(page)
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

// Types into the name box and presses Add. Each entry is one household, so
// `['Sam + Alex', 'Jo']` adds a couple and a single.
export async function addNames(page: Page, entries: string[]): Promise<void> {
  await page.getByRole('textbox', { name: 'Name' }).fill(entries.join(', '))
  await page.getByRole('button', { name: 'Add' }).click()
}

// Starts from an empty organiser page, adds the names and runs the draw.
export async function draw(page: Page, entries: string[], note = ''): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await addNames(page, entries)
  if (note) await page.getByRole('textbox', { name: /Message for everyone/ }).fill(note)
  await page.getByRole('button', { name: /Draw names/ }).click()
  await expect(page.getByRole('heading', { name: /names are in the hat/ })).toBeVisible()
}

export type StoredLink = { giver: string; url: string; sent: boolean }

// The links exactly as the organiser page saved them in the browser.
export async function storedLinks(page: Page): Promise<StoredLink[]> {
  return page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('nm-secret-santa') ?? '{}') as {
      links?: StoredLink[]
    }
    return saved.links ?? []
  })
}

export function decodeLink(url: string): Assignment {
  const assignment = decodeAssignment(url.split('#/gift/')[1] ?? '')
  if (!assignment) throw new Error(`Undecodable link: ${url}`)
  return assignment
}

// Runs a draw through the UI and returns the first person's gift link.
export async function drawAndGetLink(page: Page, entries: string[]): Promise<string> {
  await draw(page, entries)
  const [first] = await storedLinks(page)
  if (!first) throw new Error('Draw did not produce any links')
  return first.url
}

// A gift link made directly, for testing the reveal with a known recipient.
export function giftPath(assignment: Assignment): string {
  return `/#/gift/${encodeAssignment(assignment)}`
}

export const sentCheckbox = (page: Page, name: string) =>
  page.getByRole('checkbox', { name: `Sent to ${name}` })
