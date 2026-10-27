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

// Short keys keep the links short.
type EncodedAssignment = {
  g: string
  r: string
  n?: string
}

function randomInt(max: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

// Sattolo's algorithm: a random permutation that forms a single cycle, so
// nobody draws themselves and no two people simply swap with each other
// (for groups of 3+).
export function drawNames(names: string[]): Pair[] {
  const order = [...names]
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order.map((giver, i) => ({
    giver,
    recipient: order[(i + 1) % order.length],
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
    out[KEY_LENGTH + i] = b ^ key[i % KEY_LENGTH] ^ (i * 31) % 256
  })
  return toBase64Url(out)
}

export function decodeAssignment(token: string): Assignment | null {
  try {
    const bytes = fromBase64Url(token)
    const key = bytes.slice(0, KEY_LENGTH)
    const data = bytes.slice(KEY_LENGTH).map((b, i) => b ^ key[i % KEY_LENGTH] ^ (i * 31) % 256)
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
