# Coding Standards

## Language: TypeScript

This project is written in **TypeScript**. All source code goes in `.ts` / `.tsx` files. Don't add
`.js` or `.jsx` files to `src/`.

- **Strict mode is on** (`tsconfig.app.json`), along with the checks for unused locals and
  parameters. Don't turn these off to make an error go away. Fix the types instead.
- **No `any`.** If a value's type is really unknown, use `unknown` and narrow it.
- **Type the boundaries.** Data from outside the app (`JSON.parse`, `localStorage`, URL tokens) is
  typed as `Partial<…>` or `unknown` and checked before use. See `decodeAssignment` in
  `src/lib/draw.ts`. Keep `as` casts and non-null `!` assertions to those boundaries.
- **Use `type`, not `interface`**, for props and data shapes. Name component props `<Component>Props`.
- **Use string unions for state machines**, e.g. `type Stage = 'idle' | 'shaking' | 'open'`.
- **Mark type-only imports.** `verbatimModuleSyntax` is on, so write `import type { … }` or
  `import { …, type Foo }`.
- **Give exported functions explicit return types.** Local helpers and components can rely on
  inference.

## React

- Use function components and hooks only. Export one component per file as the default export.
- Keep render pure. Randomness (`Math.random`, `crypto`) belongs in a lazy `useState` initialiser or
  an event handler, not in the component body.
- Keep non-UI logic (the draw, encoding) in `src/lib/` as plain, testable functions.

## Styling

- Plain CSS in `src/index.css`, with BEM-style class names (`gift__lid`, `btn--ghost`).
- Colours and fonts come from the custom properties on `:root`. Don't hard-code new colours inline.
- Respect `prefers-reduced-motion` for any new animation.

## Linting and formatting: Biome

[Biome](https://biomejs.dev) lints and formats the project. Its config is `biome.jsonc`.

- **Formatting is Biome's job.** Run `npm run format` (or `npm run lint:fix`) rather than tidying
  by hand. The style is 2-space indent, single quotes, no semicolons, trailing commas and 100
  character lines.
- **Linting** uses Biome's recommended rules, plus extra code-smell checks: overly complex
  functions, unused variables and imports, `any`, non-null `!`, leftover `console` calls, empty
  blocks, `interface` instead of `type`, and missing `import type`.
- **Don't switch rules off to get a clean run.** If a rule really doesn't fit one spot, add a
  `// biome-ignore <rule>: <reason>` comment on that line, with a real reason.
- oxlint also runs as part of `npm run lint`, alongside Biome.

## Copy

- Comments explain _why_, not what.
- Use UK English in the UI and code (colour, organiser).

## Privacy rule

The organiser must never see who drew whom. Nothing on the organiser screen (UI, list order,
`localStorage`, console) may reveal a recipient. Only the giver's own link holds their assignment.

## Accessibility

The app aims for **WCAG 2.2 AA**. `npm run test:a11y` checks it with Playwright and axe-core in
`e2e/`, on desktop and mobile.

- **Every screen and state gets a scan.** That covers the organiser form, its error state, the draw
  results, the wrapped and opened present, and the broken-link page. A new screen or state needs a
  test that calls `expectNoA11yViolations`.
- **Everything works by keyboard,** and the tests prove it for the main flows. Use real `<button>`s
  and `<input>`s, not clickable `div`s.
- **Changing content is announced.** The revealed name sits in an `aria-live` region. Keep it that
  way if the reveal changes.
- **Contrast is 4.5:1 for normal text** and 3:1 for large text. Check new colours against the
  darkest and lightest parts of the background.
- **Keep text on solid colours.** axe can't measure contrast over gradients or background images,
  and it quietly skips those checks. Put depth on buttons and cards with shadows instead.
- **Decorations stay out of the way.** Mark them `aria-hidden`, and keep them from overlapping
  text. The scan helper hides the snow, the confetti and the card stripe, and scans against the
  lightest part of the page gradient. Don't widen that list to make a failing check pass.
- Respect `prefers-reduced-motion`, as covered under Styling.

Automated checks catch roughly a third of accessibility problems. Before a release, also try the
flow with VoiceOver (Cmd+F5) and at 200% zoom.

## Before committing

Run all four and make sure they pass. `npm run lint:fix` fixes most lint and formatting issues
for you.

```bash
npm run typecheck
npm run lint
npm run build
npm run test:a11y
```

The first time you run the accessibility tests, install the browser with
`npx playwright install chromium`.
