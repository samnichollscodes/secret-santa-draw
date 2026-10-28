import { expect, test } from './fixtures'
import { addNames, drawAndGetLink, expectNoA11yViolations } from './helpers'

const NAMES = ['Ann', 'Ben', 'Cat']

test.describe('organiser', () => {
  test('empty form has no violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Secret Santa' })).toBeVisible()
    await expectNoA11yViolations(page)
  })

  test('form with names and an error has no violations', async ({ page }) => {
    await page.goto('/')
    await addNames(page, NAMES)
    await addNames(page, ['Ann'])
    await expect(page.getByText('Ann is already on the list.')).toBeVisible()
    await expectNoA11yViolations(page)
  })

  test('draw results have no violations', async ({ page }) => {
    await drawAndGetLink(page, NAMES)
    await expect(page.getByRole('heading', { name: /names are in the hat/ })).toBeVisible()
    await expectNoA11yViolations(page)
  })

  test('can add names and draw with the keyboard only', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused()
    await page.keyboard.type(NAMES.join(', '))
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Remove Cat' })).toBeVisible()

    const draw = page.getByRole('button', { name: /Draw names/ })
    await draw.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Copy all links' })).toBeVisible()
  })
})

test.describe('gift link', () => {
  test('wrapped present has no violations', async ({ page }) => {
    const url = await drawAndGetLink(page, NAMES)
    await page.goto(url)
    await expect(page.getByRole('button', { name: 'Unwrap your present' })).toBeVisible()
    await expectNoA11yViolations(page)
  })

  test('opened present has no violations', async ({ page }) => {
    const url = await drawAndGetLink(page, NAMES)
    await page.goto(url)
    await page.getByRole('button', { name: 'Unwrap your present' }).click()
    await expect(page.getByText("You're buying for")).toBeVisible()
    await expectNoA11yViolations(page)
  })

  test('can unwrap with the keyboard and the name is announced', async ({ page }) => {
    const url = await drawAndGetLink(page, NAMES)
    await page.goto(url)
    const gift = page.getByRole('button', { name: 'Unwrap your present' })
    await gift.focus()
    await page.keyboard.press('Enter')
    const live = page.locator('[aria-live="polite"]')
    await expect(live).toContainText("You're buying for")
    await expect(live).toContainText(/Ann|Ben|Cat/)
  })

  test('works with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const url = await drawAndGetLink(page, NAMES)
    await page.goto(url)
    await expect(page.getByTestId('snow')).toBeHidden()
    await page.getByRole('button', { name: 'Unwrap your present' }).click()
    await expect(page.getByText("You're buying for")).toBeVisible()
    await expectNoA11yViolations(page)
  })

  test('broken link has no violations', async ({ page }) => {
    await page.goto('/#/gift/not-a-real-token')
    await expect(page.getByRole('heading', { name: /broken bauble/ })).toBeVisible()
    await expectNoA11yViolations(page)
  })
})
