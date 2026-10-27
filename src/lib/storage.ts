// Saves the organiser's draw in their browser so a refresh doesn't lose it.
// Only givers and their opaque links are stored, never who drew whom.

import type { Household } from './draw'

const STORAGE_KEY = 'nm-secret-santa'

export type GiftLink = {
  giver: string
  url: string
  sent: boolean
}

export type SavedDraw = {
  households: Household[]
  note: string
  links: GiftLink[] | null
}

const EMPTY: SavedDraw = { households: [], note: '', links: null }

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string')

function parseHouseholds(raw: Record<string, unknown>): Household[] {
  if (Array.isArray(raw.households) && raw.households.every(isStringArray)) return raw.households
  // Drafts saved before households existed kept a flat list of names.
  if (isStringArray(raw.names)) return raw.names.map((name) => [name])
  return []
}

function parseLinks(value: unknown): GiftLink[] | null {
  if (!Array.isArray(value)) return null
  const links: GiftLink[] = []
  for (const item of value as Record<string, unknown>[]) {
    if (typeof item?.giver !== 'string' || typeof item.url !== 'string') return null
    links.push({ giver: item.giver, url: item.url, sent: item.sent === true })
  }
  return links
}

export function loadDraw(): SavedDraw {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    if (typeof raw !== 'object' || raw === null) return EMPTY
    const record = raw as Record<string, unknown>
    return {
      households: parseHouseholds(record),
      note: typeof record.note === 'string' ? record.note : '',
      links: parseLinks(record.links),
    }
  } catch {
    return EMPTY
  }
}

export function saveDraw(draw: SavedDraw): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draw))
  } catch {
    // Storage unavailable (private mode etc.) — the app still works.
  }
}
