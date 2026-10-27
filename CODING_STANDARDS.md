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

## Before committing

Run all three and make sure they pass. `npm run lint:fix` fixes most lint and formatting issues
for you.

```bash
npm run typecheck
npm run lint
npm run build
```
