import { describe, expect, it } from 'vitest'
import {
  decodeAssignment,
  drawNames,
  encodeAssignment,
  findDrawProblem,
  formatNames,
  type Household,
  type Pair,
} from './draw'

const RUNS = 300

function householdOf(households: Household[], name: string): number {
  return households.findIndex((h) => h.includes(name))
}

// Checks every rule a draw must follow, for any set of households.
function expectValidDraw(households: Household[], pairs: Pair[]): void {
  const everyone = households.flat()
  expect(pairs.map((p) => p.giver).sort()).toEqual([...everyone].sort())
  expect(pairs.map((p) => p.recipient).sort()).toEqual([...everyone].sort())

  for (const { giver, recipient } of pairs) {
    expect(recipient).not.toBe(giver)
    expect(householdOf(households, recipient)).not.toBe(householdOf(households, giver))
  }

  // One single loop: following who buys for whom visits everyone once.
  const next = new Map(pairs.map((p) => [p.giver, p.recipient]))
  const seen = new Set<string>()
  let current = everyone[0]
  while (!seen.has(current)) {
    seen.add(current)
    current = next.get(current) ?? ''
  }
  expect(seen.size).toBe(everyone.length)
}

const singles = (...names: string[]): Household[] => names.map((n) => [n])

describe('drawNames', () => {
  const cases: [string, Household[]][] = [
    ['three singles', singles('Ann', 'Ben', 'Cat')],
    ['ten singles', singles('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J')],
    ['couples and singles', [['Sam', 'Alex'], ['Jo', 'Chris'], ['Pat'], ['Lee']]],
    [
      'two couples only',
      [
        ['Sam', 'Alex'],
        ['Jo', 'Chris'],
      ],
    ],
    [
      'household of exactly half',
      [['A1', 'A2', 'A3', 'A4', 'A5'], ...singles('B', 'C', 'D', 'E', 'F')],
    ],
    [
      'two halves',
      [
        ['A1', 'A2', 'A3'],
        ['B1', 'B2', 'B3'],
      ],
    ],
    [
      'odd group with a big household',
      [
        ['A1', 'A2', 'A3'],
        ['B1', 'B2'],
        ['C1', 'C2'],
      ],
    ],
    [
      'large mixed group',
      [['A1', 'A2', 'A3', 'A4'], ['B1', 'B2', 'B3'], ['C1', 'C2'], ...singles('D', 'E', 'F', 'G')],
    ],
  ]

  for (const [label, households] of cases) {
    it(`always makes a valid single loop: ${label}`, () => {
      for (let run = 0; run < RUNS; run++) expectValidDraw(households, drawNames(households))
    })
  }

  it('gives different results across draws', () => {
    const households = singles('A', 'B', 'C', 'D', 'E', 'F')
    const results = new Set(
      Array.from({ length: 50 }, () =>
        JSON.stringify(drawNames(households).sort((a, b) => a.giver.localeCompare(b.giver))),
      ),
    )
    expect(results.size).toBeGreaterThan(10)
  })

  it('handles a big group quickly', () => {
    const households: Household[] = Array.from({ length: 20 }, (_, i) => [`P${i}a`, `P${i}b`])
    const start = performance.now()
    for (let run = 0; run < 20; run++) expectValidDraw(households, drawNames(households))
    expect(performance.now() - start).toBeLessThan(2000)
  })

  it('refuses a draw that cannot work', () => {
    expect(() => drawNames([['A1', 'A2', 'A3'], ['B'], ['C']])).toThrow(/more than half/)
  })
})

describe('findDrawProblem', () => {
  it('needs at least three people', () => {
    expect(findDrawProblem([])).toBe('Add 3 more to draw.')
    expect(findDrawProblem(singles('Ann', 'Ben'))).toBe('Add 1 more to draw.')
    expect(findDrawProblem([['Sam', 'Alex']])).toBe('Add 1 more to draw.')
  })

  it('accepts households up to half the group', () => {
    expect(findDrawProblem(singles('Ann', 'Ben', 'Cat'))).toBeNull()
    expect(
      findDrawProblem([
        ['Sam', 'Alex'],
        ['Jo', 'Chris'],
      ]),
    ).toBeNull()
    expect(findDrawProblem([['A1', 'A2'], ['B'], ['C']])).toBeNull()
  })

  it('explains when a household is more than half the group', () => {
    expect(findDrawProblem([['Sam', 'Alex'], ['Jo']])).toBe(
      "Sam and Alex can't draw each other, and they're more than half the group. Add 1 more person from outside their household to draw.",
    )
    expect(findDrawProblem([['A1', 'A2', 'A3', 'A4'], ['B']])).toMatch(/Add 3 more people/)
  })
})

describe('formatNames', () => {
  it('joins names naturally', () => {
    expect(formatNames(['Ann'])).toBe('Ann')
    expect(formatNames(['Ann', 'Ben'])).toBe('Ann and Ben')
    expect(formatNames(['Ann', 'Ben', 'Cat'])).toBe('Ann, Ben and Cat')
  })
})

describe('encodeAssignment / decodeAssignment', () => {
  it('round-trips names and notes, including accents and emoji', () => {
    const assignment = { giver: 'Zoë', recipient: "Seán O'Brien 🎄", note: '£25 limit' }
    expect(decodeAssignment(encodeAssignment(assignment))).toEqual(assignment)
  })

  it('leaves the note out when there is none', () => {
    const decoded = decodeAssignment(encodeAssignment({ giver: 'Ann', recipient: 'Ben', note: '' }))
    expect(decoded).toEqual({ giver: 'Ann', recipient: 'Ben', note: undefined })
  })

  it("doesn't show names in the link", () => {
    const token = encodeAssignment({ giver: 'Annabel', recipient: 'Benedict' })
    expect(token).not.toMatch(/Annabel|Benedict/)
    expect(atob(token.replace(/-/g, '+').replace(/_/g, '/'))).not.toMatch(/Annabel|Benedict/)
  })

  it('rejects broken links', () => {
    expect(decodeAssignment('not-a-real-token')).toBeNull()
    expect(decodeAssignment('')).toBeNull()
  })
})
