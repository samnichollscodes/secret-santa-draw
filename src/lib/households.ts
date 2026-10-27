import type { Household } from './draw'

// Turns what the organiser typed into households. Commas or new lines
// separate households; `+` or `&` join people who shouldn't draw each other,
// so "Sam + Alex, Jo" is a couple and a single.
export function parseHouseholds(input: string): Household[] {
  return input
    .split(/[,\n]/)
    .map((part) =>
      part
        .split(/[+&]/)
        .map((name) => name.trim())
        .filter(Boolean),
    )
    .filter((household) => household.length > 0)
}

// The first name that appears twice, ignoring case, across both lists.
export function findDuplicate(existing: Household[], incoming: Household[]): string | null {
  const seen = new Set<string>()
  for (const name of [...existing.flat(), ...incoming.flat()]) {
    const key = name.toLowerCase()
    if (seen.has(key)) return name
    seen.add(key)
  }
  return null
}

export function removePerson(households: Household[], name: string): Household[] {
  return households
    .map((household) => household.filter((n) => n !== name))
    .filter((household) => household.length > 0)
}
