/** 正二十面体几何：用于 CSS 3D D20 */

const PHI = (1 + Math.sqrt(5)) / 2

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface D20FaceLayout {
  number: number
  /** 面心相对骰心的位移 + 朝向（CSS transform 字符串，不含 translate -50%） */
  transform: string
  /** 将此法线旋至指向观察者 (+Z) 所需的欧拉角 */
  endRot: { x: number; y: number; z: number }
}

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / l, y: v.y / l, z: v.z / l }
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

/** 将法线 n 旋转至 (0,0,1) 的近似欧拉角（度） */
export function normalToEuler(n: Vec3): { x: number; y: number; z: number } {
  const nx = n.x
  const ny = n.y
  const nz = n.z
  const ry = (Math.atan2(nx, nz) * 180) / Math.PI
  const horiz = Math.hypot(nx, nz) || 1e-6
  const rx = (-Math.atan2(ny, horiz) * 180) / Math.PI
  return { x: rx, y: ry, z: 0 }
}

/** 标准 D20 对面之和为 21 的面编号（按面索引顺序） */
const D20_FACE_NUMBERS = [
  20, 2, 9, 13, 11, 18, 4, 7, 15, 6, 17, 8, 10, 19, 3, 16, 1, 14, 5, 12,
]

let cachedLayouts: D20FaceLayout[] | null = null

export function getD20FaceLayouts(radius = 42): D20FaceLayout[] {
  if (cachedLayouts) return cachedLayouts

  const s = radius / Math.sqrt(1 + PHI * PHI)
  const verts: Vec3[] = [
    { x: 0, y: s, z: s * PHI },
    { x: 0, y: -s, z: s * PHI },
    { x: 0, y: s, z: -s * PHI },
    { x: 0, y: -s, z: -s * PHI },
    { x: s, y: s * PHI, z: 0 },
    { x: -s, y: s * PHI, z: 0 },
    { x: s, y: -s * PHI, z: 0 },
    { x: -s, y: -s * PHI, z: 0 },
    { x: s * PHI, y: 0, z: s },
    { x: s * PHI, y: 0, z: -s },
    { x: -s * PHI, y: 0, z: s },
    { x: -s * PHI, y: 0, z: -s },
  ]

  const faceIdx = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ]

  const layouts: D20FaceLayout[] = []

  for (let fi = 0; fi < faceIdx.length; fi++) {
    const [i0, i1, i2] = faceIdx[fi]
    const v0 = verts[i0]
    const v1 = verts[i1]
    const v2 = verts[i2]
    const center = normalize({
      x: (v0.x + v1.x + v2.x) / 3,
      y: (v0.y + v1.y + v2.y) / 3,
      z: (v0.z + v1.z + v2.z) / 3,
    })
    const e1 = sub(v1, v0)
    const e2 = sub(v2, v0)
    let normal = normalize(cross(e1, e2))
    if (normal.x * center.x + normal.y * center.y + normal.z * center.z < 0) {
      normal = { x: -normal.x, y: -normal.y, z: -normal.z }
    }

    const e1n = normalize(e1)
    const angleY = (Math.atan2(normal.x, normal.z) * 180) / Math.PI
    const angleX = (-Math.atan2(normal.y, Math.hypot(normal.x, normal.z)) * 180) / Math.PI
    const spinZ = (Math.atan2(e1n.y, e1n.x) * 180) / Math.PI

    const dist = radius * 0.92
    const tx = center.x * dist
    const ty = center.y * dist
    const tz = center.z * dist

    layouts.push({
      number: D20_FACE_NUMBERS[fi],
      transform: `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, ${tz.toFixed(2)}px) rotateY(${angleY.toFixed(2)}deg) rotateX(${angleX.toFixed(2)}deg) rotateZ(${spinZ.toFixed(2)}deg)`,
      endRot: normalToEuler(normal),
    })
  }

  cachedLayouts = layouts
  return layouts
}

export function getD20EndRotation(value: number): { x: number; y: number; z: number } {
  const layouts = getD20FaceLayouts()
  const face = layouts.find((f) => f.number === value)
  return face?.endRot ?? { x: 0, y: 0, z: 0 }
}
