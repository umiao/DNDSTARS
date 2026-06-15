import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import Die20, { type Die20Placement } from './Die20'

export interface D20AttackRoll {
  value: number
  modifier: number
  ac: number
  hit: boolean
  isCrit?: boolean
  /** 闂伩鏃讹細鏁屾柟鏀诲嚮鍒ゅ畾锛泂ave锛氳眮鍏嶆瀹?*/
  kind?: 'attack' | 'dodge' | 'save'
  source?: 'dice-box'
}

export interface DiceRoll {
  values: number[]
  sides: number
  bonus: number
  total: number
  label: string
  formula?: string
  targetName: string
  diceBoxResolved?: boolean
  /** 鍛戒腑妫€瀹?d20锛堟皵鍠樼瓑锛?*/
  d20Roll?: D20AttackRoll
}

// 闈㈠竷灞€锛歠ront=1 back=6 right=2 left=5 top=3 bottom=4
const FACE_ROT: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
}

interface Placement {
  left: number
  top: number
  fx: string
  fy: string
  mx1: string
  my1: string
  mx2: string
  my2: string
  srx: string
  sry: string
  srz: string
  erx: string
  ery: string
  erz: string
  delay: number
}

function NumFace({ n, className, display }: { n: number; className: string; display?: number }) {
  return (
    <div className={`die3d__face ${className}`}>
      <span className="die3d__num">{display ?? n}</span>
    </div>
  )
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function formatRollBonus(bonus: number) {
  if (bonus > 0) return ` + ${bonus}`
  if (bonus < 0) return ` - ${Math.abs(bonus)}`
  return ''
}

function buildSpinPlacement(
  left: number,
  top: number,
  endRot: { x: number; y: number; z: number },
  delay: number,
): Placement {
  const fromLeft = Math.random() < 0.5
  const travelX = fromLeft ? rand(-330, -230) : rand(230, 330)
  const travelY = rand(-65, 50)
  const midX = travelX * rand(0.45, 0.58)
  const nearX = travelX * rand(0.12, 0.2)
  const midY = travelY * rand(0.42, 0.56)
  const nearY = travelY * rand(0.12, 0.22)
  const spinX = (Math.random() < 0.5 ? -1 : 1) * Math.floor(rand(3, 6)) * 360
  const spinY = (Math.random() < 0.5 ? -1 : 1) * Math.floor(rand(3, 6)) * 360
  const ez = rand(-12, 12)
  return {
    left,
    top,
    fx: `${travelX}px`,
    fy: `${travelY}px`,
    mx1: `${midX}px`,
    my1: `${midY}px`,
    mx2: `${nearX}px`,
    my2: `${nearY}px`,
    srx: `${endRot.x + spinX}deg`,
    sry: `${endRot.y + spinY}deg`,
    srz: `${endRot.z + (Math.random() < 0.5 ? -1 : 1) * 360}deg`,
    erx: `${endRot.x}deg`,
    ery: `${endRot.y}deg`,
    erz: `${endRot.z + ez}deg`,
    delay,
  }
}

function Die6({ place, value }: { place: Placement; value: number }) {
  const [rollingValue, setRollingValue] = useState(value)
  const [rolling, setRolling] = useState(true)

  useEffect(() => {
    const start = window.setTimeout(() => {
      setRolling(true)
      setRollingValue(value)
    }, 0)
    const interval = window.setInterval(() => {
      setRollingValue(1 + Math.floor(Math.random() * 6))
    }, 52)
    const settle = window.setTimeout(() => {
      window.clearInterval(interval)
      setRolling(false)
      setRollingValue(value)
    }, 920 + place.delay * 1000)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(interval)
      window.clearTimeout(settle)
    }
  }, [place.delay, value])

  const dieStyle: CSSProperties & Record<string, string> = {
    '--fx': place.fx,
    '--fy': place.fy,
    '--mx1': place.mx1,
    '--my1': place.my1,
    '--mx2': place.mx2,
    '--my2': place.my2,
    '--srx': place.srx,
    '--sry': place.sry,
    '--srz': place.srz,
    '--erx': place.erx,
    '--ery': place.ery,
    '--erz': place.erz,
    animationDelay: `${place.delay}s`,
  }
  const shadowStyle: CSSProperties & Record<string, string> = {
    '--fx': place.fx,
    '--mx1': place.mx1,
    '--mx2': place.mx2,
    animationDelay: `${place.delay}s`,
  }
  return (
    <div className="dice-scene absolute" style={{ left: `${place.left}%`, top: `${place.top}%` }}>
      <div className="die3d" style={dieStyle}>
        <NumFace n={1} className="face-front" display={rolling ? rollingValue : undefined} />
        <NumFace n={6} className="face-back" display={rolling ? rollingValue : undefined} />
        <NumFace n={2} className="face-right" display={rolling ? rollingValue : undefined} />
        <NumFace n={5} className="face-left" display={rolling ? rollingValue : undefined} />
        <NumFace n={3} className="face-top" display={rolling ? rollingValue : undefined} />
        <NumFace n={4} className="face-bottom" display={rolling ? rollingValue : undefined} />
      </div>
      <div className="die-shadow" style={shadowStyle} />
    </div>
  )
}

function PolyDie({ place, value, sides }: { place: Placement; value: number; sides: number }) {
  const dieStyle: CSSProperties & Record<string, string> = {
    '--fx': place.fx,
    '--fy': place.fy,
    '--mx1': place.mx1,
    '--my1': place.my1,
    '--mx2': place.mx2,
    '--my2': place.my2,
    '--srx': place.srx,
    '--sry': place.sry,
    '--srz': place.srz,
    '--erx': place.erx,
    '--ery': place.ery,
    '--erz': place.erz,
    animationDelay: `${place.delay}s`,
  }
  const shadowStyle: CSSProperties & Record<string, string> = {
    '--fx': place.fx,
    '--mx1': place.mx1,
    '--mx2': place.mx2,
    animationDelay: `${place.delay}s`,
  }
  const facets = Array.from({ length: sides === 8 ? 8 : 10 }, (_, i) => i)
  return (
    <div className="dice-scene absolute" style={{ left: `${place.left}%`, top: `${place.top}%` }}>
      <div className={`die-poly die-poly--d${sides}`} style={dieStyle}>
        <div className="die-poly__solid">
          {facets.map((i) => (
            <span
              key={i}
              className="die-poly__facet"
              style={{ '--i': i } as CSSProperties}
            />
          ))}
          <span className="die-poly__num">{value}</span>
        </div>
      </div>
      <div className="die-shadow" style={shadowStyle} />
    </div>
  )
}

function DamageDie({ place, value, sides }: { place: Placement; value: number; sides: number }) {
  if (sides === 6) return <Die6 place={place} value={value} />
  return <PolyDie place={place} value={value} sides={sides} />
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

function DiceBoxRollDice({
  count,
  sides,
  values,
  className,
  scale,
  onComplete,
}: {
  count: number
  sides: number
  values?: number[]
  className: string
  scale: number
  onComplete: () => void
}) {
  const rawId = useId()
  const requestId = useRef(`dice-${rawId}-${Date.now()}`).current
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const readyRef = useRef(false)
  const completedRef = useRef(false)
  const [settled, setSettled] = useState(false)
  const [flyX, flyY] = useMemo(
    () => FLY_OFFSETS[Math.floor(Math.random() * FLY_OFFSETS.length)],
    [],
  )

  useEffect(() => {
    completedRef.current = false
    setSettled(false)
    const startedAt = Date.now()
    const log = (stage: string, details?: Record<string, unknown>) => {
      console.info('[dice-roll-overlay]', {
        requestId,
        stage,
        elapsedMs: Date.now() - startedAt,
        count,
        sides,
        values,
        ...details,
      })
    }
    const completeOnce = () => {
      if (completedRef.current) return
      completedRef.current = true
      log('complete')
      if (iframeRef.current) iframeRef.current.src = 'about:blank'
      setSettled(true)
      onComplete()
    }
    const sendRoll = () => {
      log('send-roll')
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'roll-dice', requestId, qty: count, sides, values },
        window.location.origin,
      )
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; requestId?: string; stage?: string } | undefined
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
        log('result-message')
        completeOnce()
      }
    }
    window.addEventListener('message', handleMessage)
    const retry = window.setTimeout(() => {
      if (!readyRef.current) {
        log('ready-retry-send')
        sendRoll()
      }
    }, 900)
    const fallback = window.setTimeout(() => {
      log('fallback-timeout')
      completeOnce()
    }, 5200)
    return () => {
      if (iframeRef.current) iframeRef.current.src = 'about:blank'
      window.clearTimeout(retry)
      window.clearTimeout(fallback)
      window.removeEventListener('message', handleMessage)
    }
  }, [count, onComplete, requestId, sides, values])

  return (
    <iframe
      ref={iframeRef}
      title="Damage dice roller"
      src={`/dice-box-frame.html?scale=${scale}&seed=${encodeURIComponent(requestId)}`}
      className={`${className} dice-box-roll-flight${settled ? ' dice-box-roll-flight--settled' : ''}`}
      style={{ '--dice-fly-x': flyX, '--dice-fly-y': flyY } as CSSProperties}
      sandbox="allow-scripts allow-same-origin"
      allowTransparency
    />
  )
}

/** 鍏ㄥ睆瑕嗙洊锛氫激瀹抽 + d20 鍛戒腑妫€瀹氾紝缈绘粴鏁ｈ惤鍒板湴鍥句笂 */
export default function DiceRollOverlay({ roll, onDone }: { roll: DiceRoll; onDone: () => void }) {
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  const hasD20 = false
  const showDiceBoxD20 = false
  const damageCount = roll.values.length
  const useDiceBoxDamage = false
  const showLegacyDamageDice = false
  const diceBoxRollCount = (showDiceBoxD20 ? 1 : 0) + (useDiceBoxDamage ? 1 : 0)
  const [completedDiceBoxRolls, setCompletedDiceBoxRolls] = useState(0)

  useEffect(() => {
    setCompletedDiceBoxRolls(0)
  }, [roll])

  const { damagePlaces, d20Place } = useMemo(() => {
    const n = damageCount
    const cols = Math.min(Math.max(n, 1), 5)
    const rows = Math.ceil(Math.max(n, 1) / cols)
    const xMin = hasD20 ? 20 : 16
    const xMax = hasD20 ? 80 : 84
    const yMin = rows > 1 ? 28 : hasD20 ? 52 : 42
    const yMax = rows > 1 ? 66 : hasD20 ? 52 : 42

    const damage: Placement[] =
      n === 0
        ? []
        : roll.values.map((v, i) => {
            const r = Math.floor(i / cols)
            const c = i % cols
            const colsInRow = r === rows - 1 ? n - cols * (rows - 1) : cols
            const left = xMin + ((xMax - xMin) * (c + 0.5)) / colsInRow + rand(-3, 3)
            const top =
              rows > 1 ? yMin + ((yMax - yMin) * r) / (rows - 1) + rand(-3, 3) : yMin + rand(-3, 3)

            const face = roll.sides === 6 && v >= 1 && v <= 6 ? v : 1
            const target = FACE_ROT[face]
            const endRot = { x: target.x, y: target.y, z: 0 }
            return buildSpinPlacement(left, top, endRot, rand(0, 0.14) + (hasD20 ? 0.08 : 0))
          })

    let d20: Die20Placement | null = null
    if (hasD20 && roll.d20Roll) {
      d20 = buildSpinPlacement(
        50 + rand(-4, 4),
        damageCount > 0 ? 22 + rand(-3, 3) : 42 + rand(-3, 3),
        { x: 0, y: 0, z: rand(-10, 10) },
        0,
      )
    }

    return { damagePlaces: damage, d20Place: d20 }
  }, [roll, damageCount, hasD20])

  const showDamage = roll.values.some((v) => v > 0) && roll.total > 0
  const d20 = roll.d20Roll
  const revealResults = diceBoxRollCount === 0 || completedDiceBoxRolls >= diceBoxRollCount
  const handleDiceBoxComplete = useCallback(() => {
    setCompletedDiceBoxRolls((count) => Math.min(diceBoxRollCount, count + 1))
  }, [diceBoxRollCount])

  useEffect(() => {
    if (!revealResults) return
    const timer = window.setTimeout(() => onDoneRef.current(), 4000)
    return () => window.clearTimeout(timer)
  }, [revealResults, roll])

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {d20Place && roll.d20Roll && <Die20 place={d20Place} value={roll.d20Roll.value} />}

      {showDiceBoxD20 && (
        <DiceBoxRollDice
          count={1}
          sides={20}
          values={[roll.d20Roll!.value]}
          className="dice-box-roll-d20-frame"
          scale={5.8}
          onComplete={handleDiceBoxComplete}
        />
      )}

      {useDiceBoxDamage && (
        <DiceBoxRollDice
          count={damageCount}
          sides={roll.sides}
          values={roll.values}
          className="dice-box-damage-frame"
          scale={4.8}
          onComplete={handleDiceBoxComplete}
        />
      )}

      {showLegacyDamageDice &&
        !roll.diceBoxResolved &&
        !useDiceBoxDamage &&
        roll.values.length > 0 &&
        roll.values.map((value, i) => (
          <DamageDie
            key={i}
            place={damagePlaces[i] ?? damagePlaces[0]}
            value={value}
            sides={roll.sides}
          />
        ))}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-2xl border border-rose-400/40 bg-void-950/85 px-6 py-2 text-center shadow-2xl backdrop-blur-sm">
        <div className="text-xs text-slate-400">
          {roll.label} {'->'} {roll.targetName}
        </div>

        {d20 && revealResults && (
          <div
            className={[
              'mt-1 text-sm font-bold tabular-nums',
              d20.kind === 'dodge'
                ? d20.hit
                  ? 'text-rose-300'
                  : 'text-emerald-300'
                : d20.hit
                  ? d20.isCrit
                    ? 'text-amber-300'
                    : 'text-sky-300'
                  : 'text-slate-500',
            ].join(' ')}
          >
            d20: {d20.value} + {d20.modifier} = {d20.value + d20.modifier} vs AC {d20.ac}
            {d20.kind === 'dodge'
              ? d20.hit
                ? ' · 攻击命中'
                : ' · 攻击未中（闪避成功）'
              : d20.kind === 'save'
                ? d20.hit
                  ? ' · 豁免成功'
                  : ' · 豁免失败'
                : d20.isCrit
                  ? ' · 重击！'
                  : d20.hit
                    ? ' · 命中'
                    : ' · 未中'}
          </div>
        )}
        {showDamage && revealResults ? (
          <>
            <div className="text-[11px] text-slate-500">
              {roll.formula ?? `${roll.values.join(' + ')}${formatRollBonus(roll.bonus)} 总伤害`}
            </div>
            <div className="text-3xl font-black text-rose-300">{roll.total}</div>
          </>
        ) : d20 && revealResults && !d20.hit ? (
          <div className="mt-1 text-lg font-bold text-slate-500">
            {d20.kind === 'dodge' ? '闪避成功 · 未受伤害' : '未造成伤害'}
          </div>
        ) : null}
      </div>
    </div>
  )
}
