import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import * as CANNON from 'cannon-es'
import * as THREE from 'three'

export interface Die20Placement {
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

const D20_FACE_ORDER = [20, 2, 14, 4, 8, 18, 6, 10, 12, 19, 3, 17, 7, 13, 1, 11, 5, 15, 9, 16]
const D20_RADIUS = 1.46
const D20_REST_Y = 1.28

function makeFaceTexture(label: number, tint: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return undefined

  ctx.clearRect(0, 0, 256, 256)
  ctx.beginPath()
  ctx.moveTo(128, 18)
  ctx.lineTo(236, 226)
  ctx.lineTo(20, 226)
  ctx.closePath()
  const grad = ctx.createLinearGradient(64, 22, 210, 236)
  grad.addColorStop(0, '#d8b4fe')
  grad.addColorStop(0.4, tint)
  grad.addColorStop(1, '#4c1d95')
  ctx.fillStyle = grad
  ctx.fill()

  ctx.lineJoin = 'round'
  ctx.lineWidth = 14
  ctx.strokeStyle = '#2e1065'
  ctx.stroke()
  ctx.lineWidth = 5
  ctx.strokeStyle = 'rgba(237, 233, 254, 0.72)'
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(128, 40)
  ctx.lineTo(214, 214)
  ctx.lineTo(42, 214)
  ctx.closePath()
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.stroke()

  ctx.save()
  ctx.translate(128, 150)
  ctx.rotate(-0.04)
  ctx.fillStyle = '#f8fafc'
  ctx.strokeStyle = 'rgba(30, 16, 51, 0.88)'
  ctx.lineWidth = 8
  ctx.font = `900 ${label >= 10 ? 74 : 88}px Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
  ctx.shadowBlur = 5
  ctx.shadowOffsetY = 3
  ctx.strokeText(String(label), 0, 0)
  ctx.fillText(String(label), 0, 0)
  ctx.restore()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

function makeCannonConvexFromGeometry(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute('position')
  const vertices: CANNON.Vec3[] = []
  const vertexMap = new Map<string, number>()
  const faces: number[][] = []

  const getVertexIndex = (i: number) => {
    const x = Number(position.getX(i).toFixed(5))
    const y = Number(position.getY(i).toFixed(5))
    const z = Number(position.getZ(i).toFixed(5))
    const key = `${x},${y},${z}`
    const existing = vertexMap.get(key)
    if (existing != null) return existing
    const next = vertices.length
    vertices.push(new CANNON.Vec3(x, y, z))
    vertexMap.set(key, next)
    return next
  }

  for (let i = 0; i < position.count; i += 3) {
    faces.push([getVertexIndex(i), getVertexIndex(i + 1), getVertexIndex(i + 2)])
  }

  return new CANNON.ConvexPolyhedron({ vertices, faces })
}

export default function Die20({ place, value }: { place: Die20Placement; value: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = 260
    const height = 170
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100)
    camera.position.set(0, 4.8, 7.2)
    camera.lookAt(0, 0.46, 0)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    mount.replaceChildren(renderer.domElement)

    const geometry = new THREE.IcosahedronGeometry(D20_RADIUS, 0).toNonIndexed()
    geometry.clearGroups()
    for (let i = 0; i < 20; i += 1) geometry.addGroup(i * 3, 3, i)

    const uv: number[] = []
    for (let i = 0; i < 20; i += 1) {
      uv.push(0.5, 0.94, 0.08, 0.08, 0.92, 0.08)
    }
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))

    const position = geometry.getAttribute('position')
    const faceNormals = Array.from({ length: 20 }, (_, i) => {
      const a = new THREE.Vector3().fromBufferAttribute(position, i * 3)
      const b = new THREE.Vector3().fromBufferAttribute(position, i * 3 + 1)
      const c = new THREE.Vector3().fromBufferAttribute(position, i * 3 + 2)
      return new THREE.Vector3()
        .subVectors(b, a)
        .cross(new THREE.Vector3().subVectors(c, a))
        .normalize()
    })

    const faceNumbers = [value, ...D20_FACE_ORDER.filter((n) => n !== value)]
    const labelTextures = new Map(
      D20_FACE_ORDER.map((n, i) => [n, makeFaceTexture(n, i % 3 === 0 ? '#a855f7' : '#7c3aed')]),
    )
    const materials = faceNumbers.map(
      (label) =>
        new THREE.MeshStandardMaterial({
          map: labelTextures.get(label),
          color: 0xffffff,
          roughness: 0.5,
          metalness: 0.08,
          flatShading: true,
          emissive: 0x23003d,
          emissiveIntensity: 0.05,
        }),
    )
    const die = new THREE.Mesh(geometry, materials)
    scene.add(die)

    const finalQuaternion = new THREE.Quaternion().setFromUnitVectors(
      faceNormals[0],
      new THREE.Vector3(0, 0.56, 0.83).normalize(),
    )
    finalQuaternion.premultiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0.56, 0.83).normalize(), 0.78),
    )

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x2b0b47, transparent: true, opacity: 0.95 }),
    )
    die.add(edges)

    scene.add(new THREE.AmbientLight(0xffffff, 1.9))
    const key = new THREE.DirectionalLight(0xffffff, 2.1)
    key.position.set(-2.5, 3.5, 5)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xb993ff, 1.1)
    rim.position.set(3, -1, 4)
    scene.add(rim)

    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    })
    world.allowSleep = true
    ;(world.solver as CANNON.GSSolver).iterations = 12

    const groundMaterial = new CANNON.Material('map')
    const diceMaterial = new CANNON.Material('dice')
    world.addContactMaterial(
      new CANNON.ContactMaterial(groundMaterial, diceMaterial, {
        friction: 0.88,
        restitution: 0.2,
      }),
    )

    const ground = new CANNON.Body({
      mass: 0,
      material: groundMaterial,
      shape: new CANNON.Plane(),
    })
    ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(ground)

    const shape = makeCannonConvexFromGeometry(geometry)
    const body = new CANNON.Body({
      mass: 1.1,
      material: diceMaterial,
      shape,
      angularDamping: 0.2,
      linearDamping: 0.24,
      sleepSpeedLimit: 0.12,
      sleepTimeLimit: 0.2,
    })
    const startFromLeft = Number.parseFloat(place.fx) < 0
    const direction = startFromLeft ? 1 : -1
    const startX = startFromLeft ? -3.5 : 3.5
    const velocityX = direction * 10.2
    const rollOmega = Math.abs(velocityX) / D20_RADIUS
    body.position.set(startX, D20_REST_Y + 0.62, 0)
    body.velocity.set(velocityX, -1.25, direction * 0.26)
    body.angularVelocity.set(direction * 1.8, direction * 2.2, -direction * rollOmega * 1.45)
    world.addBody(body)
    die.position.set(body.position.x, body.position.y - D20_REST_Y + 0.45, body.position.z)
    die.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w)

    let frame = 0
    let animationId = 0
    const start = performance.now() + place.delay * 1000
    const duration = 920
    let last = start
    const physicsQuaternion = new THREE.Quaternion()

    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration))
      const dt = Math.min(1 / 30, Math.max(1 / 120, (now - last) / 1000))
      last = now

      if (now < start) {
        renderer.render(scene, camera)
      } else if (t < 1) {
        const rollingResistance = t < 0.44 ? 0.58 : t < 0.72 ? 1.6 : 4.8
        body.force.x += -body.velocity.x * rollingResistance
        body.force.z += -body.velocity.z * rollingResistance
        world.step(1 / 60, dt, 3)
        die.position.set(body.position.x, body.position.y - D20_REST_Y + 0.45, body.position.z)
        physicsQuaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w)
        if (t > 0.64) {
          const settle = Math.min(1, (t - 0.64) / 0.36)
          const easedSettle = 1 - Math.pow(1 - settle, 3)
          die.quaternion.slerpQuaternions(physicsQuaternion, finalQuaternion, easedSettle)
        } else {
          die.quaternion.copy(physicsQuaternion)
        }
      } else {
        body.velocity.set(0, 0, 0)
        body.angularVelocity.set(0, 0, 0)
        die.quaternion.copy(finalQuaternion)
      }

      renderer.render(scene, camera)
      frame += 1
      if (t < 1 || frame < 2) animationId = requestAnimationFrame(tick)
    }

    animationId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animationId)
      geometry.dispose()
      materials.forEach((material) => material.dispose())
      labelTextures.forEach((texture) => texture?.dispose())
      edges.geometry.dispose()
      ;(edges.material as THREE.Material).dispose()
      world.removeBody(body)
      world.removeBody(ground)
      renderer.dispose()
      mount.replaceChildren()
    }
  }, [place.delay, place.fx, value])

  const dieStyle: CSSProperties & Record<string, string> = {
    animationDelay: `${place.delay}s`,
  }
  const shadowStyle: CSSProperties & Record<string, string> = {
    '--fx': place.fx,
    '--mx1': place.mx1,
    '--mx2': place.mx2,
    animationDelay: `${place.delay}s`,
  }

  return (
    <div
      className="dice-scene dice-scene--d20 absolute"
      style={{ left: `${place.left}%`, top: `${place.top}%` }}
    >
      <div className="die20 die20--webgl" style={dieStyle}>
        <div className="die20__canvas" ref={mountRef} />
      </div>
      <div className="die-shadow die-shadow--d20" style={shadowStyle} />
    </div>
  )
}
