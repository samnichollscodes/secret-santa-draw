import { describe, expect, it } from 'vitest'
import { findDuplicate, parseHouseholds, removePerson } from './households'

describe('parseHouseholds', () => {
  it('splits people on commas and new lines', () => {
    expect(parseHouseholds('Ann, Ben\nCat')).toEqual([['Ann'], ['Ben'], ['Cat']])
  })

  it('groups people joined with + or &', () => {
    expect(parseHouseholds('Sam + Alex, Jo & Chris & Pat, Lee')).toEqual([
      ['Sam', 'Alex'],
      ['Jo', 'Chris', 'Pat'],
      ['Lee'],
    ])
  })

  it('ignores stray spaces and separators', () => {
    expect(parseHouseholds(' Ann ,, + Ben +, ')).toEqual([['Ann'], ['Ben']])
    expect(parseHouseholds('   ')).toEqual([])
  })
})

describe('findDuplicate', () => {
  it('finds a name already on the list, ignoring case', () => {
    expect(findDuplicate([['Ann'], ['Ben']], [['ann']])).toBe('ann')
  })

  it('finds a name repeated in what was just typed', () => {
    expect(findDuplicate([], [['Sam', 'Alex'], ['Sam']])).toBe('Sam')
  })

  it('returns null when every name is new', () => {
    expect(findDuplicate([['Ann']], [['Ben', 'Cat']])).toBeNull()
  })
})

describe('removePerson', () => {
  it('removes someone from their household', () => {
    expect(removePerson([['Sam', 'Alex'], ['Jo']], 'Alex')).toEqual([['Sam'], ['Jo']])
  })

  it('drops a household once it is empty', () => {
    expect(removePerson([['Sam', 'Alex'], ['Jo']], 'Jo')).toEqual([['Sam', 'Alex']])
  })
})
