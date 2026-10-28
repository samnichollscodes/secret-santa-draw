import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { addNames, expectNoA11yViolations } from './helpers'

const nameBox = (page: Page) => page.getByRole('textbox', { name: 'Name' })
const drawButton = (page: Page) => page.getByRole('button', { name: /Draw names/ })
const removeButton = (page: Page, name: string) =>
  page.getByRole('button', { name: `Remove ${name}` })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('adding names', () => {
  test('starts empty, with the draw switched off', async ({ page }) => {
    await expect(page.getByText('No elves on the list yet…')).toBeVisible()
    await expect(drawButton(page)).toBeDisabled()
  })

  test('adds several names at once and trims spaces', async ({ page }) => {
    await nameBox(page).fill('  Ann ,Ben,   Cat  ')
    await page.getByRole('button', { name: 'Add' }).click()
    for (const name of ['Ann', 'Ben', 'Cat']) await expect(removeButton(page, name)).toBeVisible()
    await expect(nameBox(page)).toHaveValue('')
  })

  test('pressing Enter adds the names', async ({ page }) => {
    await nameBox(page).fill('Ann')
    await nameBox(page).press('Enter')
    await expect(removeButton(page, 'Ann')).toBeVisible()
  })

  test('ignores an empty entry', async ({ page }) => {
    await nameBox(page).fill('  ,  ')
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByText('No elves on the list yet…')).toBeVisible()
  })

  test('rejects a duplicate name, ignoring case, and keeps what was typed', async ({ page }) => {
    await addNames(page, ['Ann'])
    await nameBox(page).fill('ann')
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByText('ann is already on the list.')).toBeVisible()
    await expect(nameBox(page)).toHaveValue('ann')
    await expect(page.getByRole('button', { name: /^Remove / })).toHaveCount(1)

    // The error clears once a valid name is added.
    await addNames(page, ['Ben'])
    await expect(page.getByText(/already on the list/)).toBeHidden()
  })

  test('rejects a name repeated within one entry', async ({ page }) => {
    await addNames(page, ['Sam', 'Jo', 'Sam'])
    await expect(page.getByText('Sam is already on the list.')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Remove / })).toHaveCount(0)
  })

  test('removes a name', async ({ page }) => {
    await addNames(page, ['Ann', 'Ben'])
    await removeButton(page, 'Ann').click()
    await expect(removeButton(page, 'Ann')).toHaveCount(0)
    await expect(removeButton(page, 'Ben')).toBeVisible()
  })
})

test.describe('when the draw is ready', () => {
  test('counts down to the three people needed', async ({ page }) => {
    await addNames(page, ['Ann'])
    await expect(page.getByText('Add 2 more to draw.')).toBeVisible()
    await addNames(page, ['Ben'])
    await expect(page.getByText('Add 1 more to draw.')).toBeVisible()
    await expect(drawButton(page)).toBeDisabled()

    await addNames(page, ['Cat'])
    await expect(page.getByText(/more to draw/)).toBeHidden()
    await expect(drawButton(page)).toBeEnabled()
  })

  test('switches back off if someone is removed', async ({ page }) => {
    await addNames(page, ['Ann', 'Ben', 'Cat'])
    await removeButton(page, 'Cat').click()
    await expect(drawButton(page)).toBeDisabled()
    await expect(page.getByText('Add 1 more to draw.')).toBeVisible()
  })
})

test.describe('households', () => {
  test('joins people with + or & into one household', async ({ page }) => {
    await addNames(page, ['Sam + Alex', 'Jo & Chris & Pat', 'Lee'])
    const households = page.getByTestId('household')
    await expect(households).toHaveCount(2)
    await expect(households.nth(0)).toContainText('Sam')
    await expect(households.nth(0)).toContainText('Alex')
    await expect(households.nth(1)).toContainText('Pat')
    // Screen readers hear that they're grouped.
    await expect(households.nth(0)).toContainText("Household, won't draw each other")
  })

  test('explains when a household is too big and enables the draw once it fits', async ({
    page,
  }) => {
    await addNames(page, ['Sam + Alex + Jo', 'Pat'])
    await expect(drawButton(page)).toBeDisabled()
    await expect(
      page.getByText(
        "Sam, Alex and Jo can't draw each other, and they're more than half the group. Add 2 more people from outside their household to draw.",
      ),
    ).toBeVisible()
    await expectNoA11yViolations(page)

    await addNames(page, ['Lee'])
    await expect(page.getByText(/Add 1 more person from outside/)).toBeVisible()
    await addNames(page, ['Kim'])
    await expect(drawButton(page)).toBeEnabled()
  })

  test('removing someone from a household keeps the rest', async ({ page }) => {
    await addNames(page, ['Sam + Alex', 'Jo'])
    await removeButton(page, 'Alex').click()
    await expect(removeButton(page, 'Sam')).toBeVisible()
    await expect(removeButton(page, 'Alex')).toHaveCount(0)
    // Sam is now on their own, so no household group is left.
    await expect(page.getByTestId('household')).toHaveCount(0)
  })
})

test.describe('saving', () => {
  test('keeps names, households and the message after a reload', async ({ page }) => {
    await addNames(page, ['Sam + Alex', 'Jo'])
    await page.getByRole('textbox', { name: /Message for everyone/ }).fill('£25 limit')
    await page.reload()

    await expect(removeButton(page, 'Alex')).toBeVisible()
    await expect(page.getByTestId('household')).toHaveCount(1)
    await expect(page.getByRole('textbox', { name: /Message for everyone/ })).toHaveValue(
      '£25 limit',
    )
  })

  test('loads a list saved before households existed', async ({ page }) => {
    await page.evaluate(() =>
      localStorage.setItem(
        'nm-secret-santa',
        JSON.stringify({ names: ['Ann', 'Ben', 'Cat'], note: '', links: null }),
      ),
    )
    await page.reload()
    await expect(removeButton(page, 'Cat')).toBeVisible()
    await expect(drawButton(page)).toBeEnabled()
  })

  test('starts fresh if the saved data is corrupt', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('nm-secret-santa', '{not json'))
    await page.reload()
    await expect(page.getByText('No elves on the list yet…')).toBeVisible()
  })
})
