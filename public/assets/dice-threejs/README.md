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
cleanly and so textured/sound themes can be added later. The npm package ships only
`dist/` (no `public/` assets get installed), so there is nothing to copy for the
procedural theme.

## T-P2-396 asset manifest (decision: glass / zero-asset, operator-confirmed)

T-P2-396 formalized the engine + theme into `src/lib/diceEngine.ts` and kept the
spike's procedural **glass / `texture:'none'` / `sounds:false`** theme (accent
`#7c3aed`). The npm package's `./public` ships ~40 `textures/*.webp` plus
`sounds/dicehit` + `sounds/surfaces`, but the chosen theme requests **none** of
them. AC1 manifest for this theme:

| asset category | files copied here | runtime URLs requested |
|----------------|-------------------|------------------------|
| models (geometry) | 0 (geometry generated in-engine) | 0 |
| textures          | 0 (`texture:'none'` → `ImageLoader` skipped) | 0 |
| sounds            | 0 (`sounds:false`) | 0 |

→ Every enumerated asset URL is vacuously reachable (there are zero), so AC1's
"each URL ⇒ 200" holds with **no 404 possible** under both `dev:dm`
(`vite-server.mjs`) and `serve:dm` (`static-server.mjs` from `dist`). This
`README.md` is the only file under `assetPath`, and Vite copies it into
`dist/assets/dice-threejs/README.md` at build.

If a future task adopts a textured/sound theme, copy the needed
`node_modules/@3d-dice/dice-box-threejs/public/{textures,sounds}/…` files **here**
and extend the table above with their concrete URLs.
