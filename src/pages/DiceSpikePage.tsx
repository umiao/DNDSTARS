// ============================================================================
// TEMPORARY — SPIKE PAGE (T-P2-395). Removal owned by T-P2-400 (cleanup task).
// This file + its /dice-spike route are the ONLY temporary artifacts of the
// spike. The @3d-dice/dice-box-threejs dependency and public/assets/dice-threejs/
// are PERMANENT (used by T-P2-396..398) and MUST NOT be deleted by cleanup.
//
// Purpose: de-risk the migration from @3d-dice/dice-box (Babylon, forcedValue →
// face≠number bug) to @3d-dice/dice-box-threejs (@ predetermined rolling, which
// physically relabels the up-face so visible face == reported value).
//
// Manual smoke matrix (operator runs each button, eyeballs the canvas):
//   AC1  1d20@20            → visible face 20, callback value 20
//   AC2  10× 1d20@<target>  → each: target == visible face == callback value
//   AC3  6d6@4,4,4,4,4,4    → all six dice stop on 4
//   AC4a 1d10@10            → face "0" shows, value reported as 10 (not 0)
//   AC4b 1d100@57           → KNOWN LIMITATION: lone d100 is a tens-digit die
//                             (faces 10..100), so @57 is NOT representable.
//   AC4c 1d100+1d10@50,7    → correct percentile pair (single @, comma list), 57
//   AC5  10× random 1d20    → callback==visible face; values not all identical
// ============================================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import DiceBox, { type DiceRollResults } from '@3d-dice/dice-box-threejs'

const ACCENT = '#7c3aed' // parity with existing Babylon themeColor

type LogRow = {
  id: number
  notation: string
  expected: string
  returned: string
  total: number
  match: 'pass' | 'fail' | 'n/a'
  note?: string
}

// Pull the integers after '@' as the per-die expected values.
function parseExpected(notation: string): number[] | null {
  const at = notation.split('@')[1]
  if (!at) return null
  const nums = at.match(/-?\d+/g)
  return nums ? nums.map((n) => parseInt(n, 10)) : null
}

function flattenValues(r: DiceRollResults): number[] {
  return r.sets.flatMap((s) => s.rolls.filter((d) => d.reason !== 'remove').map((d) => d.value))
}

// Order-insensitive multiset equality.
function multisetEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.every((v, i) => v === sb[i])
}

export default function DiceSpikePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<DiceBox | null>(null)
  const seqRef = useRef(0)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<LogRow[]>([])

  useEffect(() => {
    let disposed = false
    const el = containerRef.current
    if (!el) return
    void (async () => {
      try {
        const box = new DiceBox('#dice-spike-canvas', {
          assetPath: '/assets/dice-threejs/', // permanent location; texture:'none' fetches nothing
          theme_customColorset: {
            name: 'arcane-purple',
            foreground: '#f5f3ff',
            background: ACCENT,
            outline: '#3b0764',
            texture: 'none',
            material: 'glass',
          },
          theme_material: 'glass',
          baseScale: 100,
          gravity_multiplier: 400,
          light_intensity: 0.9,
          shadows: true,
          sounds: false,
        })
        await box.initialize?.()
        if (disposed) return
        boxRef.current = box
        setReady(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      disposed = true
    }
  }, [])

  // A single stable runner keyed by case. Inline onClick arrows below only *call*
  // this on click — they never read refs during render (react-hooks/refs).
  const run = useCallback(async (kind: string) => {
    const box = boxRef.current
    if (!box) return

    const rollOnce = async (notation: string, note?: string): Promise<DiceRollResults> => {
      const result = await box.roll(notation)
      const returned = flattenValues(result)
      const expected = parseExpected(notation)
      let match: LogRow['match'] = 'n/a'
      if (expected) match = multisetEqual(expected, returned) ? 'pass' : 'fail'
      seqRef.current += 1
      const row: LogRow = {
        id: seqRef.current,
        notation,
        expected: expected ? expected.join(',') : '(random)',
        returned: returned.join(','),
        total: result.total,
        match,
        note,
      }
      setRows((prev) => [row, ...prev])
      return result
    }

    switch (kind) {
      case 'ac1':
        await rollOnce('1d20@20', 'AC1: expect visible 20')
        break
      case 'ac2':
        for (const t of [1, 5, 7, 11, 13, 17, 19, 20, 3, 9]) {
          await rollOnce(`1d20@${t}`, 'AC2: forced sequence')
        }
        break
      case 'ac3':
        await rollOnce('6d6@4,4,4,4,4,4', 'AC3: all six = 4')
        break
      case 'ac4a':
        await rollOnce('1d10@10', 'AC4a: face 0 → value 10')
        break
      case 'ac4b':
        await rollOnce('1d100@57', 'AC4b: KNOWN limitation — lone d100 cannot show 57')
        break
      case 'ac4c':
        await rollOnce('1d100+1d10@50,7', 'AC4c: percentile pair (single @, comma values) → 57')
        break
      case 'ac5': {
        const vals: number[] = []
        for (let i = 0; i < 10; i++) {
          const r = await rollOnce('1d20', 'AC5: true random')
          vals.push(...flattenValues(r))
        }
        const distinct = new Set(vals).size
        seqRef.current += 1
        const summary: LogRow = {
          id: seqRef.current,
          notation: '— AC5 summary —',
          expected: '(random)',
          returned: `distinct=${distinct}/10`,
          total: 0,
          match: distinct > 1 ? 'pass' : 'fail',
          note: 'pass = not all identical',
        }
        setRows((prev) => [summary, ...prev])
        break
      }
    }
  }, [])

  const onRun = useCallback(
    (kind: string) => {
      if (busy || !ready) return
      setBusy(true)
      setError(null)
      run(kind)
        .catch((e) => setError(e instanceof Error ? e.message : String(e)))
        .finally(() => setBusy(false))
    },
    [busy, ready, run],
  )

  const btn =
    'rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="relative h-full w-full">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-arcane-200">Dice Engine Spike — dice-box-threejs (TEMPORARY)</h1>
        <p className="text-sm text-slate-400">
          T-P2-395 · 验证 <code>@</code> 翻面重贴(可见面 == 上报值)· accent {ACCENT} · 移除归 T-P2-400
        </p>
        {!ready && !error && <p className="text-amber-400">初始化引擎中…</p>}
        {error && <p className="text-red-400">错误: {error}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button disabled={!ready || busy} onClick={() => onRun('ac1')} className={btn} style={{ background: ACCENT }}>
          AC1 · 1d20@20
        </button>
        <button disabled={!ready || busy} onClick={() => onRun('ac2')} className={btn} style={{ background: ACCENT }}>
          AC2 · 连掷10次强制
        </button>
        <button disabled={!ready || busy} onClick={() => onRun('ac3')} className={btn} style={{ background: ACCENT }}>
          AC3 · 6d6@4×6
        </button>
        <button disabled={!ready || busy} onClick={() => onRun('ac4a')} className={btn} style={{ background: ACCENT }}>
          AC4a · 1d10@10
        </button>
        <button disabled={!ready || busy} onClick={() => onRun('ac4b')} className={btn} style={{ background: '#b45309' }}>
          AC4b · 1d100@57 (限制)
        </button>
        <button disabled={!ready || busy} onClick={() => onRun('ac4c')} className={btn} style={{ background: ACCENT }}>
          AC4c · d100+d10 → 57
        </button>
        <button disabled={!ready || busy} onClick={() => onRun('ac5')} className={btn} style={{ background: ACCENT }}>
          AC5 · 随机10次
        </button>
      </div>

      <div
        id="dice-spike-canvas"
        ref={containerRef}
        className="my-4 rounded-xl border border-arcane-500/30"
        style={{ width: '100%', height: '460px', background: 'rgba(11,26,62,0.6)' }}
      />

      <div className="max-h-64 overflow-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-800 text-slate-300">
            <tr>
              <th className="px-2 py-1">#</th>
              <th className="px-2 py-1">notation</th>
              <th className="px-2 py-1">expected</th>
              <th className="px-2 py-1">returned</th>
              <th className="px-2 py-1">total</th>
              <th className="px-2 py-1">target==value</th>
              <th className="px-2 py-1">note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-700/50">
                <td className="px-2 py-1 text-slate-500">{r.id}</td>
                <td className="px-2 py-1 font-mono">{r.notation}</td>
                <td className="px-2 py-1 font-mono">{r.expected}</td>
                <td className="px-2 py-1 font-mono">{r.returned}</td>
                <td className="px-2 py-1 font-mono">{r.total}</td>
                <td
                  className="px-2 py-1 font-semibold"
                  style={{ color: r.match === 'pass' ? '#34d399' : r.match === 'fail' ? '#f87171' : '#94a3b8' }}
                >
                  {r.match}
                </td>
                <td className="px-2 py-1 text-slate-400">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
