/** 分析地图底图是否自带规则方格网格 */

export interface GridDetectResult {
  detected: boolean
  confidence: number
  gridSize?: number
  gridOffsetX?: number
  gridOffsetY?: number
}

const MAX_ANALYZE_PX = 960
const MIN_LINES = 3
const MIN_CELL_PX = 12
const MAX_CELL_PX = 240

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function mean(values: number[] | Float32Array): number {
  if (values.length === 0) return 0
  let s = 0
  for (const v of values) s += v
  return s / values.length
}

function stddev(values: number[] | Float32Array, avg: number): number {
  if (values.length === 0) return 0
  let s = 0
  for (const v of values) s += (v - avg) ** 2
  return Math.sqrt(s / values.length)
}

function toGray(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]
  }
  return gray
}

/** 行间/列间强对比像素占比（细网格线更敏感） */
function lineFractionProfile(
  gray: Float32Array,
  w: number,
  h: number,
  horizontal: boolean,
): Float32Array {
  const len = horizontal ? h : w
  const out = new Float32Array(len)
  const thresh = 10

  if (horizontal) {
    for (let y = 1; y < h; y++) {
      let count = 0
      for (let x = 0; x < w; x++) {
        if (Math.abs(gray[y * w + x] - gray[(y - 1) * w + x]) > thresh) count++
      }
      out[y] = count / w
    }
  } else {
    for (let x = 1; x < w; x++) {
      let count = 0
      for (let y = 0; y < h; y++) {
        if (Math.abs(gray[y * w + x] - gray[y * w + (x - 1)]) > thresh) count++
      }
      out[x] = count / w
    }
  }
  return out
}

function rowEdgeScores(gray: Float32Array, w: number, h: number): Float32Array {
  const scores = new Float32Array(h)
  for (let y = 1; y < h; y++) {
    let sum = 0
    for (let x = 0; x < w; x++) {
      sum += Math.abs(gray[y * w + x] - gray[(y - 1) * w + x])
    }
    scores[y] = sum / w
  }
  return scores
}

function colEdgeScores(gray: Float32Array, w: number, h: number): Float32Array {
  const scores = new Float32Array(w)
  for (let x = 1; x < w; x++) {
    let sum = 0
    for (let y = 0; y < h; y++) {
      sum += Math.abs(gray[y * w + x] - gray[y * w + (x - 1)])
    }
    scores[x] = sum / w
  }
  return scores
}

function arrayMax(values: Float32Array): number {
  let m = 0.0001
  for (const v of values) if (v > m) m = v
  return m
}

function blendSignals(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(a.length)
  const maxA = arrayMax(a)
  const maxB = arrayMax(b)
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i] / maxA * 0.55 + (b[i] / maxB) * 0.45
  }
  return out
}

function smooth(scores: Float32Array, radius: number): Float32Array {
  const out = new Float32Array(scores.length)
  for (let i = 0; i < scores.length; i++) {
    let sum = 0
    let count = 0
    for (let d = -radius; d <= radius; d++) {
      const j = i + d
      if (j >= 0 && j < scores.length) {
        sum += scores[j]
        count++
      }
    }
    out[i] = sum / count
  }
  return out
}

function findLinePeaks(scores: Float32Array, minGap: number): number[] {
  const avg = mean(scores)
  const sd = stddev(scores, avg)
  const thresh = avg + sd * 0.85

  const peaks: number[] = []
  for (let i = 2; i < scores.length - 2; i++) {
    if (scores[i] < thresh) continue
    if (scores[i] < scores[i - 1] || scores[i] < scores[i + 1]) continue

    const last = peaks[peaks.length - 1]
    if (last == null || i - last >= minGap) peaks.push(i)
    else if (scores[i] > scores[last]) peaks[last] = i
  }
  return peaks
}

function findPeriodAutocorr(signal: Float32Array, minP: number, maxP: number): number | null {
  const avg = mean(signal)
  let varSum = 0
  for (let i = 0; i < signal.length; i++) varSum += (signal[i] - avg) ** 2
  const variance = varSum / Math.max(1, signal.length)
  if (variance < 1e-6) return null

  let bestP = 0
  let bestScore = 0
  const maxPeriod = Math.min(maxP, Math.floor(signal.length / 3))

  for (let p = minP; p <= maxPeriod; p++) {
    let sum = 0
    let n = 0
    for (let i = p; i < signal.length; i++) {
      sum += (signal[i] - avg) * (signal[i - p] - avg)
      n++
    }
    const score = sum / n / variance
    if (score > bestScore) {
      bestScore = score
      bestP = p
    }
  }

  return bestScore >= 0.28 ? bestP : null
}

function analyzeSpacing(
  positions: number[],
): { ok: boolean; period: number; offset: number; score: number } {
  if (positions.length < MIN_LINES) return { ok: false, period: 0, offset: 0, score: 0 }

  const gaps: number[] = []
  for (let i = 1; i < positions.length; i++) gaps.push(positions[i] - positions[i - 1])
  const period = median(gaps)
  if (period < MIN_CELL_PX) return { ok: false, period, offset: 0, score: 0 }

  const tolerance = Math.max(2, period * 0.18)
  const good = gaps.filter((g) => Math.abs(g - period) <= tolerance).length
  const score = good / gaps.length
  const ok = score >= 0.58

  const offset =
    positions.reduce((s, p) => {
      const m = ((p % period) + period) % period
      return s + m
    }, 0) / positions.length

  return { ok, period, offset, score }
}

function analyzeAxis(
  signal: Float32Array,
  minGap: number,
): { ok: boolean; period: number; offset: number; score: number; peaks: number[] } {
  const peaks = findLinePeaks(signal, minGap)
  const spacing = analyzeSpacing(peaks)
  if (spacing.ok) return { ...spacing, peaks }

  const acPeriod = findPeriodAutocorr(signal, MIN_CELL_PX, MAX_CELL_PX)
  if (acPeriod && peaks.length >= 2) {
    const synthetic: number[] = []
    for (let p = peaks[0]; p < signal.length; p += acPeriod) synthetic.push(p)
    const syn = analyzeSpacing(synthetic)
    if (syn.ok) return { ...syn, peaks: synthetic }
  }

  if (acPeriod) {
    const synthetic: number[] = []
    for (let p = acPeriod; p < signal.length; p += acPeriod) synthetic.push(p)
    const syn = analyzeSpacing(synthetic)
    if (syn.ok || synthetic.length >= MIN_LINES + 1) {
      return {
        ok: true,
        period: acPeriod,
        offset: acPeriod * 0.5,
        score: Math.max(syn.score, 0.55),
        peaks: synthetic,
      }
    }
  }

  return { ok: false, period: spacing.period, offset: 0, score: spacing.score, peaks }
}

function drawToCanvas(
  source: HTMLImageElement | ImageBitmap,
  naturalWidth: number,
  naturalHeight: number,
): { canvas: HTMLCanvasElement; scale: number } {
  const scale = Math.min(1, MAX_ANALYZE_PX / Math.max(naturalWidth, naturalHeight))
  const w = Math.max(1, Math.round(naturalWidth * scale))
  const h = Math.max(1, Math.round(naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('无法创建画布')
  ctx.drawImage(source, 0, 0, w, h)
  return { canvas, scale }
}

function analyzeImageData(
  data: ImageData,
  naturalWidth: number,
  naturalHeight: number,
): GridDetectResult {
  const { width: w, height: h, data: px } = data
  const gray = toGray(px, w, h)

  const rowSignal = smooth(
    blendSignals(rowEdgeScores(gray, w, h), lineFractionProfile(gray, w, h, true)),
    1,
  )
  const colSignal = smooth(
    blendSignals(colEdgeScores(gray, w, h), lineFractionProfile(gray, w, h, false)),
    1,
  )

  const minGap = Math.floor(MIN_CELL_PX * 0.45)
  const hSpace = analyzeAxis(rowSignal, minGap)
  const vSpace = analyzeAxis(colSignal, minGap)

  const periodOk =
    hSpace.period >= MIN_CELL_PX &&
    hSpace.period <= MAX_CELL_PX &&
    vSpace.period >= MIN_CELL_PX &&
    vSpace.period <= MAX_CELL_PX
  const squareOk =
    hSpace.period > 0 &&
    vSpace.period > 0 &&
    Math.abs(hSpace.period - vSpace.period) / Math.max(hSpace.period, vSpace.period) <= 0.22

  const detected = hSpace.ok && vSpace.ok && periodOk && squareOk
  const confidence = detected
    ? (hSpace.score + vSpace.score) / 2
    : Math.max(hSpace.score, vSpace.score) * 0.5

  if (!detected) {
    return { detected: false, confidence }
  }

  const scaleX = naturalWidth / w
  const scaleY = naturalHeight / h
  const cellPx = Math.round((hSpace.period * scaleX + vSpace.period * scaleY) / 2)

  return {
    detected: true,
    confidence,
    gridSize: Math.min(MAX_CELL_PX * scaleX, Math.max(20, cellPx)),
    gridOffsetX: Math.round(vSpace.offset * scaleX),
    gridOffsetY: Math.round(hSpace.offset * scaleY),
  }
}

/** 从已加载的图片元素识别底图网格 */
export async function detectImageGrid(image: HTMLImageElement): Promise<GridDetectResult> {
  const { canvas, scale } = drawToCanvas(image, image.naturalWidth, image.naturalHeight)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { detected: false, confidence: 0 }

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const result = analyzeImageData(data, image.naturalWidth, image.naturalHeight)

  if (result.detected && result.gridSize) {
    const minSize = Math.round(MIN_CELL_PX / Math.max(scale, 0.01))
    const maxSize = Math.round(MAX_CELL_PX / Math.max(scale, 0.01))
    result.gridSize = Math.min(maxSize, Math.max(minSize, result.gridSize))
  }

  return result
}

/** 从文件 / 已存 blob 识别 */
export async function detectGridFromBlob(blob: Blob): Promise<GridDetectResult> {
  if (!blob.type.startsWith('image/')) return { detected: false, confidence: 0 }

  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(blob)
      const { canvas, scale } = drawToCanvas(bitmap, bitmap.width, bitmap.height)
      bitmap.close()
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return { detected: false, confidence: 0 }
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const result = analyzeImageData(data, bitmap.width, bitmap.height)
      if (result.detected && result.gridSize) {
        const minSize = Math.round(MIN_CELL_PX / Math.max(scale, 0.01))
        const maxSize = Math.round(MAX_CELL_PX / Math.max(scale, 0.01))
        result.gridSize = Math.min(maxSize, Math.max(minSize, result.gridSize))
      }
      return result
    }
  } catch {
    /* fallback */
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = async () => {
      const result = await detectImageGrid(img)
      URL.revokeObjectURL(url)
      resolve(result)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ detected: false, confidence: 0 })
    }
    img.src = url
  })
}

export interface GridDetectMapPatch {
  builtinGridDetected: boolean
  showGrid?: boolean
  gridSize?: number
  gridOffsetX?: number
  gridOffsetY?: number
}

/** 将识别结果转为 updateMap 可用的字段 */
export function applyGridDetectPatch(detect: GridDetectResult): GridDetectMapPatch {
  if (!detect.detected) {
    return { builtinGridDetected: false }
  }
  return {
    builtinGridDetected: true,
    showGrid: false,
    gridSize: detect.gridSize ?? 70,
    gridOffsetX: detect.gridOffsetX ?? 0,
    gridOffsetY: detect.gridOffsetY ?? 0,
  }
}
