'use client'

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import type { CaseStudy } from '@/app/design-preview/data'

const LIME = '#c8e64a'
const ORANGE = '#e8572a'
const YELLOW = '#f5c842'
const INK = '#2a2a2a'

const PALETTE = [
  { bg: LIME, ink: INK },
  { bg: ORANGE, ink: '#ffffff' },
  { bg: YELLOW, ink: INK },
  { bg: LIME, ink: INK },
]

type CardPose = { x: number; y: number; z: number; rotY: number; rotZ: number }

const FAN: CardPose[] = [
  { x: -1.35, y: 0.08, z: 0, rotY: 0.32, rotZ: -0.28 },
  { x: -0.45, y: -0.04, z: 0.15, rotY: 0.14, rotZ: -0.1 },
  { x: 0.45, y: -0.04, z: 0.3, rotY: -0.14, rotZ: 0.1 },
  { x: 1.35, y: 0.08, z: 0.45, rotY: -0.32, rotZ: 0.28 },
]

const FAN_SPREAD: CardPose[] = [
  { x: -2.55, y: 0, z: 0.15, rotY: 0.78, rotZ: -0.12 },
  { x: -0.85, y: -0.06, z: 0.35, rotY: 0.26, rotZ: -0.04 },
  { x: 0.85, y: -0.06, z: 0.55, rotY: -0.26, rotZ: 0.04 },
  { x: 2.55, y: 0, z: 0.75, rotY: -0.78, rotZ: 0.12 },
]

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split('')
  let line = ''
  let cy = y
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i]
    if (ctx.measureText(test).width > maxW && line.length > 0) {
      ctx.fillText(line, x, cy)
      line = words[i]
      cy += lineH
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, cy)
}

function drawDoodle(ctx: CanvasRenderingContext2D, variant: number, ink: string, w: number, h: number) {
  ctx.strokeStyle = ink
  ctx.lineWidth = 4
  ctx.lineCap = 'round'

  if (variant === 0) {
    ctx.strokeRect(w * 0.25, h * 0.18, w * 0.5, h * 0.22)
    ctx.beginPath(); ctx.moveTo(w * 0.32, h * 0.28); ctx.lineTo(w * 0.68, h * 0.28); ctx.stroke()
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.58, w * 0.1, 0, Math.PI * 2); ctx.stroke()
  } else if (variant === 1) {
    ctx.strokeRect(w * 0.18, h * 0.2, w * 0.64, h * 0.32)
    ctx.strokeRect(w * 0.25, h * 0.38, w * 0.2, h * 0.14)
    ctx.strokeRect(w * 0.55, h * 0.38, w * 0.2, h * 0.14)
  } else if (variant === 2) {
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.32, w * 0.14, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeRect(w * 0.32, h * 0.52, w * 0.36, h * 0.18)
  } else {
    ctx.strokeRect(w * 0.24, h * 0.2, w * 0.52, h * 0.42)
    ctx.beginPath(); ctx.moveTo(w * 0.24, h * 0.32); ctx.lineTo(w * 0.76, h * 0.32); ctx.stroke()
    ctx.strokeRect(w * 0.32, h * 0.4, w * 0.14, h * 0.18)
    ctx.strokeRect(w * 0.54, h * 0.4, w * 0.14, h * 0.18)
  }
}

function createCardTexture(project: CaseStudy, index: number) {
  const palette = PALETTE[index]
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 720
  const ctx = canvas.getContext('2d')!
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = palette.bg
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.globalAlpha = 0.28
  drawDoodle(ctx, index, palette.ink, w, h)
  ctx.restore()

  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 3
  ctx.strokeRect(36, 36, w - 72, h - 72)

  ctx.fillStyle = palette.ink
  ctx.globalAlpha = 0.45
  ctx.font = '900 52px system-ui, sans-serif'
  ctx.fillText(String(index + 1).padStart(2, '0'), 48, 96)
  ctx.globalAlpha = 1

  ctx.font = '700 26px system-ui, sans-serif'
  ctx.globalAlpha = 0.55
  ctx.fillText(project.category.toUpperCase(), 48, h - 130)
  ctx.globalAlpha = 1

  ctx.font = '900 38px system-ui, sans-serif'
  wrapText(ctx, project.title, 48, h - 88, w - 96, 44)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function CardMesh({
  project,
  index,
  spread,
  active,
  onHover,
  onNavigate,
}: {
  project: CaseStudy
  index: number
  spread: boolean
  active: boolean
  onHover: (i: number | null) => void
  onNavigate: (id: string) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const texture = useMemo(() => createCardTexture(project, index), [project, index])

  useEffect(() => () => texture.dispose(), [texture])

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const pose = spread ? FAN_SPREAD[index] : FAN[index]
    const lift = active ? 0.38 : 0
    g.position.x = THREE.MathUtils.lerp(g.position.x, pose.x, 0.09)
    g.position.y = THREE.MathUtils.lerp(g.position.y, pose.y, 0.09)
    g.position.z = THREE.MathUtils.lerp(g.position.z, pose.z + lift, 0.09)
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, pose.rotY, 0.09)
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, pose.rotZ, 0.09)
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, active ? -0.06 : 0, 0.09)
  })

  const depth = 0.065
  const cw = 1.14
  const ch = 1.62

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onNavigate(project.id)
  }

  return (
    <group ref={groupRef}>
      {/* 앞면 */}
      <mesh
        position={[0, 0, depth / 2 + 0.002]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          onHover(index)
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
          onHover(null)
        }}
      >
        <planeGeometry args={[cw, ch]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* 뒷면 */}
      <mesh position={[0, 0, -depth / 2]}>
        <planeGeometry args={[cw, ch]} />
        <meshBasicMaterial color="#141414" />
      </mesh>

      {/* spine + 모서리 두께 */}
      <mesh position={[-cw / 2 - depth / 2, 0, 0]}>
        <boxGeometry args={[depth, ch, depth]} />
        <meshBasicMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0, ch / 2, 0]}>
        <boxGeometry args={[cw, depth, depth]} />
        <meshBasicMaterial color="#222" />
      </mesh>
      <mesh position={[0, -ch / 2, 0]}>
        <boxGeometry args={[cw, depth, depth]} />
        <meshBasicMaterial color="#222" />
      </mesh>
      <mesh position={[cw / 2, 0, 0]}>
        <boxGeometry args={[depth, ch, depth]} />
        <meshBasicMaterial color="#222" />
      </mesh>
    </group>
  )
}

function CardsScene({
  projects,
  mouse,
  spread,
  activeIndex,
  onHover,
  onNavigate,
}: {
  projects: CaseStudy[]
  mouse: { x: number; y: number }
  spread: boolean
  activeIndex: number | null
  onHover: (i: number | null) => void
  onNavigate: (id: string) => void
}) {
  const rigRef = useRef<THREE.Group>(null)
  const target = useRef({ x: 0, y: 0 })

  useFrame(() => {
    target.current.x = THREE.MathUtils.lerp(target.current.x, mouse.x * 0.22, 0.06)
    target.current.y = THREE.MathUtils.lerp(target.current.y, mouse.y * 0.16, 0.06)
    if (rigRef.current) {
      rigRef.current.rotation.y = target.current.x
      rigRef.current.rotation.x = target.current.y
    }
  })

  return (
    <>
      <ambientLight intensity={1} />
      <group ref={rigRef}>
        {projects.slice(0, 4).map((p, i) => (
          <CardMesh
            key={p.id}
            project={p}
            index={i}
            spread={spread}
            active={activeIndex === i}
            onHover={onHover}
            onNavigate={onNavigate}
          />
        ))}
      </group>
      <ContactShadows
        position={[0, -1.05, 0]}
        opacity={0.4}
        scale={9}
        blur={2.8}
        far={4}
        color="#2a2a2a"
      />
    </>
  )
}

type Props = {
  projects: CaseStudy[]
}

export default function FloatingFanCards({ projects }: Props) {
  const router = useRouter()
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [spread, setSpread] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    setEnabled(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const handleMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
    })
  }, [])

  const handleNavigate = useCallback(
    (id: string) => router.push(`/design-preview/${id}`),
    [router],
  )

  if (!enabled) {
    return (
      <div className="flex gap-3 justify-center my-6">
        {projects.slice(0, 4).map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleNavigate(p.id)}
            className="w-24 h-32 rounded-xl font-black text-xs p-2 text-left"
            style={{ backgroundColor: PALETTE[i].bg, color: PALETTE[i].ink }}
          >
            {p.title}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="relative w-full my-6">
      <p className="text-center text-[10px] font-bold tracking-[0.25em] text-gray-600 uppercase mb-3">
        Selected Work — hover to spread · click to open
      </p>

      <div
        className="relative h-64 sm:h-72 w-full max-w-3xl mx-auto cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setSpread(true)}
        onMouseMove={handleMove}
        onMouseLeave={() => {
          setSpread(false)
          setActiveIndex(null)
          setMouse({ x: 0, y: 0 })
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 42 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent' }}
        >
          <CardsScene
            projects={projects}
            mouse={mouse}
            spread={spread}
            activeIndex={activeIndex}
            onHover={setActiveIndex}
            onNavigate={handleNavigate}
          />
        </Canvas>
      </div>
    </div>
  )
}
