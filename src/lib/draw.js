// Draw logic and link encoding for the Secret Santa.
//
// There is no server: each person's link carries their own assignment inside
// the URL hash. The payload is scrambled so the organiser can't read who got
// whom just by glancing at a link. It is obfuscation, not encryption — someone
// determined could decode it — but it keeps the draw a surprise for the
// organiser too.

function randomInt(max) {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

// Sattolo's algorithm: a random permutation that forms a single cycle, so
// nobody draws themselves and no two people simply swap with each other
// (for groups of 3+).
export function drawNames(names) {
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

function toBase64Url(bytes) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

const KEY_LENGTH = 8

export function encodeAssignment({ giver, recipient, note }) {
  const json = JSON.stringify({ g: giver, r: recipient, n: note || undefined })
  const data = new TextEncoder().encode(json)
  const key = crypto.getRandomValues(new Uint8Array(KEY_LENGTH))
  const out = new Uint8Array(KEY_LENGTH + data.length)
  out.set(key)
  data.forEach((b, i) => {
    out[KEY_LENGTH + i] = b ^ key[i % KEY_LENGTH] ^ (i * 31) % 256
  })
  return toBase64Url(out)
}

export function decodeAssignment(token) {
  try {
    const bytes = fromBase64Url(token)
    const key = bytes.slice(0, KEY_LENGTH)
    const data = bytes.slice(KEY_LENGTH).map((b, i) => b ^ key[i % KEY_LENGTH] ^ (i * 31) % 256)
    const { g, r, n } = JSON.parse(new TextDecoder().decode(data))
    if (typeof g !== 'string' || typeof r !== 'string') return null
    return { giver: g, recipient: r, note: n }
  } catch {
    return null
  }
}

export function giftLink(token) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/gift/${token}`
}
