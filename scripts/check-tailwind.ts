// Flags Tailwind classes that have a standard (canonical) form, like
// `right-[18px]` → `right-4.5` or `[color-scheme:light]` → `scheme-light`.
// It's the same check as the Tailwind CSS IntelliSense editor extension's
// `suggestCanonicalClasses`, using Tailwind's own converter, so the command
// line agrees with the editor.
//
//   bun scripts/check-tailwind.ts         report problems, exit 1 if any
//   bun scripts/check-tailwind.ts --fix   rewrite them in place
//
// Merging classes (`w-4 h-4` → `size-4`) and ordering them are left to Biome's
// useTailwindShorthandClasses and useTailwindSortedClasses rules.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { __unstable__loadDesignSystem } from '@tailwindcss/node'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')
const STYLESHEET = join(SRC, 'index.css')
// Tailwind's spacing is in rem; class values in px convert at this size, as
// in the editor extension.
const ROOT_FONT_SIZE = 16

const fix = process.argv.includes('--fix')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : []
  })
}

// The text of every string literal (quotes, or template chunks between
// `${…}`), with where it starts. Class lists always live in strings.
function* stringLiterals(code: string): Generator<{ text: string; start: number }> {
  const pattern = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g
  for (const match of code.matchAll(pattern)) {
    const [, quote, body = ''] = match
    const bodyStart = (match.index ?? 0) + 1
    if (quote !== '`') {
      yield { text: body, start: bodyStart }
      continue
    }
    let offset = 0
    for (const chunk of body.split(/\$\{[^}]*\}/)) {
      const at = body.indexOf(chunk, offset)
      yield { text: chunk, start: bodyStart + at }
      offset = at + chunk.length
    }
  }
}

type Problem = { file: string; line: number; from: string; to: string; index: number }

const designSystem = await __unstable__loadDesignSystem(readFileSync(STYLESHEET, 'utf8'), {
  base: SRC,
})
const canonical = (candidate: string): string =>
  designSystem.canonicalizeCandidates([candidate], { rem: ROOT_FONT_SIZE })[0] ?? candidate

let total = 0
for (const file of sourceFiles(SRC)) {
  const code = readFileSync(file, 'utf8')
  const problems: Problem[] = []
  for (const { text, start } of stringLiterals(code)) {
    for (const token of text.matchAll(/\S+/g)) {
      const to = canonical(token[0])
      if (to === token[0]) continue
      const index = start + (token.index ?? 0)
      const line = code.slice(0, index).split('\n').length
      problems.push({ file, line, from: token[0], to, index })
    }
  }
  if (problems.length === 0) continue
  total += problems.length

  for (const p of problems) {
    console.log(`${relative(ROOT, p.file)}:${p.line}  ${p.from} → ${p.to}`)
  }
  if (fix) {
    // Replace from the end so earlier positions stay valid.
    let fixed = code
    for (const p of [...problems].reverse()) {
      fixed = fixed.slice(0, p.index) + p.to + fixed.slice(p.index + p.from.length)
    }
    writeFileSync(file, fixed)
  }
}

if (total === 0) {
  console.log('Tailwind classes: all canonical.')
} else if (fix) {
  console.log(`Fixed ${total} Tailwind class${total === 1 ? '' : 'es'}.`)
} else {
  console.log(
    `\n${total} Tailwind class${total === 1 ? '' : 'es'} can be written more simply. Run bun run lint:fix to fix.`,
  )
  process.exitCode = 1
}
