# Nicholls & Moore Secret Santa

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
