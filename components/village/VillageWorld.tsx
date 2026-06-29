'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Outline } from '@react-three/postprocessing'
import { Selection, Select } from '@react-three/postprocessing'
import * as THREE from 'three'

// ── Reference palette (screenshot-matched) ───────────────────────────────────
const C = {
  sky: '#74c4d8',
  skyHi: '#8ed4e4',
  cloud: '#eef6fa',
  road: '#565450',
  roadLine: '#ece8e0',
  curb: '#8a8680',
  grass: '#6a9a58',
  wall: '#a8a4a0',
  wallDark: '#8a8682',
  bush: '#6a8a54',
  bushHi: '#7a9a64',
  pole: '#4a4038',
  wire: '#2a2824',
  mailbox: '#8a9468',
  mailboxSlot: '#d8d4c4',
  house: '#c8c4bc',
  houseTrim: '#a09888',
  fence: '#8a6848',
  window: '#88b8cc',
  orange: '#e87838',
  orangeHi: '#f09050',
  blue: '#4890b8',
  blueHi: '#60a8c8',
  yellow: '#e8c838',
  skin: '#f0c0a0',
  hair: '#1a1008',
  pants: '#2a3048',
  white: '#f4f0e8',
  outline: '#141210',
}

let _gm: THREE.DataTexture | null = null
function getGM(): THREE.DataTexture {
  if (!_gm) {
    const d = new Uint8Array([18, 120, 255])
    _gm = new THREE.DataTexture(d, 3, 1, THREE.RedFormat)
    _gm.magFilter = THREE.NearestFilter
    _gm.minFilter = THREE.NearestFilter
    _gm.needsUpdate = true
  }
  return _gm
}

type V3 = [number, number, number]
type HouseId = 'about' | 'projects' | 'skills' | 'contact'

interface ZoneConfig {
  id: HouseId
  label: string
  emoji: string
  position: V3
  radius: number
}

const ZONES: ZoneConfig[] = [
  { id: 'about',    label: '소개',     emoji: '🏠', position: [-2.2, 0, -6],  radius: 4.5 },
  { id: 'projects', label: '프로젝트', emoji: '💻', position: [3.8, 0, -10], radius: 5 },
  { id: 'skills',   label: '스킬',     emoji: '⚡', position: [-1.5, 0, -18], radius: 4.5 },
  { id: 'contact',  label: '연락처',   emoji: '📬', position: [2.5, 0, -26], radius: 5 },
]

function pathX(z: number) {
  return -Math.sin(z * 0.065) * 1.8
}

function TMesh({
  geo,
  color,
  pos,
  rot,
  scale,
  cast = true,
}: {
  geo: React.ReactNode
  color: string
  pos?: V3
  rot?: V3
  scale?: number | V3
  cast?: boolean
}) {
  const gm = getGM()
  const s = scale ?? 1
  const scaleProp = Array.isArray(s) ? s : ([s, s, s] as V3)
  return (
    <mesh position={pos} rotation={rot} scale={scaleProp} castShadow={cast} receiveShadow>
      {geo}
      <meshToonMaterial color={color} gradientMap={gm} />
    </mesh>
  )
}

function TBox(p: { w: number; h: number; d: number; color: string; pos?: V3; rot?: V3; scale?: number | V3 }) {
  return <TMesh geo={<boxGeometry args={[p.w, p.h, p.d]} />} {...p} />
}

function TSphere(p: { r: number; color: string; pos?: V3; seg?: number }) {
  const seg = p.seg ?? 10
  return <TMesh geo={<sphereGeometry args={[p.r, seg, seg]} />} color={p.color} pos={p.pos} />
}

function TCyl(p: { rt: number; rb: number; h: number; color: string; pos?: V3; seg?: number }) {
  return <TMesh geo={<cylinderGeometry args={[p.rt, p.rb, p.h, p.seg ?? 10]} />} {...p} />
}

// ── Sky ───────────────────────────────────────────────────────────────────────
function Sky() {
  return (
    <group>
      <mesh position={[0, 16, -55]} rotation={[0.06, 0, 0]}>
        <planeGeometry args={[140, 70]} />
        <meshBasicMaterial color={C.sky} />
      </mesh>
      <mesh position={[0, 8, -55]} rotation={[0.06, 0, 0]}>
        <planeGeometry args={[140, 40]} />
        <meshBasicMaterial color={C.skyHi} />
      </mesh>
      {[
        [-6, 19, -22, 2.8],
        [5, 21, -28, 3.4],
        [12, 17, -20, 2.2],
      ].map(([x, y, z, s], i) => (
        <group key={i} position={[x, y, z] as V3} scale={s}>
          <TSphere r={0.55} color={C.cloud} pos={[0, 0, 0]} />
          <TSphere r={0.42} color={C.cloud} pos={[-0.55, -0.08, 0.1]} />
          <TSphere r={0.38} color={C.cloud} pos={[0.5, -0.05, -0.05]} />
        </group>
      ))}
    </group>
  )
}

// ── Curved road ───────────────────────────────────────────────────────────────
function Road() {
  const gm = getGM()
  const segments = useMemo(() => {
    const out: { pos: V3; rotY: number }[] = []
    for (let i = 0; i < 21; i++) {
      const z = 10 - i * 2.5
      const x = pathX(z)
      const x2 = pathX(z - 2.5)
      out.push({ pos: [x, 0, z], rotY: Math.atan2(x2 - x, -2.5) })
    }
    return out
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -14]} receiveShadow>
        <planeGeometry args={[36, 70]} />
        <meshToonMaterial color={C.grass} gradientMap={gm} />
      </mesh>
      {segments.map((seg, i) => (
        <group key={i} position={seg.pos} rotation={[0, seg.rotY, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1.25]} receiveShadow>
            <planeGeometry args={[4.2, 2.6]} />
            <meshToonMaterial color={C.road} gradientMap={gm} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.6, 0.012, -1.25]}>
            <planeGeometry args={[0.5, 2.6]} />
            <meshToonMaterial color={C.curb} gradientMap={gm} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.6, 0.012, -1.25]}>
            <planeGeometry args={[0.5, 2.6]} />
            <meshToonMaterial color={C.curb} gradientMap={gm} />
          </mesh>
          {i % 2 === 0 && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -1.25]}>
              <planeGeometry args={[0.14, 1.4]} />
              <meshToonMaterial color={C.roadLine} gradientMap={gm} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

// ── Left wall + bushes (reference) ────────────────────────────────────────────
function LeftWall() {
  const panels: V3[] = []
  for (let z = 8; z >= -36; z -= 2.4) {
    const x = pathX(z) - 4.6
    panels.push([x, 2.2, z])
  }

  return (
    <group>
      {panels.map((pos, i) => (
        <group key={i} position={pos}>
          <TBox w={2.2} h={4.4} d={0.55} color={C.wall} pos={[0, 0, 0]} />
          <TBox w={2.22} h={0.08} d={0.56} color={C.wallDark} pos={[0, 0.8, 0.01]} />
          <TBox w={2.22} h={0.08} d={0.56} color={C.wallDark} pos={[0, -0.6, 0.01]} />
          {i % 2 === 0 && (
            <group position={[0.3, 2.5, 0.2]}>
              <TSphere r={0.55} color={C.bush} pos={[0, 0, 0]} />
              <TSphere r={0.42} color={C.bushHi} pos={[-0.45, -0.1, 0.15]} />
              <TSphere r={0.38} color={C.bush} pos={[0.4, -0.05, -0.1]} />
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

// ── Mailbox building (right foreground) ───────────────────────────────────────
function MailboxWall({ pos }: { pos: V3 }) {
  const slots: V3[] = []
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      slots.push([-1.0 + col * 0.5, 0.8 + row * 0.48, 0.46])
    }
  }

  return (
    <group position={pos}>
      <TBox w={3.2} h={4.2} d={1.0} color={C.mailbox} pos={[0, 2.1, 0]} />
      <TBox w={3.3} h={0.14} d={1.05} color="#6a7450" pos={[0, 4.18, 0]} />
      {slots.map((p, i) => (
        <TBox key={i} w={0.38} h={0.34} d={0.06} color={C.mailboxSlot} pos={p} />
      ))}
    </group>
  )
}

// ── Background house + fence ──────────────────────────────────────────────────
function BackgroundHouse({ pos }: { pos: V3 }) {
  const posts: V3[] = []
  for (let i = 0; i < 7; i++) posts.push([-1.8 + i * 0.55, 0.55, 1.35])

  return (
    <group position={pos}>
      <TBox w={4.5} h={3.8} d={3.2} color={C.house} pos={[0, 1.9, 0]} />
      <TBox w={4.6} h={0.22} d={3.3} color={C.houseTrim} pos={[0, 3.85, 0]} />
      <TBox w={4.7} h={0.35} d={3.4} color={C.houseTrim} pos={[0, 4.05, 0]} />
      <TBox w={0.9} h={0.9} d={0.12} color={C.window} pos={[-1.2, 2.2, 1.62]} />
      <TBox w={0.9} h={0.9} d={0.12} color={C.window} pos={[1.2, 2.2, 1.62]} />
      <TBox w={0.7} h={0.55} d={0.35} color="#c8c4bc" pos={[2.1, 2.5, 1.5]} />
      {posts.map((p, i) => (
        <TBox key={i} w={0.1} h={1.1} d={0.1} color={C.fence} pos={p} />
      ))}
      <TBox w={3.2} h={0.08} d={0.08} color={C.fence} pos={[0, 0.95, 1.38]} />
      <TBox w={3.2} h={0.08} d={0.08} color={C.fence} pos={[0, 0.7, 1.38]} />
    </group>
  )
}

// ── Utility pole + sagging wires ────────────────────────────────────────────
function PowerLines() {
  const polePos: V3 = [pathX(-2) - 1.2, 0, -2]

  const wires = useMemo(() => {
    const lines: THREE.Line[] = []
    const anchors: V3[] = [
      [polePos[0] - 3, 7.2, polePos[2] - 8],
      [polePos[0] + 4, 7, polePos[2] - 14],
      [polePos[0] - 2, 6.8, polePos[2] - 22],
    ]
    for (let w = 0; w < 3; w++) {
      const y0 = 6.8 - w * 0.35
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(polePos[0] + 0.8, y0, polePos[2]),
        new THREE.Vector3(polePos[0] + 1.5, y0 - 1.2 - w * 0.2, polePos[2] - 10),
        new THREE.Vector3(anchors[w][0], anchors[w][1], anchors[w][2]),
      )
      const pts = curve.getPoints(20)
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      lines.push(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: C.wire, linewidth: 2 })))
    }
    return lines
  }, [polePos])

  return (
    <group>
      <group position={polePos}>
        <TCyl rt={0.07} rb={0.1} h={7.2} color={C.pole} pos={[0, 3.6, 0]} seg={8} />
        <TBox w={1.6} h={0.07} d={0.07} color={C.pole} pos={[0, 7.05, 0]} />
        <TBox w={0.5} h={0.06} d={0.06} color={C.pole} pos={[0.45, 6.7, 0.15]} />
        <TBox w={0.06} h={0.06} d={0.9} color={C.pole} pos={[0, 6.45, 0.35]} />
      </group>
      {wires.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  )
}

// ── Anime characters (reference proportions, from behind) ─────────────────────
function ChibiCharacter({
  variant,
  walkRef,
}: {
  variant: 'orange' | 'blue'
  walkRef: React.RefObject<number>
}) {
  const root = useRef<THREE.Group>(null!)
  const lLeg = useRef<THREE.Group>(null!)
  const rLeg = useRef<THREE.Group>(null!)
  const lArm = useRef<THREE.Group>(null!)
  const rArm = useRef<THREE.Group>(null!)

  const isOrange = variant === 'orange'
  const top = isOrange ? C.orange : C.blue
  const topHi = isOrange ? C.orangeHi : C.blueHi

  useFrame(() => {
    const ph = walkRef.current
    const swing = Math.sin(ph) * 0.65
    const bob = Math.abs(Math.sin(ph * 2)) * 0.045
    if (root.current) root.current.position.y = bob
    if (lLeg.current) lLeg.current.rotation.x = swing * 0.55
    if (rLeg.current) rLeg.current.rotation.x = -swing * 0.55
    if (lArm.current) lArm.current.rotation.x = -swing * 0.35
    if (rArm.current) rArm.current.rotation.x = swing * 0.35
  })

  return (
    <group ref={root} scale={0.92}>
      <group ref={lLeg} position={[-0.11, 0.28, 0]}>
        <TCyl rt={0.09} rb={0.1} h={0.5} color={C.pants} pos={[0, 0, 0]} />
        <TBox w={0.18} h={0.1} d={0.24} color="#1a1a1a" pos={[0, -0.28, 0.05]} />
      </group>
      <group ref={rLeg} position={[0.11, 0.28, 0]}>
        <TCyl rt={0.09} rb={0.1} h={0.5} color={C.pants} pos={[0, 0, 0]} />
        <TBox w={0.18} h={0.1} d={0.24} color="#1a1a1a" pos={[0, -0.28, 0.05]} />
      </group>

      <TSphere r={0.22} color={top} pos={[0, 0.72, 0]} />
      <TBox w={0.48} h={0.42} d={0.3} color={top} pos={[0, 0.72, -0.02]} />
      {isOrange && (
        <>
          <TBox w={0.5} h={0.18} d={0.32} color={topHi} pos={[0, 0.95, -0.06]} />
          <TBox w={0.08} h={0.08} d={0.42} color={C.white} pos={[-0.24, 1.12, 0.02]} />
          <TBox w={0.08} h={0.08} d={0.42} color={C.white} pos={[0.24, 1.12, 0.02]} />
          <TBox w={0.44} h={0.07} d={0.1} color={C.white} pos={[0, 1.2, 0.04]} />
        </>
      )}
      {!isOrange && (
        <>
          <TBox w={0.44} h={0.1} d={0.28} color={topHi} pos={[0, 0.92, -0.04]} />
          <TBox w={0.12} h={0.34} d={0.08} color={C.yellow} pos={[0.22, 0.7, 0.08]} rot={[0.2, -0.3, 0.5]} />
          <TBox w={0.28} h={0.32} d={0.14} color={C.yellow} pos={[0.18, 0.55, 0.12]} rot={[0.1, -0.2, 0.3]} />
        </>
      )}

      <group ref={lArm} position={[-0.28, 0.78, 0]}>
        <TCyl rt={0.06} rb={0.07} h={0.38} color={top} pos={[0, -0.08, 0]} />
      </group>
      <group ref={rArm} position={[0.28, 0.78, 0]}>
        <TCyl rt={0.06} rb={0.07} h={0.38} color={top} pos={[0, -0.08, 0]} />
      </group>

      <TSphere r={0.2} color={C.skin} pos={[0, 1.12, 0.02]} />
      <TSphere r={0.21} color={C.hair} pos={[0, 1.22, -0.04]} />
      <TBox w={0.34} h={0.12} d={0.08} color={C.hair} pos={[0, 1.14, 0.12]} />
    </group>
  )
}

function PlayerParty({ keysRef, onNear }: { keysRef: React.RefObject<Set<string>>; onNear: (id: HouseId | null) => void }) {
  const party = useRef<THREE.Group>(null!)
  const orangeWalk = useRef(0)
  const blueWalk = useRef(0.8)
  const nearRef = useRef<HouseId | null>(null)
  const cbRef = useRef(onNear)
  cbRef.current = onNear
  const { camera } = useThree()

  useFrame((_, dt) => {
    const g = party.current
    if (!g) return

    const k = keysRef.current
    const dir = new THREE.Vector3()
    if (k.has('w') || k.has('arrowup')) dir.z -= 1
    if (k.has('s') || k.has('arrowdown')) dir.z += 1
    if (k.has('a') || k.has('arrowleft')) dir.x -= 1
    if (k.has('d') || k.has('arrowright')) dir.x += 1

    if (dir.lengthSq() > 0.001) {
      dir.normalize()
      g.position.addScaledVector(dir, 4.8 * dt)
      const targetRot = Math.atan2(dir.x, dir.z)
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetRot, Math.min(1, 8 * dt))
      orangeWalk.current += dt * 10
      blueWalk.current += dt * 10
    }

    const laneX = pathX(g.position.z)
    g.position.x = THREE.MathUtils.lerp(
      g.position.x,
      THREE.MathUtils.clamp(g.position.x, laneX - 1.3, laneX + 1.3),
      0.1,
    )
    g.position.z = THREE.MathUtils.clamp(g.position.z, -34, 4)

    const look = new THREE.Vector3(g.position.x, 1.05, g.position.z - 3)
    const cam = new THREE.Vector3(g.position.x + 0.35, 2.35, g.position.z + 4.6)
    camera.position.lerp(cam, Math.min(1, 3 * dt))
    camera.lookAt(look)

    let nearest: HouseId | null = null
    let minD = Infinity
    for (const z of ZONES) {
      const dx = g.position.x - z.position[0]
      const dz = g.position.z - z.position[2]
      const d = Math.sqrt(dx * dx + dz * dz)
      if (d < z.radius && d < minD) { minD = d; nearest = z.id }
    }
    if (nearest !== nearRef.current) {
      nearRef.current = nearest
      cbRef.current(nearest)
    }
  })

  return (
    <group ref={party} position={[pathX(2), 0, 2]} rotation={[0, Math.PI, 0]}>
      <group position={[-0.55, 0, 0]}>
        <ChibiCharacter variant="orange" walkRef={orangeWalk} />
      </group>
      <group position={[0.55, 0, 0.15]}>
        <ChibiCharacter variant="blue" walkRef={blueWalk} />
      </group>
    </group>
  )
}

function AlleyScene({ onNear }: { onNear: (id: HouseId | null) => void }) {
  const keysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const dn = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase())
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', dn)
      window.removeEventListener('keyup', up)
    }
  }, [])

  return (
    <>
      <ambientLight intensity={0.62} color="#c8dce8" />
      <directionalLight
        position={[8, 20, 12]}
        intensity={2.6}
        color="#fff4d0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <directionalLight position={[-6, 8, -6]} intensity={0.28} color="#90b8d8" />

      <Sky />

      <Selection>
        <EffectComposer multisampling={4} autoClear={false}>
          <Outline
            visibleEdgeColor={0x141210}
            hiddenEdgeColor={0x141210}
            edgeStrength={12}
            width={1024}
            blur={false}
            xRay={false}
          />
        </EffectComposer>

        <Select enabled>
          <Road />
          <LeftWall />
          <MailboxWall pos={[pathX(-8) + 5.2, 0, -8]} />
          <BackgroundHouse pos={[pathX(-20) + 5.8, 0, -20]} />
          <PowerLines />
          <PlayerParty keysRef={keysRef} onNear={onNear} />
        </Select>
      </Selection>
    </>
  )
}

// ── Modals ────────────────────────────────────────────────────────────────────
const S = {
  tag: { fontSize: '10px', color: '#aaa', letterSpacing: '0.2em', textTransform: 'uppercase' as const, fontFamily: 'sans-serif', marginBottom: '10px' },
  h2: { fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 4px' as const },
  sub: { fontSize: '13px', color: '#999', marginBottom: '22px' },
}

function AboutContent() {
  return (
    <>
      <p style={S.tag}>🏠 소개</p>
      <h2 style={S.h2}>이희원</h2>
      <p style={S.sub}>Frontend Developer</p>
      <p style={{ fontSize: '14px', lineHeight: '2.1', color: '#555', whiteSpace: 'pre-line' }}>
        {'제가 만든 서비스에 접속하는 누구나\n설명없이 간편하고 쉽게 이용할 수 있습니다.'}
      </p>
    </>
  )
}

function ProjectsContent({ close }: { close: () => void }) {
  return (
    <>
      <p style={S.tag}>💻 프로젝트</p>
      <h2 style={S.h2}>Projects</h2>
      <a href="/projects" onClick={close} style={{ display: 'inline-flex', background: '#111', color: 'white', borderRadius: '14px', padding: '11px 22px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
        전체 프로젝트 보기 →
      </a>
    </>
  )
}

function SkillsContent() {
  return (
    <>
      <p style={S.tag}>⚡ 스킬</p>
      <h2 style={S.h2}>기술 스택</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {['React / Next.js', 'TypeScript', 'Three.js / R3F', 'Tailwind CSS'].map((s) => (
          <span key={s} style={{ background: '#f7f7f7', border: '1.5px solid #ebebeb', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}>{s}</span>
        ))}
      </div>
    </>
  )
}

function ContactContent() {
  return (
    <>
      <p style={S.tag}>📬 연락처</p>
      <h2 style={S.h2}>연락하기</h2>
      <a href="https://github.com/LEEHEEWON123" target="_blank" rel="noreferrer" style={{ color: '#333', fontWeight: 600 }}>GitHub →</a>
    </>
  )
}

function Modal({ id, close }: { id: HouseId; close: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,25,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(7px)', padding: '20px' }} onClick={close}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '40px 44px', maxWidth: '480px', width: '100%', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={close} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#bbb' }}>✕</button>
        {id === 'about' && <AboutContent />}
        {id === 'projects' && <ProjectsContent close={close} />}
        {id === 'skills' && <SkillsContent />}
        {id === 'contact' && <ContactContent />}
      </div>
    </div>
  )
}

export default function VillageWorld() {
  const [near, setNear] = useState<HouseId | null>(null)
  const [open, setOpen] = useState<HouseId | null>(null)
  const [dpr, setDpr] = useState(1)
  const handleNear = useCallback((id: HouseId | null) => setNear(id), [])

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, 1.5))
  }, [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(null); return }
      if ((e.key === 'e' || e.key === 'E') && near && !open) setOpen(near)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [near, open])

  const nearCfg = ZONES.find((z) => z.id === near)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0.35, 2.35, 6.6], fov: 58 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        shadows
        dpr={dpr}
      >
        <color attach="background" args={[C.sky]} />
        <fog attach="fog" args={[C.sky, 22, 58]} />
        <AlleyScene onNear={handleNear} />
      </Canvas>

      <a href="/" style={{ position: 'fixed', top: 20, left: 20, background: 'rgba(255,255,255,0.9)', padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#222', textDecoration: 'none', zIndex: 100 }}>
        ← 돌아가기
      </a>

      {nearCfg && !open && (
        <div style={{ position: 'fixed', bottom: 48, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
          <button type="button" onClick={() => setOpen(nearCfg.id)} style={{ background: 'rgba(255,255,255,0.96)', border: '2px solid rgba(0,0,0,0.12)', borderRadius: 28, padding: '12px 28px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
            {nearCfg.emoji} {nearCfg.label} [E]
          </button>
        </div>
      )}
      {open && <Modal id={open} close={() => setOpen(null)} />}
    </div>
  )
}
