'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

const COLORS = ['#c8e64a', '#e8572a', '#f5c842']
const INK = '#2a2a2a'

function createMockupTexture(label: string, index: number, bg: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 700
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 400, 700)
  ctx.strokeStyle = INK
  ctx.globalAlpha = 0.12
  ctx.lineWidth = 4
  for (let i = 0; i < 6; i++) {
    ctx.strokeRect(40 + i * 4, 80 + i * 30, 320 - i * 8, 120)
  }
  ctx.globalAlpha = 0.2
  ctx.beginPath()
  ctx.arc(200, 320, 60, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = INK
  ctx.font = '900 36px system-ui'
  ctx.fillText(String(index + 1).padStart(2, '0'), 48, 90)
  ctx.font = '700 22px system-ui'
  ctx.globalAlpha = 0.7
  ctx.fillText('FINAL DESIGN', 48, 620)
  ctx.globalAlpha = 1
  ctx.font = '900 28px system-ui'
  const words = label.split(' ')
  let y = 560
  for (const w of words) {
    ctx.fillText(w, 48, y)
    y += 34
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function MockupPanel({
  index,
  label,
  mouse,
  spread,
}: {
  index: number
  label: string
  mouse: { x: number; y: number }
  spread: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const bg = COLORS[index % COLORS.length]
  const texture = useMemo(() => createMockupTexture(label, index, bg), [label, index, bg])

  useEffect(() => () => texture.dispose(), [texture])

  const baseX = (index - 1) * 1.35
  const baseRotY = (index - 1) * -0.22

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const xTarget = spread ? baseX * 1.15 : baseX
    const zTarget = spread ? 0.35 + index * 0.08 : index * 0.05
    const rotYTarget = baseRotY + mouse.x * 0.12
    g.position.x = THREE.MathUtils.lerp(g.position.x, xTarget, 0.08)
    g.position.z = THREE.MathUtils.lerp(g.position.z, zTarget, 0.08)
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, rotYTarget, 0.08)
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, mouse.y * 0.06, 0.08)
  })

  const w = 0.72
  const h = 1.28
  const d = 0.045

  return (
    <group ref={groupRef} position={[baseX, 0, 0]}>
      <mesh position={[0, 0, d / 2 + 0.001]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -d / 2]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#141414" />
      </mesh>
      <mesh position={[-w / 2 - d / 2, 0, 0]}>
        <boxGeometry args={[d, h, d]} />
        <meshBasicMaterial color="#333" />
      </mesh>
    </group>
  )
}

function GalleryScene({
  labels,
  mouse,
  spread,
}: {
  labels: string[]
  mouse: { x: number; y: number }
  spread: boolean
}) {
  const rigRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (rigRef.current) {
      rigRef.current.rotation.y = THREE.MathUtils.lerp(rigRef.current.rotation.y, mouse.x * 0.08, 0.06)
      rigRef.current.rotation.x = THREE.MathUtils.lerp(rigRef.current.rotation.x, mouse.y * 0.05, 0.06)
    }
  })

  return (
    <>
      <ambientLight intensity={1} />
      <group ref={rigRef}>
        {labels.map((label, i) => (
          <MockupPanel key={i} index={i} label={label} mouse={mouse} spread={spread} />
        ))}
      </group>
      <ContactShadows position={[0, -0.85, 0]} opacity={0.35} scale={8} blur={2.5} far={4} color="#2a2a2a" />
    </>
  )
}

type Props = {
  title: string
}

export default function FinalMockups3D({ title }: Props) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [spread, setSpread] = useState(false)
  const labels = useMemo(() => [title, title, title], [title])

  return (
    <div
      className="relative w-full h-80 rounded-2xl overflow-hidden bg-[#dce8d5]/60"
      onMouseEnter={() => setSpread(true)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setMouse({
          x: ((e.clientX - r.left) / r.width - 0.5) * 2,
          y: -((e.clientY - r.top) / r.height - 0.5) * 2,
        })
      }}
      onMouseLeave={() => { setSpread(false); setMouse({ x: 0, y: 0 }) }}
    >
      <Canvas camera={{ position: [0, 0, 3.8], fov: 45 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <GalleryScene labels={labels} mouse={mouse} spread={spread} />
      </Canvas>
    </div>
  )
}
