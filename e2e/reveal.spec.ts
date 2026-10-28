import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { decodeLink, draw, giftPath, storedLinks } from './helpers'

const present = (page: Page) => page.getByRole('button', { name: 'Unwrap your present' })

async function unwrap(page: Page): Promise<void> {
  await present(page).click()
  await expect(page.getByText("You're buying for")).toBeVisible()
}

test.describe('before unwrapping', () => {
  test('greets the giver without giving anything away', async ({ page }) => {
    await page.goto(giftPath({ giver: 'Ann', recipient: 'Bartholomew', note: 'Budget £25' }))
    await expect(page.getByRole('heading', { name: 'Merry Christmas, Ann!' })).toBeVisible()
    await expect(page.getByText('Tap the present to unwrap it.')).toBeVisible()
    await expect(present(page)).toBeEnabled()

    // The recipient and message aren't anywhere on the page yet.
    await expect(page.locator('body')).not.toContainText('Bartholomew')
    await expect(page.locator('body')).not.toContainText('Budget £25')
  })

  test('uses the small header on gift pages', async ({ page }) => {
    await page.goto(giftPath({ giver: 'Ann', recipient: 'Ben' }))
    await expect(page.locator('header')).toHaveAttribute('data-size', 'small')
  })
})

test.describe('unwrapping', () => {
  test('reveals who they are buying for, and the message', async ({ page }) => {
    await page.goto(giftPath({ giver: 'Ann', recipient: 'Ben', note: '£25 limit' }))
    await unwrap(page)

    await expect(page.getByRole('heading', { name: 'Ho ho ho!' })).toBeVisible()
    await expect(page.getByText("Ann, you're Secret Santa for…")).toBeVisible()
    await expect(page.getByTestId('recipient')).toHaveText('Ben')
    await expect(page.getByText('📜 £25 limit')).toBeVisible()
    await expect(page.getByText('Shh… keep it secret!')).toBeVisible()
  })

  test('shakes the present before it opens', async ({ page }) => {
    await page.goto(giftPath({ giver: 'Ann', recipient: 'Ben' }))
    await present(page).click()
    await expect(page.locator('[data-stage="shaking"]')).toBeVisible()
    await expect(page.locator('[data-stage="open"]')).toBeVisible()
  })

  test('can only be unwrapped once', async ({ page }) => {
    await page.goto(giftPath({ giver: 'Ann', recipient: 'Ben' }))
    await unwrap(page)
    await expect(present(page)).toBeDisabled()
    await expect(page.getByTestId('recipient')).toHaveCount(1)
  })

  test('shows no message box when there is no message', async ({ page }) => {
    await page.goto(giftPath({ giver: 'Ann', recipient: 'Ben' }))
    await unwrap(page)
    await expect(page.getByTestId('note')).toHaveCount(0)
  })

  test('shows accented names and emoji correctly', async ({ page }) => {
    await page.goto(giftPath({ giver: 'Zoë', recipient: "Seán O'Brien 🎄" }))
    await expect(page.getByRole('heading', { name: 'Merry Christmas, Zoë!' })).toBeVisible()
    await unwrap(page)
    await expect(page.getByTestId('recipient')).toHaveText("Seán O'Brien 🎄")
  })

  test('is wrapped again when the link is reopened', async ({ page }) => {
    await page.goto(giftPath({ giver: 'Ann', recipient: 'Ben' }))
    await unwrap(page)
    await page.reload()
    await expect(present(page)).toBeEnabled()
    await expect(page.locator('body')).not.toContainText('Ben')
  })
})

test('every link from a real draw opens to the right person', async ({ page }) => {
  await draw(page, ['Ann', 'Ben', 'Cat'], 'Presents on Christmas Eve')
  for (const { url } of await storedLinks(page)) {
    const { giver, recipient } = decodeLink(url)
    await page.goto(url)
    await expect(page.getByRole('heading', { name: `Merry Christmas, ${giver}!` })).toBeVisible()
    await unwrap(page)
    await expect(page.getByTestId('recipient')).toHaveText(recipient)
    await expect(page.getByText('📜 Presents on Christmas Eve')).toBeVisible()
  }
})

test.describe('broken and unknown links', () => {
  test('a scrambled link shows a friendly error', async ({ page }) => {
    await page.goto('/#/gift/not-a-real-token')
    await expect(page.getByRole('heading', { name: /broken bauble/ })).toBeVisible()
    await expect(page.getByText('Ask whoever sent it for a fresh copy.')).toBeVisible()
    await expect(present(page)).toHaveCount(0)
  })

  test('a cut-off link shows the same error', async ({ page }) => {
    const path = giftPath({ giver: 'Ann', recipient: 'Ben' })
    await page.goto(path.slice(0, -10))
    await expect(page.getByRole('heading', { name: /broken bauble/ })).toBeVisible()
  })

  test('an unknown address shows the organiser page', async ({ page }) => {
    await page.goto('/#/somewhere-else')
    await expect(page.getByRole('heading', { name: "Who's in the draw?" })).toBeVisible()
  })

  test('changing the address switches page without a reload', async ({ page }) => {
    await page.goto(giftPath({ giver: 'Ann', recipient: 'Ben' }))
    await expect(present(page)).toBeVisible()
    await page.evaluate(() => {
      window.location.hash = ''
    })
    await expect(page.getByRole('heading', { name: "Who's in the draw?" })).toBeVisible()
  })
})

test('a second link opened in the same tab starts wrapped', async ({ page }) => {
  await page.goto(giftPath({ giver: 'Ann', recipient: 'Ben' }))
  await unwrap(page)

  // Only the part after # changes, so the page doesn't reload.
  await page.goto(giftPath({ giver: 'Cat', recipient: 'Dan' }))
  await expect(page.getByRole('heading', { name: 'Merry Christmas, Cat!' })).toBeVisible()
  await expect(present(page)).toBeEnabled()
  await expect(page.locator('body')).not.toContainText('Dan')
})
