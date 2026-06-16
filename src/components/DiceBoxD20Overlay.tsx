import { useEffect, useId, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'

const MIN_VISIBLE_ROLL_MS = 2200

interface DiceBoxD20OverlayProps {
  active?: boolean
  label: string
  targetName: string
  visualOnly?: boolean
  value?: number
  requestId?: string
  flyIndex?: number
  onComplete: (value: number) => void
}

function clampD20(value: unknown): number {
  const rounded = Math.round(Number(value))
  if (!Number.isFinite(rounded)) return 1 + Math.floor(Math.random() * 20)
  return Math.max(1, Math.min(20, rounded))
}

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

function stableIndex(seed: string, length: number) {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % Math.max(1, length)
}

export default function DiceBoxD20Overlay({
  active = true,
  label: _label,
  targetName: _targetName,
  visualOnly = false,
  value,
  requestId: forcedRequestId,
  flyIndex,
  onComplete,
}: DiceBoxD20OverlayProps) {
  void _label
  void _targetName
  void visualOnly
  const rawId = useId()
  const generatedRequestId = `d20-${rawId}`
  const requestId = forcedRequestId ?? generatedRequestId
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const completedRef = useRef(false)
  const readyRef = useRef(false)
  const sentRequestRef = useRef<string | null>(null)
  const onCompleteRef = useRef(onComplete)
  const [flyX, flyY] = useMemo(
    () => FLY_OFFSETS[flyIndex == null ? stableIndex(requestId, FLY_OFFSETS.length) : Math.abs(Math.round(flyIndex)) % FLY_OFFSETS.length],
    [flyIndex, requestId],
  )

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!active) return
    completedRef.current = false
    const startedAt = Date.now()
    let cancelled = false
    const log = (stage: string, details?: Record<string, unknown>) => {
      console.info('[dice-box-d20-overlay]', {
        requestId,
        stage,
        elapsedMs: Date.now() - startedAt,
        forcedValue: value,
        ...details,
      })
    }
    const finish = (value: unknown) => {
      if (cancelled || completedRef.current) return
      completedRef.current = true
      const finalValue = clampD20(value)
      log('finish', { finalValue })
      const delay = Math.max(0, MIN_VISIBLE_ROLL_MS - (Date.now() - startedAt))
      window.setTimeout(() => {
        if (!cancelled) {
          onCompleteRef.current(finalValue)
        }
      }, delay)
    }
    const sendRoll = () => {
      if (sentRequestRef.current === requestId) return
      sentRequestRef.current = requestId
      log('send-roll')
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'roll-d20', requestId, value },
        window.location.origin,
      )
    }
    const timeout = window.setTimeout(() => {
      console.warn('DiceBox iframe D20 roll timed out; using fallback D20 roll')
      finish(value ?? 1 + Math.floor(Math.random() * 20))
    }, 22000)

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as {
        type?: string
        requestId?: string
        value?: unknown
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
      if (data?.type !== 'dice-box-d20-result' || data.requestId !== requestId) return
      log('result-message', { value: data.value })
      finish(value ?? data.value)
    }

    window.addEventListener('message', handleMessage)
    if (readyRef.current) {
      window.setTimeout(sendRoll, 0)
    }
    const retry = window.setTimeout(() => {
      if (!readyRef.current) {
        log('ready-retry-send')
        sendRoll()
      }
    }, 900)

    return () => {
      cancelled = true
      if (!completedRef.current && sentRequestRef.current === requestId) sentRequestRef.current = null
      window.clearTimeout(timeout)
      window.clearTimeout(retry)
      window.removeEventListener('message', handleMessage)
    }
  }, [active, requestId, value])

  return (
    <div className={`pointer-events-none absolute inset-0 z-[60] ${active ? '' : 'dice-box-d20-stage--idle'}`}>
      <iframe
        ref={iframeRef}
        title="D20 dice roller"
        src="/dice-box-frame.html?badge=0"
        className="dice-box-d20-frame"
        style={{ '--dice-fly-x': flyX, '--dice-fly-y': flyY } as CSSProperties}
        sandbox="allow-scripts allow-same-origin"
        allowTransparency
      />
    </div>
  )
}
