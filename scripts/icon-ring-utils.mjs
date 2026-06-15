/** 去掉 PNG 内嵌彩色描边，改由 UI 层 Konva 单独绘制外圈 */

export function isNearWhite(r, g, b, a = 255) {
  return a > 20 && r > 215 && g > 215 && b > 215
}

/**
 * 将 PNG 自带圆环带擦成白色，避免与 Konva 描边叠成双圈
 */
export function stripEmbeddedRing(out, width, height, channels, isRingPixel) {
  const cx = width / 2
  const cy = height / 2
  const minRingDist = Math.min(width, height) * 0.35

  let ringOuter = 0
  let ringInner = Infinity
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      if (!isRingPixel(out[i], out[i + 1], out[i + 2])) continue
      const dist = Math.hypot(x - cx, y - cy)
      if (dist < minRingDist) continue
      if (dist > ringOuter) ringOuter = dist
      if (dist < ringInner) ringInner = dist
    }
  }
  if (ringOuter <= 0) return

  const eraseFrom = Math.max(ringInner - 6, ringOuter * 0.76)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const dist = Math.hypot(x - cx, y - cy)
      if (dist < eraseFrom || dist > ringOuter + 3) continue
      if (out[i + 3] < 20) continue

      const r = out[i]
      const g = out[i + 1]
      const b = out[i + 2]
      if (isRingPixel(r, g, b) || dist > ringOuter * 0.8) {
        out[i] = 255
        out[i + 1] = 255
        out[i + 2] = 255
        out[i + 3] = 255
      }
    }
  }
}

/** 硬化圆边：去掉半透明毛边，外圈直接裁切 */
export function cleanCircleFringe(out, width, height, channels) {
  const cx = width / 2
  const cy = height / 2

  let edgeR = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      if (out[i + 3] < 128) continue
      const dist = Math.hypot(x - cx, y - cy)
      if (dist > edgeR) edgeR = dist
    }
  }
  if (edgeR <= 0) return

  const cutR = edgeR - 0.5
  const cutR2 = cutR * cutR

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const dx = x - cx
      const dy = y - cy
      const inside = dx * dx + dy * dy <= cutR2
      const a = out[i + 3]

      if (!inside) {
        out[i] = 0
        out[i + 1] = 0
        out[i + 2] = 0
        out[i + 3] = 0
        continue
      }

      if (a > 0 && a < 250) {
        if (isNearWhite(out[i], out[i + 1], out[i + 2], a)) {
          out[i] = 255
          out[i + 1] = 255
          out[i + 2] = 255
        }
        out[i + 3] = 255
      }
    }
  }
}
