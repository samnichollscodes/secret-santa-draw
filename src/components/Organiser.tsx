import { useEffect, useState } from 'react'
import { drawNames, encodeAssignment, giftLink, type Household } from '../lib/draw'
import { type GiftLink, loadDraw, saveDraw } from '../lib/storage'
import DrawResults from './DrawResults'
import NameEntry from './NameEntry'

export default function Organiser() {
  const [saved] = useState(loadDraw)
  const [households, setHouseholds] = useState<Household[]>(saved.households)
  const [note, setNote] = useState(saved.note)
  // Only the giver and their opaque link are kept — never the recipient.
  const [links, setLinks] = useState<GiftLink[] | null>(saved.links)

  useEffect(() => {
    saveDraw({ households, note, links })
  }, [households, note, links])

  function runDraw() {
    const everyone = households.flat()
    // Show links in the order names were entered — the draw order would give
    // the game away, since each person buys for the next one in it.
    const pairs = drawNames(households).sort(
      (a, b) => everyone.indexOf(a.giver) - everyone.indexOf(b.giver),
    )
    setLinks(
      pairs.map(({ giver, recipient }) => ({
        giver,
        url: giftLink(encodeAssignment({ giver, recipient, note: note.trim() })),
        sent: false,
      })),
    )
  }

  if (links) {
    return <DrawResults links={links} onLinksChange={setLinks} onStartOver={() => setLinks(null)} />
  }

  return (
    <NameEntry
      households={households}
      onHouseholdsChange={setHouseholds}
      note={note}
      onNoteChange={setNote}
      onDraw={runDraw}
    />
  )
}
