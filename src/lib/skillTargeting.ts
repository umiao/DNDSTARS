import type { BattleMap, Token } from '../store/maps'
import type { CombatSkill } from '../types/character'
import {
  cellDistance,
  cellKey,
  DND_FEET_PER_CELL,
  feetToMovementCells,
  pixelToCell,
  type GridCell,
} from './gridCombat'

export type AoeOrigin = 'self' | 'point'

export interface CircleAoeTargeting {
  shape: 'circle'
  origin: AoeOrigin
  radiusFeet: number
  placeRangeFeet?: number
}

export interface RectAoeTargeting {
  shape: 'rect'
  origin: 'point'
  widthFeet: number
  heightFeet: number
  placeRangeFeet?: number
}

export interface LineAoeTargeting {
  shape: 'line'
  origin: 'self'
  widthFeet: number
  lengthFeet: number
  /** 瞄准点相对施法者的最远距离（尺）；不设则不限制 */
  aimRangeFeet?: number
}

export type SkillAoeTargeting = CircleAoeTargeting | RectAoeTargeting | LineAoeTargeting

const CIRCLE_AOE: Record<string, CircleAoeTargeting> = {
  whirlwindKick: { shape: 'circle', origin: 'self', radiusFeet: 5 },
  aerialCombo: { shape: 'circle', origin: 'point', radiusFeet: 10, placeRangeFeet: 20 },
  spiralBlade: { shape: 'circle', origin: 'self', radiusFeet: 5 },
}

const RECT_AOE: Record<string, RectAoeTargeting> = {
  arrowStorm: { shape: 'rect', origin: 'point', widthFeet: 10, heightFeet: 15, placeRangeFeet: 90 },
}

const LINE_AOE: Record<string, LineAoeTargeting> = {
  focusShot: { shape: 'line', origin: 'self', widthFeet: 5, lengthFeet: 30 },
  windTraceShot: { shape: 'line', origin: 'self', widthFeet: 5, lengthFeet: 60 },
}

export function getSkillAoeTargeting(skill: CombatSkill): SkillAoeTargeting | null {
  if (!skill.skillTreeId) return null
  return (
    CIRCLE_AOE[skill.skillTreeId] ??
    RECT_AOE[skill.skillTreeId] ??
    LINE_AOE[skill.skillTreeId] ??
    null
  )
}

/** @deprecated 使用 getSkillAoeTargeting */
export function getCircleAoeTargeting(skill: CombatSkill): CircleAoeTargeting | null {
  const aoe = getSkillAoeTargeting(skill)
  return aoe?.shape === 'circle' ? aoe : null
}

export function feetToRadiusCells(feet: number): number {
  return feetToMovementCells(feet)
}

/** 尺数 → 占地格数（宽/高/长） */
export function feetToDimensionCells(feet: number): number {
  return Math.max(1, Math.round(feet / DND_FEET_PER_CELL))
}

/** 八向单位向量：从 from 指向 to */
export function lineDirection(from: GridCell, to: GridCell): { dc: number; dr: number } {
  const dc = to.col - from.col
  const dr = to.row - from.row
  if (dc === 0 && dr === 0) return { dc: 1, dr: 0 }
  return {
    dc: dc === 0 ? 0 : dc > 0 ? 1 : -1,
    dr: dr === 0 ? 0 : dr > 0 ? 1 : -1,
  }
}

function aimVector(from: GridCell, to: GridCell): { x: number; y: number } {
  const x = to.col - from.col
  const y = to.row - from.row
  const len = Math.hypot(x, y)
  if (len <= 0.0001) return { x: 1, y: 0 }
  return { x: x / len, y: y / len }
}

function project(points: { x: number; y: number }[], axis: { x: number; y: number }) {
  let min = Infinity
  let max = -Infinity
  for (const p of points) {
    const v = p.x * axis.x + p.y * axis.y
    min = Math.min(min, v)
    max = Math.max(max, v)
  }
  return { min, max }
}

function intervalsOverlap(a: { min: number; max: number }, b: { min: number; max: number }): boolean {
  return a.min <= b.max && b.min <= a.max
}

function cellCorners(cell: GridCell): { x: number; y: number }[] {
  const minX = cell.col - 0.5
  const maxX = cell.col + 0.5
  const minY = cell.row - 0.5
  const maxY = cell.row + 0.5
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ]
}

function orientedRectCorners(
  center: { x: number; y: number },
  dir: { x: number; y: number },
  widthCells: number,
  heightCells: number,
): { x: number; y: number }[] {
  const perp = { x: -dir.y, y: dir.x }
  const hx = heightCells / 2
  const hw = widthCells / 2
  return [
    { x: center.x - dir.x * hx + perp.x * hw, y: center.y - dir.y * hx + perp.y * hw },
    { x: center.x + dir.x * hx + perp.x * hw, y: center.y + dir.y * hx + perp.y * hw },
    { x: center.x + dir.x * hx - perp.x * hw, y: center.y + dir.y * hx - perp.y * hw },
    { x: center.x - dir.x * hx - perp.x * hw, y: center.y - dir.y * hx - perp.y * hw },
  ]
}

function polygonsTouch(a: { x: number; y: number }[], b: { x: number; y: number }[], axes: { x: number; y: number }[]): boolean {
  return axes.every((axis) => intervalsOverlap(project(a, axis), project(b, axis)))
}

function cellTouchesCircle(cell: GridCell, center: GridCell, radiusCells: number): boolean {
  const minX = cell.col - 0.5
  const maxX = cell.col + 0.5
  const minY = cell.row - 0.5
  const maxY = cell.row + 0.5
  const closestX = Math.max(minX, Math.min(center.col, maxX))
  const closestY = Math.max(minY, Math.min(center.row, maxY))
  return Math.hypot(closestX - center.col, closestY - center.row) <= radiusCells
}

function cellTouchesOrientedRect(
  cell: GridCell,
  center: { x: number; y: number },
  dir: { x: number; y: number },
  widthCells: number,
  heightCells: number,
): boolean {
  const rect = orientedRectCorners(center, dir, widthCells, heightCells)
  const square = cellCorners(cell)
  const perp = { x: -dir.y, y: dir.x }
  return polygonsTouch(rect, square, [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    dir,
    perp,
  ])
}

function uniqueCells(cells: GridCell[]): GridCell[] {
  const seen = new Set<string>()
  const out: GridCell[] = []
  for (const c of cells) {
    const k = cellKey(c)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(c)
  }
  return out
}

export function cellsInCircleRadius(center: GridCell, radiusFeet: number): GridCell[] {
  const r = Math.max(0, radiusFeet / DND_FEET_PER_CELL)
  const scan = Math.ceil(r + 1)
  const cells: GridCell[] = []
  for (let row = Math.floor(center.row - scan); row <= Math.ceil(center.row + scan); row++) {
    for (let col = Math.floor(center.col - scan); col <= Math.ceil(center.col + scan); col++) {
      if (cellTouchesCircle({ col, row }, center, r)) {
        cells.push({ col, row })
      }
    }
  }
  return cells
}

/**
 * 直线路径：从 origin 沿瞄准方向延伸 lengthFeet，宽度 widthFeet 覆盖所有方格。
 */
export function cellsInLine(
  origin: GridCell,
  aim: GridCell,
  widthFeet: number,
  lengthFeet: number,
): GridCell[] {
  const dir = aimVector(origin, aim)
  const lengthCells = lengthFeet / DND_FEET_PER_CELL
  const widthCells = widthFeet / DND_FEET_PER_CELL
  const scan = Math.ceil(lengthCells + widthCells + 1)
  const center = {
    x: origin.col + dir.x * lengthCells / 2,
    y: origin.row + dir.y * lengthCells / 2,
  }

  const cells: GridCell[] = []
  for (let row = origin.row - scan; row <= origin.row + scan; row++) {
    for (let col = origin.col - scan; col <= origin.col + scan; col++) {
      if (cellTouchesOrientedRect({ col, row }, center, dir, widthCells, lengthCells)) {
        cells.push({ col, row })
      }
    }
  }
  return uniqueCells(cells)
}

/**
 * 矩形区域：以 anchor 为中心，长边沿 caster→anchor 方向，覆盖 widthFeet × heightFeet 内所有方格。
 */
export function cellsInRect(
  anchor: GridCell,
  orientFrom: GridCell,
  widthFeet: number,
  heightFeet: number,
): GridCell[] {
  const dir = aimVector(orientFrom, anchor)
  const wCells = widthFeet / DND_FEET_PER_CELL
  const hCells = heightFeet / DND_FEET_PER_CELL
  const scan = Math.ceil(Math.max(wCells, hCells) + 1)

  const cells: GridCell[] = []
  for (let row = Math.floor(anchor.row - scan); row <= Math.ceil(anchor.row + scan); row++) {
    for (let col = Math.floor(anchor.col - scan); col <= Math.ceil(anchor.col + scan); col++) {
      if (cellTouchesOrientedRect({ col, row }, { x: anchor.col, y: anchor.row }, dir, wCells, hCells)) {
        cells.push({ col, row })
      }
    }
  }
  return uniqueCells(cells)
}

export function cellsForAoe(
  aoe: SkillAoeTargeting,
  casterCell: GridCell,
  anchorCell: GridCell,
): GridCell[] {
  switch (aoe.shape) {
    case 'circle': {
      const center = aoe.origin === 'self' ? casterCell : anchorCell
      return cellsInCircleRadius(center, aoe.radiusFeet)
    }
    case 'line':
      return cellsInLine(casterCell, anchorCell, aoe.widthFeet, aoe.lengthFeet)
    case 'rect':
      return cellsInRect(anchorCell, casterCell, aoe.widthFeet, aoe.heightFeet)
  }
}

export function canPlaceAoe(
  aoe: SkillAoeTargeting,
  casterCell: GridCell,
  anchorCell: GridCell,
): boolean {
  switch (aoe.shape) {
    case 'circle':
      if (aoe.origin === 'self') return true
      if (aoe.placeRangeFeet == null) return true
      return cellDistance(casterCell, anchorCell) <= feetToRadiusCells(aoe.placeRangeFeet)
    case 'line':
      if (aoe.aimRangeFeet == null) return true
      return cellDistance(casterCell, anchorCell) <= feetToRadiusCells(aoe.aimRangeFeet)
    case 'rect':
      if (aoe.placeRangeFeet == null) return true
      return cellDistance(casterCell, anchorCell) <= feetToRadiusCells(aoe.placeRangeFeet)
  }
}

/** @deprecated 使用 canPlaceAoe */
export function canPlaceCircleCenter(
  casterCell: GridCell,
  centerCell: GridCell,
  aoe: CircleAoeTargeting,
): boolean {
  return canPlaceAoe(aoe, casterCell, centerCell)
}

export function tokensInCells(map: BattleMap, tokens: Token[], cells: GridCell[]): Token[] {
  const set = new Set(cells.map(cellKey))
  return tokens.filter((t) => set.has(cellKey(pixelToCell(t.x, t.y, map))))
}

export function formatAoeHint(_skill: CombatSkill, aoe: SkillAoeTargeting): string {
  switch (aoe.shape) {
    case 'circle': {
      const r = `${aoe.radiusFeet} 尺`
      if (aoe.origin === 'self') return `以自身为圆心，${r} 圆形范围`
      const place = aoe.placeRangeFeet != null ? `在 ${aoe.placeRangeFeet} 尺内` : '在地图上'
      return `${place}选择圆心，${r} 圆形范围`
    }
    case 'line':
      return `从角色沿瞄准方向，${aoe.widthFeet}×${aoe.lengthFeet} 尺直线路径`
    case 'rect': {
      const place = aoe.placeRangeFeet != null ? `在 ${aoe.placeRangeFeet} 尺内` : '在地图上'
      return `${place}选择矩形中心，${aoe.widthFeet}×${aoe.heightFeet} 尺区域`
    }
  }
}

export function isSelfOriginCircleAoe(aoe: SkillAoeTargeting): boolean {
  return aoe.shape === 'circle' && aoe.origin === 'self'
}

export function aoeUsesMouseAim(aoe: SkillAoeTargeting): boolean {
  if (aoe.shape === 'line') return true
  if (aoe.shape === 'circle' && aoe.origin === 'point') return true
  if (aoe.shape === 'rect') return true
  return false
}

export function aoeConfirmHint(aoe: SkillAoeTargeting, valid: boolean): string {
  if (isSelfOriginCircleAoe(aoe)) return ' · 点击自身确认释放'
  if (!valid) {
    if (aoe.shape === 'line') return ' · 瞄准点超出距离'
    if (aoe.shape === 'rect') return ' · 矩形中心超出距离'
    return ' · 圆心超出距离'
  }
  return ' · 移动鼠标预览，点击确认'
}
