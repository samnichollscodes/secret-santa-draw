# Secret Santa

A tiny, server-free Secret Santa draw.

1. Add everyone's names and (optionally) a message such as the budget.
2. Press **Draw names** — you get one private link per person.
3. Send each person their link. When they open it they unwrap a present to see who they're buying for.

The organiser never sees the pairings: each link carries only that person's assignment, scrambled
inside the URL. (It's obfuscation, not encryption — just don't open other people's links!)

## Development

```bash
npm install
npm run dev
```

## Deploying

`npm run build` outputs a static site in `dist/` that can be hosted anywhere (GitHub Pages,
Netlify, Vercel…). The links use the address the app is opened from, so do the draw on the
deployed site, not on `localhost`.

## Contributing

See [CODING_STANDARDS.md](CODING_STANDARDS.md). The project is TypeScript, linted and formatted with Biome, and tested for accessibility (WCAG 2.2 AA) with Playwright and axe-core. Run `npm run typecheck`, `npm run lint`, `npm run build` and `npm run test:a11y` before committing (`npm run lint:fix` fixes most issues). Before the first accessibility test run, install the browser with `npx playwright install chromium`.
