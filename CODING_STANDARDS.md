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
- **No native pop-ups** (`window.confirm`, `alert`, `prompt`). Embedded and in-app browsers, like
  links opened inside WhatsApp or Instagram, can silently answer them "Cancel" without showing
  anything. Use `ConfirmDialog` (an on-page `<dialog>`) instead. Biome's `noAlert` rule enforces
  this, and the Playwright tests fail if a native pop-up appears.
- Keep non-UI logic (the draw, encoding, parsing names, saved state) in `src/lib/` as plain,
  testable functions. Components stay thin and call into it.

## Styling

The app is styled with [Tailwind CSS 4](https://tailwindcss.com) utility classes in the
components. There are no hand-written CSS classes.

- **The theme lives in `src/index.css`**, in `@theme`: colours (`pine-700`, `berry`, `cream`…),
  fonts (`font-display`, `font-script`, `font-body`), shadows and animations (`animate-rise`…). Add
  new design values there and use them as classes. Biome's `noTailwindRawColors` rule rejects
  Tailwind's stock palette (`bg-red-500`), so every colour comes from the theme.
- **Prefer standard classes over arbitrary values.** Write `right-4.5`, not `right-[18px]`.
  `npm run lint` reports any arbitrary value that has a standard form, and `npm run lint:fix`
  converts it. Arbitrary values are fine for one-off values with no standard form, like
  `text-[clamp(2rem,9vw,2.8rem)]`.
- **Reuse with components, not CSS.** Repeated looks are React components (`ui/Card.tsx`,
  `ui/Button.tsx`) or shared class lists (`ui/classes.ts`). Use `@utility` in `index.css` only
  for things too detailed for classes, like the gift's wrapping paper.
- **Join class lists with `cn()`** (`ui/cn.ts`), not template strings, and wrap shared class
  constants in it. Biome's Tailwind rules only check strings in `className` and in `cn()`.
- **Drive state with data attributes and `group-data-*`.** The present uses
  `data-stage="idle|shaking|open"` on a `group`, and its parts react with classes like
  `group-data-[stage=open]:animate-lid-off`.
- **Tests never select by CSS class.** Use roles, labels, `data-testid` or data attributes, so
  changing the styling can't break them.
- Respect `prefers-reduced-motion` for any new animation (`motion-reduce:`).

## Linting and formatting: Biome

[Biome](https://biomejs.dev) lints and formats the project. Its config is `biome.jsonc`.

- **Formatting is Biome's job.** Run `npm run format` (or `npm run lint:fix`) rather than tidying
  by hand. The style is 2-space indent, single quotes, no semicolons, trailing commas and 100
  character lines.
- **Linting** uses Biome's recommended rules, plus extra code-smell checks: overly complex
  functions, unused variables and imports, `any`, non-null `!`, leftover `console` calls, empty
  blocks, `interface` instead of `type`, and missing `import type`.
- **No deprecated imports.** `noDeprecatedImports` fails the lint on anything marked
  `@deprecated`, including React's own types (for example, use `SubmitEvent`, not `FormEvent`, for
  `onSubmit`). TypeScript itself never reports deprecations; your editor's strikethrough is only a
  hint, so this rule is what enforces it.
- **Don't switch rules off to get a clean run.** If a rule really doesn't fit one spot, add a
  `// biome-ignore <rule>: <reason>` comment on that line, with a real reason.
- **Tailwind classes** are checked by Biome's Tailwind rules: Tailwind's class order,
  shorthands (`w-4 h-4` → `size-4`), no legacy names, and theme colours only. Biome doesn't know
  about canonical forms, so `scripts/check-tailwind.ts` covers those (`right-[18px]` →
  `right-4.5`). It uses Tailwind's own converter, so it gives the same suggestions as the
  Tailwind CSS IntelliSense editor extension. Both run in `npm run lint`, and `npm run lint:fix`
  applies their fixes.
- oxlint also runs as part of `npm run lint`, alongside Biome.

## Copy

- Comments explain _why_, not what.
- Use UK English in the UI and code (colour, organiser).

## Privacy rule

The organiser must never see who drew whom. Nothing on the organiser screen (UI, list order,
`localStorage`, console) may reveal a recipient. Only the giver's own link holds their assignment.

## Accessibility

The app aims for **WCAG 2.2 AA**. `npm run test:e2e` checks it with Playwright and axe-core in
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
  text. The scan helper hides anything marked `data-decorative` (the snow, the confetti and the
  card stripe), and scans against the lightest part of the page gradient. Don't mark something
  decorative to make a failing check pass.
- Respect `prefers-reduced-motion`, as covered under Styling.

Automated checks catch roughly a third of accessibility problems. Before a release, also try the
flow with VoiceOver (Cmd+F5) and at 200% zoom.

## Testing

- **Unit tests (Vitest)** live next to the code as `src/**/*.test.ts` and run with `npm test`.
  Anything in `src/lib/` gets tests, especially the draw: its tests run each household setup
  hundreds of times and check every rule (nobody draws themselves or their own household, everyone
  gives and receives once, one single loop). Add a case there for any new draw rule.
- **End-to-end tests (Playwright)** live in `e2e/` and run with `npm run test:e2e`. They drive the
  real app on desktop and mobile. There's one spec file per area:

  | File                   | Covers                                                         |
  | ---------------------- | -------------------------------------------------------------- |
  | `name-entry.spec.ts`   | Adding and removing names, households, the draw button, saving |
  | `draw.spec.ts`         | The real draw: valid loops, households, link order, privacy    |
  | `draw-results.spec.ts` | Copying, sharing, sent tracking, starting over                 |
  | `reveal.spec.ts`       | The gift page: greeting, unwrapping, messages, broken links    |
  | `a11y.spec.ts`         | Accessibility scans, keyboard-only use, reduced motion         |

- **Import `test` and `expect` from `./fixtures`**, not `@playwright/test`. The fixture fails any
  test where the app opens a native pop-up.
- **Shared steps live in `e2e/helpers.ts`**: `draw()`, `storedLinks()`, `decodeLink()`,
  `giftPath()` and `expectNoA11yViolations()`. Use `giftPath()` to test the reveal with a known
  recipient, and `decodeLink()` to check what a real draw produced.
- **Fake the browser, not the app.** To test sharing or blocked copying, replace
  `navigator.share` or `navigator.clipboard` with `page.addInitScript`. Never stub the app's own
  code.
- **A test must be able to fail.** For a new rule, break the code on purpose once and check the
  test goes red. Watch out for tests about something _not_ happening: they can pass before the
  thing has had time to happen.
- **No fixed waits** (`waitForTimeout`) in Playwright tests. Wait for something visible, or let
  `expectNoA11yViolations` wait for animations to finish.

## Before committing

Run all five and make sure they pass. `npm run lint:fix` fixes most lint and formatting issues
for you.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

The first time you run the end-to-end tests, install the browser with
`npx playwright install chromium`.
