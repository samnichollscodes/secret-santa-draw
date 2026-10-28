import { expect, test } from './fixtures'
import { decodeLink, draw, storedLinks } from './helpers'

// The draw run through the real UI, checked by decoding the links it makes.
// The rules are tested in depth by the unit tests in src/lib/draw.test.ts.

const SINGLES = ['Ann', 'Ben', 'Cat', 'Dan', 'Eve', 'Fay']

test('every link decodes to one valid loop through everyone', async ({ page }) => {
  await draw(page, SINGLES)
  const pairs = (await storedLinks(page)).map((l) => decodeLink(l.url))

  expect(pairs.map((p) => p.giver)).toEqual(SINGLES)
  expect(pairs.map((p) => p.recipient).sort()).toEqual([...SINGLES].sort())
  for (const { giver, recipient } of pairs) expect(recipient).not.toBe(giver)

  // Following who buys for whom visits everyone exactly once.
  const next = new Map(pairs.map((p) => [p.giver, p.recipient]))
  const visited = new Set<string>()
  let current = SINGLES[0] ?? ''
  while (!visited.has(current)) {
    visited.add(current)
    current = next.get(current) ?? ''
  }
  expect(visited.size).toBe(SINGLES.length)
})

test('nobody draws someone from their own household', async ({ page }) => {
  const households = [
    ['Sam', 'Alex'],
    ['Jo', 'Chris'],
    ['Pat', 'Lee'],
  ]
  for (let run = 0; run < 10; run++) {
    await draw(
      page,
      households.map((h) => h.join(' + ')),
    )
    for (const { url } of await storedLinks(page)) {
      const { giver, recipient } = decodeLink(url)
      const home = households.find((h) => h.includes(giver))
      expect(home).not.toContain(recipient)
    }
  }
})

test('links are listed in the order names were entered, never the draw order', async ({ page }) => {
  // In draw order, each person buys for the next one down, which would give
  // the game away. Check several draws in case one happens to match.
  for (let run = 0; run < 5; run++) {
    await draw(page, SINGLES)
    await expect(
      page.getByRole('list', { name: 'Gift links' }).getByRole('listitem').locator('strong'),
    ).toHaveText(SINGLES)
  }
})

test('the saved draw never records who drew whom', async ({ page }) => {
  await draw(page, SINGLES, '£25 limit')
  const saved = await page.evaluate(() => localStorage.getItem('nm-secret-santa') ?? '')
  const links = (JSON.parse(saved) as { links: Record<string, unknown>[] }).links

  for (const link of links) expect(Object.keys(link).sort()).toEqual(['giver', 'sent', 'url'])
  // The links themselves are scrambled, so no recipient appears in plain text.
  for (const { url } of await storedLinks(page)) {
    expect(url).not.toMatch(new RegExp(SINGLES.join('|')))
  }
})

test('the message is included in every link', async ({ page }) => {
  await draw(page, SINGLES, '£25 limit, swap on Christmas Eve!')
  for (const { url } of await storedLinks(page)) {
    expect(decodeLink(url).note).toBe('£25 limit, swap on Christmas Eve!')
  }
})

test('links work with accented names and emoji', async ({ page }) => {
  const names = ['Zoë', "Seán O'Brien", 'Bjørn 🎄']
  await draw(page, names)
  const pairs = (await storedLinks(page)).map((l) => decodeLink(l.url))
  expect(pairs.map((p) => p.giver)).toEqual(names)
  expect(pairs.map((p) => p.recipient).sort()).toEqual([...names].sort())
})
