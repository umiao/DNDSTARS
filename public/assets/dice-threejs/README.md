# public/assets/dice-threejs/ — PERMANENT asset location

This directory is the permanent `assetPath` base for `@3d-dice/dice-box-threejs`,
established by the T-P2-395 spike and consumed by T-P2-396..398.

**Do NOT delete this directory in the T-P2-400 cleanup task** — only the
`/dice-spike` route and `src/pages/DiceSpikePage.tsx` are temporary.

## Why it is (currently) empty of binary assets

The spike uses a procedural theme: `theme_customColorset` with `texture: "none"`
and `sounds: false`. Source review of `dice-box-threejs.es.js` (v0.0.12) confirms:

- The `none` texture entry has `source: ""`, and `ImageLoader` only fetches when
  `source != ""`. → **no `textures/*` request, no 404.**
- Sounds are gated behind `sounds: true` (default false). → **no `sounds/*` request.**

So with the chosen theme the engine renders dice purely from geometry + colors and
fetches zero files from `assetPath`. The directory exists so `assetPath` resolves
cleanly and so textured/sound themes can be added later (T-P2-396 may enumerate
assets here if a textured theme is adopted). The npm package ships only `dist/`
(no `public/` assets), so there is nothing to copy for the procedural theme.
