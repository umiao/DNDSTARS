import { useEffect, useId, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'

const FLY_OFFSETS = [
  ['-340px', '-120px'],
  ['340px', '-120px'],
  ['-360px', '80px'],
  ['360px', '80px'],
  ['-120px', '-260px'],
  ['120px', '-260px'],
  ['-220px', '240px'],
  ['220px', '240px'],
] as const

const MIN_VISIBLE_ROLL_MS = 2600

interface DiceBoxRollOverlayProps {
  count: number
  sides: number
  label: string
  targetName: string
  visualOnly?: boolean
  values?: number[]
  requestId?: string
  flyIndex?: number
  showHud?: boolean
  onComplete: (values: number[]) => void
}

function fallbackValues(count: number, sides: number) {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides))
}

function stableIndex(seed: string, length: number) {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % Math.max(1, length)
}

export default function DiceBoxRollOverlay({
  count,
  sides,
  label,
  targetName,
  visualOnly = false,
  values: forcedValues,
  requestId: forcedRequestId,
  flyIndex,
  showHud: _showHud = false,
  onComplete,
}: DiceBoxRollOverlayProps) {
  void _showHud
  void visualOnly
  void label
  void targetName
  const rawId = useId()
  const generatedRequestId = `dice-${rawId}`
  const requestId = forcedRequestId ?? generatedRequestId
  const iframeSides = Math.max(2, Math.min(100, Math.round(Number(sides) || 6)))
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const readyRef = useRef(false)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const [flyX, flyY] = useMemo(
    () => FLY_OFFSETS[flyIndex == null ? stableIndex(requestId, FLY_OFFSETS.length) : Math.abs(Math.round(flyIndex)) % FLY_OFFSETS.length],
    [flyIndex, requestId],
  )

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const startedAt = Date.now()
    const safeCount = Math.max(1, Math.min(12, Math.round(count)))
    const safeSides = Math.max(2, Math.min(100, Math.round(sides)))
    const log = (stage: string, details?: Record<string, unknown>) => {
      console.info('[dice-box-roll-overlay]', {
        requestId,
        stage,
        elapsedMs: Date.now() - startedAt,
        sides: safeSides,
        count: safeCount,
        forcedValues,
        ...details,
      })
    }
    const finish = (values: unknown) => {
      if (completedRef.current) return
      completedRef.current = true
      const rolled = Array.isArray(values)
        ? values.map((value) => Math.max(1, Math.min(safeSides, Math.round(Number(value)))))
        : []
      const finalValues =
        forcedValues && forcedValues.length > 0
          ? forcedValues.slice(0, safeCount).map((value) => Math.max(1, Math.min(safeSides, Math.round(Number(value)))))
          : rolled.length > 0 ? rolled.slice(0, safeCount) : fallbackValues(safeCount, safeSides)
      log('finish', { finalValues })
      const delay = Math.max(0, MIN_VISIBLE_ROLL_MS - (Date.now() - startedAt))
      window.setTimeout(() => {
        onCompleteRef.current(finalValues)
      }, delay)
    }
    const sendRoll = () => {
      log('send-roll')
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'roll-dice',
          requestId,
          qty: safeCount,
          sides: safeSides,
          values: forcedValues,
        },
        window.location.origin,
      )
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as {
        type?: string
        requestId?: string
        values?: unknown
        stage?: string
      } | undefined
      if (data?.type === 'dice-box-debug') {
        console.info('[dice-box-debug]', data)
        return
      }
      if (data?.type === 'dice-box-ready' && !readyRef.current) {
        readyRef.current = true
        log('iframe-ready')
        sendRoll()
        return
      }
      if (data?.type === 'dice-box-roll-result' && data.requestId === requestId) {
        log('result-message', { values: data.values })
        finish(data.values)
      }
    }
    window.addEventListener('message', handleMessage)
    const retry = window.setTimeout(() => {
      if (!readyRef.current) {
        log('ready-retry-send')
        sendRoll()
      }
    }, 900)
    const fallback = window.setTimeout(() => finish(forcedValues), 22000)
    return () => {
      if (iframeRef.current) iframeRef.current.src = 'about:blank'
      window.clearTimeout(retry)
      window.clearTimeout(fallback)
      window.removeEventListener('message', handleMessage)
    }
  }, [count, forcedValues, requestId, sides])

  return (
    <div className="pointer-events-none absolute inset-0 z-[60]">
      <iframe
        ref={iframeRef}
        title={`${sides}-sided dice roller`}
        src={`/dice-box-frame.html?badge=0&sides=${iframeSides}`}
        className="dice-box-damage-frame dice-box-roll-flight"
        style={{ '--dice-fly-x': flyX, '--dice-fly-y': flyY } as CSSProperties}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}
