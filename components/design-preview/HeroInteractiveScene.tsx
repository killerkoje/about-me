'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
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
    const z = Math.pow(Math.sin(t * Math.PI), 1.4) * curl
    pos.setZ(i, z)
  }
  geo.computeVertexNormals()
  return geo
}

function LinePattern({ side }: { side: 'left' | 'right' }) {
  const lines = useMemo(() => {
    const leftItems = [
      { x: -0.2, y: 0.5, w: 0.5, h: 0.02 },
      { x: 0.1, y: 0.2, w: 0.35, h: 0.02 },
      { x: -0.3, y: -0.1, w: 0.4, h: 0.02 },
      { x: 0.2, y: -0.4, w: 0.45, h: 0.02 },
      { x: -0.1, y: 0.3, w: 0.6, h: 0.5 },
      { x: 0.2, y: -0.2, w: 0.35, h: 0.35 },
    ]
    const rightItems = [
      { x: 0.15, y: 0.45, w: 0.55, h: 0.02 },
      { x: -0.1, y: 0.15, w: 0.4, h: 0.02 },
      { x: 0.25, y: -0.15, w: 0.35, h: 0.02 },
      { x: -0.15, y: -0.45, w: 0.5, h: 0.02 },
      { x: 0.15, y: 0.1, w: 0.55, h: 0.4 },
      { x: -0.2, y: -0.35, w: 0.45, h: 0.25 },
    ]
    return side === 'left' ? leftItems : rightItems
  }, [side])

  return (
    <group position={[0, 0, 0.01]}>
      {lines.map((l, i) => (
        <mesh key={i} position={[l.x, l.y, 0]}>
          <planeGeometry args={[l.w, l.h]} />
          <meshBasicMaterial color={INK} transparent opacity={0.18} />
        </mesh>
      ))}
      {/* 간단한 아이콘 드로잉 */}
      {side === 'left' ? (
        <group position={[-0.3, 0.5, 0.02]}>
          <mesh>
            <ringGeometry args={[0.08, 0.12, 24]} />
            <meshBasicMaterial color={INK} transparent opacity={0.22} />
          </mesh>
          <mesh position={[0.25, -0.15, 0]}>
            <boxGeometry args={[0.2, 0.15, 0.001]} />
            <meshBasicMaterial color={INK} transparent opacity={0.15} />
          </mesh>
        </group>
      ) : (
        <group position={[0.25, 0.45, 0.02]}>
          <mesh rotation={[0, 0, 0.4]}>
            <planeGeometry args={[0.18, 0.12]} />
            <meshBasicMaterial color={INK} transparent opacity={0.2} />
          </mesh>
          <mesh position={[-0.35, -0.25, 0]}>
            <circleGeometry args={[0.1, 24]} />
            <meshBasicMaterial color={INK} transparent opacity={0.15} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function Butterfly({
  basePosition,
  color,
  wingColor,
  speed,
  scale = 1,
}: {
  basePosition: [number, number, number]
  color: string
  wingColor: string
  speed: number
  scale?: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const leftWing = useRef<THREE.Mesh>(null)
  const rightWing = useRef<THREE.Mesh>(null)
  const path = useRef({
    angle: Math.random() * Math.PI * 2,
    radius: 0.3 + Math.random() * 0.4,
    height: basePosition[1],
  })

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime * speed
    path.current.angle += delta * speed * 0.4

    if (groupRef.current) {
      groupRef.current.position.x = basePosition[0] + Math.cos(path.current.angle) * path.current.radius
      groupRef.current.position.y = path.current.height + Math.sin(t * 2.5) * 0.15
      groupRef.current.position.z = basePosition[2] + Math.sin(path.current.angle) * 0.2
      groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.3
    }
    const flap = Math.abs(Math.sin(t * 12)) * 0.7 + 0.1
    if (leftWing.current) leftWing.current.rotation.y = flap
    if (rightWing.current) rightWing.current.rotation.y = -flap
  })

  return (
    <group ref={groupRef} position={basePosition} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.015, 0.06, 4, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={leftWing} position={[-0.04, 0.01, 0]} rotation={[0, 0.3, 0.2]}>
        <planeGeometry args={[0.09, 0.07]} />
        <meshBasicMaterial color={wingColor} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rightWing} position={[0.04, 0.01, 0]} rotation={[0, -0.3, -0.2]}>
        <planeGeometry args={[0.09, 0.07]} />
        <meshBasicMaterial color={wingColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function OpenBook({
  mouse,
  hovered,
}: {
  mouse: { x: number; y: number }
  hovered: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const leftPageRef = useRef<THREE.Group>(null)
  const rightPageRef = useRef<THREE.Group>(null)
  const target = useRef({ x: 0, y: 0, lift: 0 })

  const leftGeo = useMemo(() => createCurvedPage(2.2, 2.8, 24, 0.35), [])
  const rightGeo = useMemo(() => createCurvedPage(2.2, 2.8, 24, 0.35), [])

  useFrame((_, delta) => {
    target.current.x = THREE.MathUtils.lerp(target.current.x, mouse.x * 0.25, 0.06)
    target.current.y = THREE.MathUtils.lerp(target.current.y, mouse.y * 0.18, 0.06)
    target.current.lift = THREE.MathUtils.lerp(target.current.lift, hovered ? 1 : 0, 0.08)

    if (groupRef.current) {
      groupRef.current.rotation.y = target.current.x
      groupRef.current.rotation.x = 0.15 + target.current.y * 0.12
      groupRef.current.position.y = Math.sin(_.clock.elapsedTime * 0.8) * 0.04
    }
    if (leftPageRef.current) {
      leftPageRef.current.rotation.x = THREE.MathUtils.lerp(
        leftPageRef.current.rotation.x,
        -0.08 - target.current.lift * 0.45,
        0.1,
      )
    }
    if (rightPageRef.current) {
      rightPageRef.current.rotation.x = THREE.MathUtils.lerp(
        rightPageRef.current.rotation.x,
        -0.05 + target.current.lift * 0.08,
        0.1,
      )
    }
  })

  return (
    <group ref={groupRef}>
      {/* 책 등 */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[0.12, 2.85, 0.35]} />
        <meshBasicMaterial color={INK} />
      </mesh>

      {/* 왼쪽 페이지 — 라임 (spine 기준 회전) */}
      <group ref={leftPageRef} position={[0, 0, 0.02]}>
        <group position={[-1.1, 0, 0]}>
          <mesh geometry={leftGeo} rotation={[0, Math.PI / 2, 0]}>
            <meshBasicMaterial color={LIME} side={THREE.DoubleSide} />
          </mesh>
          <LinePattern side="left" />
        </group>
      </group>

      {/* 오른쪽 페이지 — 오렌지 */}
      <group ref={rightPageRef} position={[0, 0, 0.02]}>
        <group position={[1.1, 0, 0]}>
          <mesh geometry={rightGeo} rotation={[0, -Math.PI / 2, 0]}>
            <meshBasicMaterial color={ORANGE} side={THREE.DoubleSide} />
          </mesh>
          <LinePattern side="right" />
        </group>
      </group>

      {/* 페이지 하단 라인 */}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, -1.42, 0.04]}>
          <boxGeometry args={[2.15, 0.025, 0.01]} />
          <meshBasicMaterial color={INK} transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  )
}

function Scene({
  mouse,
  hovered,
}: {
  mouse: { x: number; y: number }
  hovered: boolean
}) {
  return (
    <>
      <ambientLight intensity={1} />
      <OpenBook mouse={mouse} hovered={hovered} />

      <Butterfly basePosition={[0.2, 1.2, 0.8]} color="#333" wingColor="#f5c842" speed={0.9} scale={1.2} />
      <Butterfly basePosition={[-0.5, 1.5, 0.5]} color="#333" wingColor="#b07aff" speed={1.1} />
      <Butterfly basePosition={[0.8, 1.0, 0.6]} color="#333" wingColor="#e8572a" speed={1.3} scale={0.9} />
      <Butterfly basePosition={[-0.2, 1.8, 0.3]} color="#333" wingColor="#f5c842" speed={0.7} scale={0.75} />

      {/* 떠다니는 작은 도형 — 호기심 포인트 */}
      <Float speed={2} floatIntensity={0.6} rotationIntensity={0.2}>
        <mesh position={[-2.2, 0.5, -0.5]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color={ORANGE} />
        </mesh>
      </Float>
      <Float speed={1.5} floatIntensity={0.8} rotationIntensity={0.3}>
        <mesh position={[2.3, 1.2, -0.3]}>
          <boxGeometry args={[0.12, 0.12, 0.02]} />
          <meshBasicMaterial color={LIME} />
        </mesh>
      </Float>
    </>
  )
}

export default function HeroInteractiveScene() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setEnabled(!reduced)

    const onMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  if (!enabled) {
    return (
      <div className="flex items-center justify-center h-[420px]">
        <div className="w-64 h-40 bg-[#c8e64a] rounded-sm rotate-[-3deg] shadow-lg" />
      </div>
    )
  }

  return (
    <div
      className="relative w-full h-[420px] sm:h-[480px] cursor-grab active:cursor-grabbing"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0.3, 5.5], fov: 42 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene mouse={mouse} hovered={hovered} />
      </Canvas>
    </div>
  )
}
