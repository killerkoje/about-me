'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

const LIME = '#c8e64a'
const ORANGE = '#e8572a'
const INK = '#2a2a2a'

function createCurvedPage(width: number, height: number, segments: number, curl: number) {
  const geo = new THREE.PlaneGeometry(width, height, segments, 4)
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const t = (x + width / 2) / width
    pos.setZ(i, Math.pow(Math.sin(t * Math.PI), 1.4) * curl)
  }
  geo.computeVertexNormals()
  return geo
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const chars = text.split('')
  let line = ''
  let cy = y
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy)
      line = ch
      cy += lineH
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, cy)
}

function createPageTexture(title: string, subtitle: string, bg: string, ink: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 640
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 512, 640)
  ctx.strokeStyle = ink
  ctx.globalAlpha = 0.15
  ctx.lineWidth = 3
  ctx.strokeRect(48, 48, 416, 544)
  ctx.beginPath()
  ctx.arc(256, 280, 80, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = ink
  ctx.globalAlpha = 0.55
  ctx.font = '700 28px system-ui, sans-serif'
  ctx.fillText(subtitle.toUpperCase(), 56, 110)
  ctx.globalAlpha = 1
  ctx.font = '900 40px system-ui, sans-serif'
  wrapText(ctx, title, 56, 480, 400, 46)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Butterfly({ base, wing, speed, scale = 1 }: { base: [number, number, number]; wing: string; speed: number; scale?: number }) {
  const g = useRef<THREE.Group>(null)
  const lw = useRef<THREE.Mesh>(null)
  const rw = useRef<THREE.Mesh>(null)
  const path = useRef({ a: Math.random() * 6, r: 0.25 + Math.random() * 0.2 })

  useFrame((s) => {
    const t = s.clock.elapsedTime * speed
    path.current.a += 0.012 * speed
    if (g.current) {
      g.current.position.x = base[0] + Math.cos(path.current.a) * path.current.r
      g.current.position.y = base[1] + Math.sin(t * 2) * 0.12
      g.current.position.z = base[2] + Math.sin(path.current.a) * 0.15
    }
    const flap = Math.abs(Math.sin(t * 11)) * 0.65 + 0.15
    if (lw.current) lw.current.rotation.y = flap
    if (rw.current) rw.current.rotation.y = -flap
  })

  return (
    <group ref={g} position={base} scale={scale}>
      <mesh ref={lw} position={[-0.04, 0, 0]} rotation={[0, 0.3, 0.2]}>
        <planeGeometry args={[0.09, 0.07]} />
        <meshBasicMaterial color={wing} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rw} position={[0.04, 0, 0]} rotation={[0, -0.3, -0.2]}>
        <planeGeometry args={[0.09, 0.07]} />
        <meshBasicMaterial color={wing} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function ProjectBook({
  title,
  category,
  tagline,
  mouse,
  hovered,
}: {
  title: string
  category: string
  tagline: string
  mouse: { x: number; y: number }
  hovered: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const leftRef = useRef<THREE.Group>(null)
  const leftGeo = useMemo(() => createCurvedPage(2.4, 3, 28, 0.38), [])
  const rightGeo = useMemo(() => createCurvedPage(2.4, 3, 28, 0.38), [])
  const leftTex = useMemo(() => createPageTexture(tagline, category, LIME, INK), [tagline, category])
  const rightTex = useMemo(() => createPageTexture(title, 'Case Study', ORANGE, '#fff'), [title])
  const target = useRef({ x: 0, y: 0, lift: 0 })

  useEffect(() => () => { leftTex.dispose(); rightTex.dispose() }, [leftTex, rightTex])

  useFrame((s) => {
    target.current.x = THREE.MathUtils.lerp(target.current.x, mouse.x * 0.28, 0.05)
    target.current.y = THREE.MathUtils.lerp(target.current.y, mouse.y * 0.2, 0.05)
    target.current.lift = THREE.MathUtils.lerp(target.current.lift, hovered ? 1 : 0, 0.08)
    if (groupRef.current) {
      groupRef.current.rotation.y = target.current.x
      groupRef.current.rotation.x = 0.12 + target.current.y * 0.1
      groupRef.current.position.y = Math.sin(s.clock.elapsedTime * 0.7) * 0.05
    }
    if (leftRef.current) {
      leftRef.current.rotation.x = THREE.MathUtils.lerp(leftRef.current.rotation.x, -0.06 - target.current.lift * 0.5, 0.09)
    }
  })

  return (
    <group ref={groupRef} scale={0.88}>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[0.14, 3.05, 0.38]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <group ref={leftRef} position={[0, 0, 0.02]}>
        <group position={[-1.2, 0, 0]}>
          <mesh geometry={leftGeo} rotation={[0, Math.PI / 2, 0]}>
            <meshBasicMaterial map={leftTex} toneMapped={false} />
          </mesh>
        </group>
      </group>
      <group position={[0, 0, 0.02]}>
        <group position={[1.2, 0, 0]}>
          <mesh geometry={rightGeo} rotation={[0, -Math.PI / 2, 0]}>
            <meshBasicMaterial map={rightTex} toneMapped={false} />
          </mesh>
        </group>
      </group>
      <Butterfly base={[0.1, 1.6, 0.6]} wing="#f5c842" speed={1} scale={1.2} />
      <Butterfly base={[-0.4, 1.9, 0.4]} wing="#b07aff" speed={1.2} />
      <Butterfly base={[0.5, 1.4, 0.5]} wing={ORANGE} speed={0.85} scale={0.85} />
    </group>
  )
}

function Scene({
  title,
  category,
  tagline,
  mouse,
  hovered,
}: {
  title: string
  category: string
  tagline: string
  mouse: { x: number; y: number }
  hovered: boolean
}) {
  return (
    <>
      <ambientLight intensity={1} />
      <ProjectBook title={title} category={category} tagline={tagline} mouse={mouse} hovered={hovered} />
      <ContactShadows position={[0, -1.8, 0]} opacity={0.35} scale={10} blur={2.5} far={5} color="#2a2a2a" />
    </>
  )
}

type Props = {
  title: string
  category: string
  tagline: string
}

export default function CaseStudyHero3D({ title, category, tagline }: Props) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    setEnabled(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  if (!enabled) {
    return (
      <div className="h-[45vh] bg-[#dce8d5] flex items-center justify-center">
        <div className="flex gap-1">
          <div className="w-32 h-44 bg-[#c8e64a]" />
          <div className="w-32 h-44 bg-[#e8572a]" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative w-full h-[48vh] min-h-[360px]"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setMouse({
          x: ((e.clientX - r.left) / r.width - 0.5) * 2,
          y: -((e.clientY - r.top) / r.height - 0.5) * 2,
        })
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse({ x: 0, y: 0 }) }}
    >
      <Canvas camera={{ position: [0, 0.2, 6.8], fov: 40 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <Scene title={title} category={category} tagline={tagline} mouse={mouse} hovered={hovered} />
      </Canvas>
    </div>
  )
}
