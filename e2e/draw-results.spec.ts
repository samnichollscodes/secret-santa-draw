import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { draw, expectNoA11yViolations, sentCheckbox, storedLinks } from './helpers'

const NAMES = ['Ann', 'Ben', 'Cat']

const row = (page: Page, name: string) =>
  page.locator('.links__row').filter({ has: page.getByText(name, { exact: true }) })

async function clipboardText(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText())
}

// Replaces the browser's share sheet with one that records what was shared
// and then behaves as given: shares, is closed by the person, or fails.
async function fakeShareSheet(page: Page, outcome: 'share' | 'cancel' | 'error'): Promise<void> {
  await page.addInitScript((result) => {
    const win = window as unknown as { shared: ShareData[] }
    win.shared = []
    Object.defineProperty(navigator, 'share', {
      value: (data: ShareData) => {
        win.shared.push(data)
        if (result === 'cancel') return Promise.reject(new DOMException('Closed', 'AbortError'))
        if (result === 'error') return Promise.reject(new DOMException('Nope', 'NotAllowedError'))
        return Promise.resolve()
      },
    })
  }, outcome)
}

async function sharedData(page: Page): Promise<ShareData[]> {
  return page.evaluate(() => (window as unknown as { shared: ShareData[] }).shared)
}

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
})

test.describe('copying', () => {
  test.beforeEach(async ({ page }) => {
    await draw(page, NAMES)
  })

  test("copies the right person's link and marks it sent", async ({ page }) => {
    const links = await storedLinks(page)
    await expect(page.getByText('0 of 3 links sent')).toBeVisible()

    await row(page, 'Ben').getByRole('button', { name: 'Copy link' }).click()
    await expect(row(page, 'Ben').getByRole('button', { name: 'Copied!' })).toBeVisible()
    expect(await clipboardText(page)).toBe(links[1]?.url)
    await expect(sentCheckbox(page, 'Ben')).toBeChecked()
    await expect(sentCheckbox(page, 'Ann')).not.toBeChecked()
    await expect(page.getByText('1 of 3 links sent')).toBeVisible()

    // "Copied!" goes back after a moment.
    await expect(row(page, 'Ben').getByRole('button', { name: 'Copy link' })).toBeVisible()
  })

  test('copies every link at once without marking any sent', async ({ page }) => {
    const links = await storedLinks(page)
    await page.getByRole('button', { name: 'Copy all links' }).click()
    await expect(page.getByRole('button', { name: 'Copied all!' })).toBeVisible()
    expect(await clipboardText(page)).toBe(links.map((l) => `${l.giver}: ${l.url}`).join('\n'))
    // Copying them all is for the organiser's records, not sending.
    await expect(page.getByText('0 of 3 links sent')).toBeVisible()
  })
})

test.describe('when copying is blocked', () => {
  test.beforeEach(async ({ page }) => {
    // Behave like a browser that refuses clipboard access.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.reject(new DOMException('Blocked', 'NotAllowedError')) },
      })
    })
    await draw(page, NAMES)
  })

  test('shows the link to copy by hand and leaves it unsent', async ({ page }) => {
    const links = await storedLinks(page)
    await row(page, 'Ben').getByRole('button', { name: 'Copy link' }).click()
    const box = page.getByRole('textbox', { name: /Ben's link to copy yourself/ })
    await expect(box).toBeFocused()
    await expect(box).toHaveValue(links[1]?.url ?? '')
    await expect(sentCheckbox(page, 'Ben')).not.toBeChecked()
    await expectNoA11yViolations(page)

    await page.getByRole('button', { name: 'Done' }).click()
    await expect(box).toBeHidden()
  })

  test('shows every link when copying them all', async ({ page }) => {
    await page.getByRole('button', { name: 'Copy all links' }).click()
    const box = page.getByRole('textbox', { name: /every link to copy yourself/ })
    await expect(box).toHaveValue(/^Ann: .*\nBen: .*\nCat: /)
  })
})

test.describe('sharing', () => {
  test('shares a ready-to-send message and marks it sent', async ({ page }) => {
    await fakeShareSheet(page, 'share')
    await draw(page, NAMES)
    const links = await storedLinks(page)

    await row(page, 'Cat').getByRole('button', { name: 'Share' }).click()
    await expect(sentCheckbox(page, 'Cat')).toBeChecked()
    const [shared] = await sharedData(page)
    expect(shared?.url).toBe(links[2]?.url)
    expect(shared?.text).toContain('Cat, your Secret Santa is ready!')
  })

  test('closing the share sheet leaves the link unsent', async ({ page }) => {
    await fakeShareSheet(page, 'cancel')
    await draw(page, NAMES)

    await row(page, 'Cat').getByRole('button', { name: 'Share' }).click()
    await expect.poll(async () => (await sharedData(page)).length).toBe(1)

    // Nothing visible happens after a cancel, so do something else that
    // finishes later and then check the count. If cancelling had wrongly
    // copied and marked Cat's link, it would say 2 of 3 by now.
    await row(page, 'Ann').getByRole('button', { name: 'Copy link' }).click()
    await expect(sentCheckbox(page, 'Ann')).toBeChecked()
    await expect(page.getByText('1 of 3 links sent')).toBeVisible()
    await expect(sentCheckbox(page, 'Cat')).not.toBeChecked()
    expect(await clipboardText(page)).not.toContain('your Secret Santa is ready')
  })

  test('copies the message instead when sharing fails', async ({ page }) => {
    await fakeShareSheet(page, 'error')
    await draw(page, NAMES)
    const links = await storedLinks(page)

    await row(page, 'Ann').getByRole('button', { name: 'Share' }).click()
    await expect(sentCheckbox(page, 'Ann')).toBeChecked()
    const copied = await clipboardText(page)
    expect(copied).toContain('Ann, your Secret Santa is ready!')
    expect(copied).toContain(links[0]?.url)
  })

  test('copies the message on browsers with no share sheet', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined })
    })
    await draw(page, NAMES)

    await row(page, 'Ben').getByRole('button', { name: 'Share' }).click()
    await expect(row(page, 'Ben').getByRole('button', { name: 'Copied!' })).toBeVisible()
    await expect(sentCheckbox(page, 'Ben')).toBeChecked()
    expect(await clipboardText(page)).toContain('Ben, your Secret Santa is ready!')
  })
})

test.describe('sent tracking', () => {
  test.beforeEach(async ({ page }) => {
    await draw(page, NAMES)
  })

  test('links can be ticked off by hand, and it survives a reload', async ({ page }) => {
    for (const name of NAMES) await sentCheckbox(page, name).check()
    await expect(page.getByText('All links sent! 🎉')).toBeVisible()
    await sentCheckbox(page, 'Ben').uncheck()
    await expect(page.getByText('2 of 3 links sent')).toBeVisible()

    await page.reload()
    await expect(sentCheckbox(page, 'Ann')).toBeChecked()
    await expect(sentCheckbox(page, 'Ben')).not.toBeChecked()
    await expect(page.getByText('2 of 3 links sent')).toBeVisible()
    await expectNoA11yViolations(page)
  })

  test('the links stay the same after a reload', async ({ page }) => {
    const before = await storedLinks(page)
    await page.reload()
    expect(await storedLinks(page)).toEqual(before)
    await expect(page.locator('.links__row')).toHaveCount(3)
  })
})

test.describe('starting over', () => {
  test.beforeEach(async ({ page }) => {
    await draw(page, NAMES, '£25 limit')
  })

  test('can be cancelled', async ({ page }) => {
    await page.getByRole('button', { name: 'Start over' }).click()
    const dialog = page.getByRole('dialog', { name: 'Start over?' })
    await expect(dialog).toContainText('thrown away')
    // Focus starts on the safe choice.
    await expect(dialog.getByRole('button', { name: 'Keep these links' })).toBeFocused()
    await expectNoA11yViolations(page)

    await dialog.getByRole('button', { name: 'Keep these links' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.locator('.links__row')).toHaveCount(3)
  })

  test('Escape closes the dialog and returns focus', async ({ page }) => {
    const startOver = page.getByRole('button', { name: 'Start over' })
    await startOver.click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(startOver).toBeFocused()
  })

  test('warns by name about links already sent', async ({ page }) => {
    await sentCheckbox(page, 'Ann').check()
    await sentCheckbox(page, 'Cat').check()
    await page.getByRole('button', { name: 'Start over' }).click()
    await expect(page.getByRole('dialog')).toContainText('already sent links to Ann and Cat')
  })

  test('keeps the names and message, and a new draw makes new links', async ({ page }) => {
    const before = await storedLinks(page)
    await page.getByRole('button', { name: 'Start over' }).click()
    await page.getByRole('button', { name: 'Yes, start over' }).click()

    await expect(page.getByRole('heading', { name: "Who's in the draw?" })).toBeVisible()
    for (const name of NAMES) {
      await expect(page.getByRole('button', { name: `Remove ${name}` })).toBeVisible()
    }
    await expect(page.getByRole('textbox', { name: /Message for everyone/ })).toHaveValue(
      '£25 limit',
    )

    await page.getByRole('button', { name: /Draw names/ }).click()
    const after = await storedLinks(page)
    expect(after.map((l) => l.url)).not.toEqual(before.map((l) => l.url))
    expect(after.every((l) => !l.sent)).toBe(true)
  })
})
