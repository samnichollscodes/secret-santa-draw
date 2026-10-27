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
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
    await addNames(page, ['Ann', 'Ben', 'Cat'])
    await page.getByRole('button', { name: /Draw names/ }).click()
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

  test('start over asks for a simple confirmation when nothing was sent', async ({ page }) => {
    let message = ''
    page.once('dialog', (dialog) => {
      message = dialog.message()
      void dialog.dismiss()
    })
    await page.getByRole('button', { name: 'Start over' }).click()
    expect(message).toMatch(/thrown away/)
    await expect(page.getByText('0 of 3 links sent')).toBeVisible()
  })

  test('start over warns by name about links already sent', async ({ page }) => {
    await sentCheckbox(page, 'Ann').check()
    await sentCheckbox(page, 'Cat').check()

    let message = ''
    page.once('dialog', (dialog) => {
      message = dialog.message()
      void dialog.accept()
    })
    await page.getByRole('button', { name: 'Start over' }).click()
    expect(message).toMatch(/already sent links to Ann and Cat/)

    // Back to the list, with everyone still on it.
    await expect(page.getByRole('heading', { name: "Who's in the draw?" })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove Ben' })).toBeVisible()
  })
})
