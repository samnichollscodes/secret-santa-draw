// Draw logic and link encoding for the Secret Santa.
//
// There is no server: each person's link carries their own assignment inside
// the URL hash. The payload is scrambled so the organiser can't read who got
// whom just by glancing at a link. It is obfuscation, not encryption — someone
// determined could decode it — but it keeps the draw a surprise for the
// organiser too.

export type Pair = {
  giver: string
  recipient: string
}

export type Assignment = Pair & {
  note?: string
}

// People who mustn't draw each other, such as a couple or housemates. Someone
// on their own is a household of one.
export type Household = string[]

export const MIN_PEOPLE = 3

// Short keys keep the links short.
type EncodedAssignment = {
  g: string
  r: string
  n?: string
}

type Person = {
  name: string
  household: number
}

function randomInt(max: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function formatNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

// Explains why these households can't be drawn yet, or returns null if they
// can. A valid draw exists exactly when no household is more than half of
// everyone: each of its members needs someone from outside it to buy for.
export function findDrawProblem(households: Household[]): string | null {
  const total = households.reduce((sum, h) => sum + h.length, 0)
  if (total < MIN_PEOPLE) return `Add ${MIN_PEOPLE - total} more to draw.`
  const largest = households.reduce((a, b) => (b.length > a.length ? b : a))
  const shortfall = largest.length * 2 - total
  if (shortfall > 0) {
    const more = shortfall === 1 ? '1 more person' : `${shortfall} more people`
    return `${formatNames(largest)} can't draw each other, and they're more than half the group. Add ${more} from outside their household to draw.`
  }
  return null
}

// Could the people still to place finish the loop? They go in a line between
// `last` (who buys for the first of them) and `first` (who the final one buys
// for), and no two neighbours may share a household. That works as long as no
// household has more people left than it has non-adjacent slots to fill.
function canFinish(remaining: Person[], last: Person, first: Person): boolean {
  const counts = new Map<number, number>()
  for (const p of remaining) counts.set(p.household, (counts.get(p.household) ?? 0) + 1)
  for (const [household, count] of counts) {
    const blockedEnds = Number(household === last.household) + Number(household === first.household)
    if (count > Math.ceil((remaining.length - blockedEnds) / 2)) return false
  }
  return true
}

// Builds a random loop through everyone where nobody buys for someone in their
// own household. A single loop also means nobody draws themselves and no two
// people simply swap (for groups of 3+).
function findLoop(path: Person[], remaining: Person[]): Person[] | null {
  const first = path[0]
  const last = path[path.length - 1]
  if (remaining.length === 0) return last.household === first.household ? null : path
  for (const next of shuffle(remaining)) {
    if (next.household === last.household) continue
    const rest = remaining.filter((p) => p !== next)
    if (!canFinish(rest, next, first)) continue
    const loop = findLoop([...path, next], rest)
    if (loop) return loop
  }
  return null
}

export function drawNames(households: Household[]): Pair[] {
  const problem = findDrawProblem(households)
  if (problem) throw new Error(problem)
  const people = shuffle(
    households.flatMap((h, household) => h.map((name) => ({ name, household }))),
  )
  const [first, ...rest] = people
  const loop = findLoop([first], rest)
  // findDrawProblem rules out every impossible case, so this is a bug guard.
  if (!loop) throw new Error('Could not find a valid draw')
  return loop.map((giver, i) => ({
    giver: giver.name,
    recipient: loop[(i + 1) % loop.length].name,
  }))
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

const KEY_LENGTH = 8

export function encodeAssignment({ giver, recipient, note }: Assignment): string {
  const payload: EncodedAssignment = { g: giver, r: recipient, n: note || undefined }
  const json = JSON.stringify(payload)
  const data = new TextEncoder().encode(json)
  const key = crypto.getRandomValues(new Uint8Array(KEY_LENGTH))
  const out = new Uint8Array(KEY_LENGTH + data.length)
  out.set(key)
  data.forEach((b, i) => {
    out[KEY_LENGTH + i] = b ^ key[i % KEY_LENGTH] ^ ((i * 31) % 256)
  })
  return toBase64Url(out)
}

export function decodeAssignment(token: string): Assignment | null {
  try {
    const bytes = fromBase64Url(token)
    const key = bytes.slice(0, KEY_LENGTH)
    const data = bytes.slice(KEY_LENGTH).map((b, i) => b ^ key[i % KEY_LENGTH] ^ ((i * 31) % 256))
    const { g, r, n } = JSON.parse(new TextDecoder().decode(data)) as Partial<EncodedAssignment>
    if (typeof g !== 'string' || typeof r !== 'string') return null
    return { giver: g, recipient: r, note: typeof n === 'string' ? n : undefined }
  } catch {
    return null
  }
}

export function giftLink(token: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/gift/${token}`
}
