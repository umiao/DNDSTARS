import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { cleanCircleFringe, stripEmbeddedRing } from './icon-ring-utils.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const input = join(root, 'public/icons/ignite-source.png')
const output = join(root, 'public/icons/ignite.png')

function isIgniteRingPixel(r, g, b) {
  return r >= 140 && r > g + 20 && g < 100 && b < 100
}

function isIgniteStrictRingPixel(r, g, b) {
  return r >= 180 && r > g + 40 && b < 80
}

function isIgniteArtPixel(r, g, b) {
  if (isIgniteRingPixel(r, g, b)) return true
  if (r > 70 && r > b + 5 && g > 35) return true
  return false
}

function isCheckerboardBg(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const spread = max - min
  if (spread <= 32) {
    if (max <= 52) return true
    if (max >= 78) return true
  }
  return false
}

function applyIgniteMask(out, width, height, channels) {
  const cx = width / 2
  const cy = height / 2
  const minRingDist = Math.min(width, height) * 0.3

  let maxR = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      if (!isIgniteRingPixel(out[i], out[i + 1], out[i + 2])) continue
      const dist = Math.hypot(x - cx, y - cy)
      if (dist >= minRingDist && dist > maxR) maxR = dist
    }
  }
  if (maxR <= 0) return

  const radius = maxR + 2.5
  const r2 = radius * radius
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const dx = x - cx
      const dy = y - cy
      const inside = dx * dx + dy * dy <= r2
      const r = out[i]
      const g = out[i + 1]
      const b = out[i + 2]
      const a = out[i + 3]

      if (!inside) {
        out[i + 3] = 0
        continue
      }

      if (!isIgniteArtPixel(r, g, b) && (a < 20 || isCheckerboardBg(r, g, b))) {
        out[i] = 255
        out[i + 1] = 255
        out[i + 2] = 255
        out[i + 3] = 255
      }
    }
  }
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info
const out = Buffer.from(data)

applyIgniteMask(out, width, height, channels)

stripEmbeddedRing(out, width, height, channels, isIgniteRingPixel)
cleanCircleFringe(out, width, height, channels)

for (let i = 0; i < out.length; i += channels) {
  if (out[i + 3] === 0) {
    out[i] = 0
    out[i + 1] = 0
    out[i + 2] = 0
  }
}

await sharp(out, { raw: { width, height, channels } }).png().toFile(output)
console.log('Processed ignite icon:', output)
