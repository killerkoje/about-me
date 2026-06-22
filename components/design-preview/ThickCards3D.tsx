'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import {
  CARD_SIZES,
  createPanelTexture,
  type CardSize,
  type PanelTextureOpts,
} from './kokuyo-three-shared'

export type ThickCardItem = PanelTextureOpts & {
  id?: string
}

type Layout =
  | 'row-3'
  | 'row-4'
  | 'grid-2'
  | 'stack-3'
  | 'single-wide'
  | 'list'

function getPose(layout: Layout, index: number, count: number, spread: boolean) {
  if (layout === 'row-3') {
    const x = (index - 1) * 1.15
    return { x, y: 0, z: index * 0.06, rotY: spread ? (index - 1) * -0.12 : (index - 1) * -0.05, rotX: 0 }
  }
  if (layout === 'row-4') {
    const x = (index - 1.5) * 0.88
    return { x, y: 0, z: index * 0.05, rotY: spread ? (index - 1.5) * -0.1 : 0, rotX: 0 }
  }
  if (layout === 'grid-2') {
    const x = index === 0 ? -0.85 : 0.85
    return { x, y: 0, z: index * 0.08, rotY: spread ? (index === 0 ? 0.15 : -0.15) : 0, rotX: 0 }
  }
  if (layout === 'stack-3') {
    const y = (1 - index) * 0.55
    return { x: 0, y, z: index * 0.12, rotY: spread ? (index - 1) * 0.08 : 0, rotX: spread ? -0.04 : 0 }
  }
  if (layout === 'single-wide') {
    return { x: 0, y: 0, z: 0, rotY: spread ? 0.05 : 0, rotX: 0 }
  }
  // list
  const y = (count - 1) / 2 * -0.62 + index * 0.62
  return { x: 0, y, z: index * 0.04, rotY: spread ? (index - 1.5) * 0.04 : 0, rotX: 0 }
}

function CardMesh({
  item,
  index,
  count,
  layout,
  size,
  spread,
  active,
  mouse,
  onSelect,
  onHover,
}: {
  item: ThickCardItem
  index: number
  count: number
  layout: Layout
  size: CardSize
  spread: boolean
  active: boolean
  mouse: { x: number; y: number }
  onSelect?: (index: number) => void
  onHover?: (index: number | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const texture = useMemo(() => createPanelTexture(item), [item])

  useEffect(() => () => texture.dispose(), [texture])

  const pose = getPose(layout, index, count, spread)

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const lift = active ? 0.22 : 0
    g.position.x = THREE.MathUtils.lerp(g.position.x, pose.x + mouse.x * 0.08, 0.09)
    g.position.y = THREE.MathUtils.lerp(g.position.y, pose.y + mouse.y * 0.05, 0.09)
    g.position.z = THREE.MathUtils.lerp(g.position.z, pose.z + lift, 0.09)
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, pose.rotY + mouse.x * 0.06, 0.09)
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pose.rotX + mouse.y * 0.04, 0.09)
  })

  const { w, h, d } = size

  return (
    <group ref={groupRef}>
      <mesh
        position={[0, 0, d / 2 + 0.001]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onSelect?.(index)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover?.(index)
          if (onSelect) document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHover?.(null)
          if (onSelect) document.body.style.cursor = 'auto'
        }}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -d / 2]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#141414" />
      </mesh>
      <mesh position={[-w / 2 - d / 2, 0, 0]}>
        <boxGeometry args={[d, h, d]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
    </group>
  )
}

function Scene({
  items,
  layout,
  sizeKey,
  mouse,
  spread,
  activeIndex,
  onSelect,
  onHover,
}: {
  items: ThickCardItem[]
  layout: Layout
  sizeKey: keyof typeof CARD_SIZES
  mouse: { x: number; y: number }
  spread: boolean
  activeIndex: number | null
  onSelect?: (index: number) => void
  onHover?: (index: number | null) => void
}) {
  const rigRef = useRef<THREE.Group>(null)
  const size = CARD_SIZES[sizeKey]

  useFrame(() => {
    if (rigRef.current) {
      rigRef.current.rotation.y = THREE.MathUtils.lerp(rigRef.current.rotation.y, mouse.x * 0.04, 0.06)
      rigRef.current.rotation.x = THREE.MathUtils.lerp(rigRef.current.rotation.x, mouse.y * 0.03, 0.06)
    }
  })

  return (
    <>
      <ambientLight intensity={1} />
      <group ref={rigRef} position={[0, layout === 'stack-3' ? 0 : 0, 0]}>
        {items.map((item, i) => (
          <CardMesh
            key={i}
            item={item}
            index={i}
            count={items.length}
            layout={layout}
            size={size}
            spread={spread}
            active={activeIndex === i}
            mouse={mouse}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </group>
      <ContactShadows position={[0, layout === 'stack-3' ? -1.4 : -0.55, 0]} opacity={0.32} scale={10} blur={2.5} far={5} color="#2a2a2a" />
    </>
  )
}

type Props = {
  items: ThickCardItem[]
  layout: Layout
  sizeKey?: keyof typeof CARD_SIZES
  height?: string
  className?: string
  onSelect?: (index: number) => void
}

export default function ThickCards3D({
  items,
  layout,
  sizeKey = layout === 'row-4' ? 'meta' : layout === 'row-3' ? 'stat' : layout === 'list' ? 'list' : 'panel',
  height,
  className = '',
  onSelect,
}: Props) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [spread, setSpread] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const defaultHeight =
    layout === 'list' ? 'h-[420px]' :
    layout === 'stack-3' ? 'h-80' :
    layout === 'single-wide' ? 'h-52' :
    layout === 'row-4' ? 'h-44' :
    'h-56'

  const camZ = layout === 'list' ? 4.2 + items.length * 0.15 : layout === 'stack-3' ? 3.8 : 3.4

  const handleSelect = (index: number) => {
    setActiveIndex(index)
    onSelect?.(index)
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-[#dce8d5]/50 ${height ?? defaultHeight} ${className}`}
      onMouseEnter={() => setSpread(true)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setMouse({
          x: ((e.clientX - r.left) / r.width - 0.5) * 2,
          y: -((e.clientY - r.top) / r.height - 0.5) * 2,
        })
      }}
      onMouseLeave={() => {
        setSpread(false)
        setActiveIndex(null)
        setMouse({ x: 0, y: 0 })
      }}
    >
      <Canvas camera={{ position: [0, layout === 'stack-3' ? 0 : 0, camZ], fov: 42 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <Scene
          items={items}
          layout={layout}
          sizeKey={sizeKey}
          mouse={mouse}
          spread={spread}
          activeIndex={activeIndex}
          onSelect={onSelect ? handleSelect : undefined}
          onHover={setActiveIndex}
        />
      </Canvas>
    </div>
  )
}
