import { expect, type Page, test } from '@playwright/test'
import { decodeAssignment } from '../src/lib/draw'
import { addNames, expectNoA11yViolations } from './helpers'

type StoredLink = { giver: string; url: string; sent: boolean }

async function storedLinks(page: Page): Promise<StoredLink[]> {
  return page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('nm-secret-santa') ?? '{}') as {
      links?: StoredLink[]
    }
    return saved.links ?? []
  })
}

const sentCheckbox = (page: Page, name: string) =>
  page.getByRole('checkbox', { name: `Sent to ${name}` })

test.describe('households', () => {
  test('explains when a household is too big and enables the draw once it fits', async ({
    page,
  }) => {
    await page.goto('/')
    await addNames(page, ['Sam + Alex + Jo', 'Pat'])
    const draw = page.getByRole('button', { name: /Draw names/ })
    await expect(draw).toBeDisabled()
    await expect(page.getByText(/Sam, Alex and Jo can't draw each other/)).toBeVisible()
    await expectNoA11yViolations(page)

    await addNames(page, ['Lee', 'Kim'])
    await expect(draw).toBeEnabled()
  })

  test('nobody draws someone from their own household', async ({ page }) => {
    const households = [
      ['Sam', 'Alex'],
      ['Jo', 'Chris'],
      ['Pat', 'Lee'],
    ]
    for (let run = 0; run < 10; run++) {
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await addNames(
        page,
        households.map((h) => h.join(' + ')),
      )
      await page.getByRole('button', { name: /Draw names/ }).click()

      for (const { url } of await storedLinks(page)) {
        const assignment = decodeAssignment(url.split('#/gift/')[1] ?? '')
        if (!assignment) throw new Error(`Undecodable link: ${url}`)
        const home = households.find((h) => h.includes(assignment.giver))
        expect(home).not.toContain(assignment.recipient)
      }
    }
  })

  test('removing someone from a household keeps the rest', async ({ page }) => {
    await page.goto('/')
    await addNames(page, ['Sam + Alex', 'Jo'])
    await page.getByRole('button', { name: 'Remove Alex' }).click()
    await expect(page.getByRole('button', { name: 'Remove Sam' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove Alex' })).toHaveCount(0)
  })

  test('loads a list saved before households existed', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() =>
      localStorage.setItem(
        'nm-secret-santa',
        JSON.stringify({ names: ['Ann', 'Ben', 'Cat'], note: '', links: null }),
      ),
    )
    await page.reload()
    await expect(page.getByRole('button', { name: 'Remove Cat' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Draw names/ })).toBeEnabled()
  })
})

test.describe('sent tracking', () => {
  // Native pop-ups (confirm, prompt, alert) are silently answered "Cancel" by
  // some embedded and in-app browsers, so the app must never rely on them.
  // Dismiss any that appear, like those browsers do, and fail the test.
  let nativeDialogs: string[] = []

  test.beforeEach(async ({ page, context }) => {
    nativeDialogs = []
    page.on('dialog', (dialog) => {
      nativeDialogs.push(dialog.message())
      void dialog.dismiss()
    })
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
    await addNames(page, ['Ann', 'Ben', 'Cat'])
    await page.getByRole('button', { name: /Draw names/ }).click()
  })

  test.afterEach(() => {
    expect(nativeDialogs).toEqual([])
  })

  test('copying a link marks it sent, and it survives a reload', async ({ page }) => {
    await expect(page.getByText('0 of 3 links sent')).toBeVisible()
    await page.getByRole('button', { name: 'Copy link' }).first().click()
    await expect(sentCheckbox(page, 'Ann')).toBeChecked()
    await expect(page.getByText('1 of 3 links sent')).toBeVisible()

    await page.reload()
    await expect(sentCheckbox(page, 'Ann')).toBeChecked()
    await expect(sentCheckbox(page, 'Ben')).not.toBeChecked()
    await expectNoA11yViolations(page)
  })

  test('links can be ticked off by hand', async ({ page }) => {
    for (const name of ['Ann', 'Ben', 'Cat']) await sentCheckbox(page, name).check()
    await expect(page.getByText('All links sent! 🎉')).toBeVisible()
    await sentCheckbox(page, 'Ben').uncheck()
    await expect(page.getByText('2 of 3 links sent')).toBeVisible()
  })

  test('start over can be cancelled', async ({ page }) => {
    const startOver = page.getByRole('button', { name: 'Start over' })
    await startOver.click()
    const dialog = page.getByRole('dialog', { name: 'Start over?' })
    await expect(dialog).toContainText('thrown away')
    // Focus starts on the safe choice.
    await expect(dialog.getByRole('button', { name: 'Keep these links' })).toBeFocused()
    await expectNoA11yViolations(page)

    await dialog.getByRole('button', { name: 'Keep these links' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText('0 of 3 links sent')).toBeVisible()
  })

  test('escape closes the start over dialog', async ({ page }) => {
    const startOver = page.getByRole('button', { name: 'Start over' })
    await startOver.click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(startOver).toBeFocused()
  })

  test('start over warns by name about links already sent', async ({ page }) => {
    await sentCheckbox(page, 'Ann').check()
    await sentCheckbox(page, 'Cat').check()

    await page.getByRole('button', { name: 'Start over' }).click()
    const dialog = page.getByRole('dialog', { name: 'Start over?' })
    await expect(dialog).toContainText('already sent links to Ann and Cat')
    await dialog.getByRole('button', { name: 'Yes, start over' }).click()

    // Back to the list, with everyone still on it.
    await expect(page.getByRole('heading', { name: "Who's in the draw?" })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove Ben' })).toBeVisible()
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
    page.on('dialog', () => {
      throw new Error('The app used a native pop-up')
    })
    await page.goto('/')
    await addNames(page, ['Ann', 'Ben', 'Cat'])
    await page.getByRole('button', { name: /Draw names/ }).click()
  })

  test('shows the link to copy by hand and leaves it unsent', async ({ page }) => {
    await page.getByRole('button', { name: 'Copy link' }).nth(1).click()
    const box = page.getByRole('textbox', { name: /Ben's link to copy yourself/ })
    await expect(box).toBeFocused()
    await expect(box).toHaveValue(/#\/gift\//)
    await expect(sentCheckbox(page, 'Ben')).not.toBeChecked()
    await expectNoA11yViolations(page)

    await page.getByRole('button', { name: 'Done' }).click()
    await expect(box).toBeHidden()
  })
})
