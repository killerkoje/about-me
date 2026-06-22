'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { CaseStudy } from '@/app/design-preview/data'
import { createBookPortraitTexture, INK, LIME } from './kokuyo-three-shared'
import { mouse } from './mouse-store'

const COVER_W = 0.48
const COVER_H = 0.98
const RADIUS = 0.95
const ANGLE_STEP = 0.55
const SHELF_W = 2.28
const SHELF_Y = -0.42
const VISIBLE_ARC = 2.05

function wrappedOffset(i: number, center: number, count: number) {
  let d = i - center
  const half = count / 2
  while (d > half) d -= count
  while (d < -half) d += count
  return d
}

function BookletMesh({
  project,
  projectIndex,
  frontProjectRef,
  smoothIndexRef,
  count,
  onSelect,
  disabled,
}: {
  project: CaseStudy
  projectIndex: number
  frontProjectRef: React.RefObject<number>
  smoothIndexRef: React.RefObject<number>
  count: number
  onSelect: () => void
  disabled: boolean
}) {
  const { gl } = useThree()
  const texture = useMemo(() => {
    const t = createBookPortraitTexture(project, projectIndex)
    t.anisotropy = gl.capabilities.getMaxAnisotropy()
    return t
  }, [project, projectIndex, gl])

  useEffect(() => () => texture.dispose(), [texture])

  const t = 0.014
  const down = useRef<{ x: number; y: number } | null>(null)

  const isFront = () => {
    const offset = wrappedOffset(projectIndex, smoothIndexRef.current, count)
    return Math.abs(offset) < 0.55
  }

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    down.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (disabled || !down.current) return
    const dx = e.clientX - down.current.x
    const dy = e.clientY - down.current.y
    down.current = null
    if (dx * dx + dy * dy > 100) return
    if (!isFront()) return
    frontProjectRef.current = projectIndex
    onSelect()
  }

  return (
    <group position={[0, COVER_H / 2 + SHELF_Y, 0]}>
      <mesh
        position={[0, 0, t / 2 + 0.0005]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={() => {
          if (isFront() && !disabled) document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
          down.current = null
        }}
      >
        <planeGeometry args={[COVER_W, COVER_H]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  )
}

type Props = {
  projects: CaseStudy[]
  floatIndex: number
  onSelect: (id: string) => void
  disabled?: boolean
}

export default function BookShelf({ projects, floatIndex, onSelect, disabled = false }: Props) {
  const rig = useRef<THREE.Group>(null)
  const bookRefs = useRef<(THREE.Group | null)[]>([])
  const smoothIndex = useRef(floatIndex)
  const spinVelocity = useRef(0)
  const frontProjectRef = useRef(0)
  const count = projects.length

  useFrame((_, delta) => {
    const dt = Number.isFinite(delta) ? Math.min(delta, 0.05) : 0.016
    const prev = smoothIndex.current
    smoothIndex.current = THREE.MathUtils.lerp(smoothIndex.current, floatIndex, dt * 18)
    spinVelocity.current = THREE.MathUtils.lerp(
      spinVelocity.current,
      (smoothIndex.current - prev) / Math.max(dt, 0.001),
      0.2,
    )

    let front = 0
    let minDist = Infinity
    for (let i = 0; i < count; i++) {
      const d = Math.abs(wrappedOffset(i, smoothIndex.current, count))
      if (d < minDist) {
        minDist = d
        front = i
      }
    }
    frontProjectRef.current = front

    const wobble = spinVelocity.current * 0.012

    if (rig.current) {
      rig.current.rotation.x = THREE.MathUtils.lerp(
        rig.current.rotation.x,
        mouse.y * 0.008 + wobble * 0.3,
        0.06,
      )
      rig.current.rotation.y = THREE.MathUtils.lerp(
        rig.current.rotation.y,
        mouse.x * 0.012 - wobble * 0.5,
        0.06,
      )
    }

    for (let i = 0; i < count; i++) {
      const g = bookRefs.current[i]
      if (!g) continue

      const offset = wrappedOffset(i, smoothIndex.current, count)
      const onArc = Math.abs(offset) <= VISIBLE_ARC

      g.visible = onArc
      if (!onArc) continue

      const a = offset * ANGLE_STEP
      const x = Math.sin(a) * RADIUS
      const z = Math.cos(a) * RADIUS * 0.32 - 0.06
      const dist = Math.abs(offset)
      const active = i === front
      const lift = active ? 0.1 : Math.max(0, 0.04 - dist * 0.015)
      const scale = active ? 1.1 : THREE.MathUtils.clamp(0.88 + (1 - Math.min(dist, 1.4)) * 0.08, 0.82, 0.96)
      const ry = -a * 0.95
      const rz = offset * 0.035 + wobble * offset * 0.08

      g.position.x = THREE.MathUtils.lerp(g.position.x, x, dt * 16)
      g.position.y = THREE.MathUtils.lerp(g.position.y, lift, dt * 16)
      g.position.z = THREE.MathUtils.lerp(g.position.z, z, dt * 16)
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, ry, dt * 16)
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, rz, dt * 12)
      const s = THREE.MathUtils.lerp(g.scale.x, scale, dt * 16)
      g.scale.set(s, s, s)
    }
  })

  return (
    <group ref={rig} position={[0.52, 0, 0]}>
      <mesh position={[0, SHELF_Y - 0.022, 0.02]}>
        <boxGeometry args={[SHELF_W, 0.045, 0.28]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <mesh position={[0, SHELF_Y + 0.008, 0.02]}>
        <boxGeometry args={[SHELF_W - 0.06, 0.022, 0.24]} />
        <meshBasicMaterial color={LIME} />
      </mesh>

      {projects.map((p, i) => (
        <group key={p.id} ref={(el) => { bookRefs.current[i] = el }}>
          <BookletMesh
            project={p}
            projectIndex={i}
            frontProjectRef={frontProjectRef}
            smoothIndexRef={smoothIndex}
            count={count}
            disabled={disabled}
            onSelect={() => onSelect(p.id)}
          />
        </group>
      ))}
    </group>
  )
}

export { COVER_W, COVER_H }
