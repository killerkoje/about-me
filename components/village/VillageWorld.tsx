'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

// ── 2-step cel shading gradient ───────────────────────────────────────────────
let _gm: THREE.DataTexture | null = null
function getGM(): THREE.DataTexture {
  if (!_gm) {
    const d = new Uint8Array([60, 255]) // just shadow + highlight
    _gm = new THREE.DataTexture(d, 2, 1, THREE.RedFormat)
    _gm.magFilter = THREE.NearestFilter
    _gm.minFilter = THREE.NearestFilter
    _gm.needsUpdate = true
  }
  return _gm
}

// ── Outlined toon primitives ──────────────────────────────────────────────────
type V3 = [number, number, number]

function OBox({
  w, h, d, color, pos, rot, os = 1.035,
}: { w: number; h: number; d: number; color: string; pos?: V3; rot?: V3; os?: number }) {
  const gm = getGM()
  return (
    <group position={pos} rotation={rot}>
      <mesh castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshToonMaterial color={color} gradientMap={gm} />
      </mesh>
      <mesh scale={os}>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial color="#0d0d0f" side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

function OCyl({
  rt, rb, h, seg = 8, color, pos, os = 1.06,
}: { rt: number; rb: number; h: number; seg?: number; color: string; pos?: V3; os?: number }) {
  const gm = getGM()
  return (
    <group position={pos}>
      <mesh castShadow>
        <cylinderGeometry args={[rt, rb, h, seg]} />
        <meshToonMaterial color={color} gradientMap={gm} />
      </mesh>
      <mesh scale={os}>
        <cylinderGeometry args={[rt, rb, h, seg]} />
        <meshBasicMaterial color="#0d0d0f" side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

function OCone({
  r, h, seg = 7, color, pos, rot, os = 1.05,
}: { r: number; h: number; seg?: number; color: string; pos?: V3; rot?: V3; os?: number }) {
  const gm = getGM()
  return (
    <group position={pos} rotation={rot}>
      <mesh castShadow>
        <coneGeometry args={[r, h, seg]} />
        <meshToonMaterial color={color} gradientMap={gm} />
      </mesh>
      <mesh scale={os}>
        <coneGeometry args={[r, h, seg]} />
        <meshBasicMaterial color="#0d0d0f" side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

// ── Data ───────────────────────────────────────────────────────────────────────
type HouseId = 'about' | 'projects' | 'skills' | 'contact'

interface HouseConfig {
  id: HouseId
  label: string
  emoji: string
  wall: string      // main facade
  mid: string       // mid-floor accent stripe
  roof: string      // rooftop slab color
  win: string       // window glass
  door: string      // entrance
  sign: string      // signboard
  position: V3
}

const HOUSES: HouseConfig[] = [
  {
    id: 'about', label: '소개', emoji: '🏠',
    wall: '#e2d6c0', mid: '#c8b898', roof: '#b0a080', win: '#a8d0e8', door: '#5a3e2a', sign: '#7a5c3a',
    position: [-11, 0, -11],
  },
  {
    id: 'projects', label: '프로젝트', emoji: '💻',
    wall: '#c8d8e8', mid: '#8aa8c8', roof: '#5a7898', win: '#c8e4f0', door: '#283850', sign: '#3a5878',
    position: [11, 0, -11],
  },
  {
    id: 'skills', label: '스킬', emoji: '⚡',
    wall: '#c0dcc8', mid: '#80b090', roof: '#508060', win: '#b0e0c8', door: '#284030', sign: '#3a6048',
    position: [-11, 0, 11],
  },
  {
    id: 'contact', label: '연락처', emoji: '📬',
    wall: '#e8ccd8', mid: '#c898b0', roof: '#987080', win: '#f0c8d8', door: '#5a2840', sign: '#7a4060',
    position: [11, 0, 11],
  },
]

interface TreeD { pos: V3; s: number }
const TREES: TreeD[] = [
  { pos: [-17, 0, -4], s: 1.1 }, { pos: [-17, 0, 4], s: 0.9 },
  { pos: [17, 0, -4],  s: 1.2 }, { pos: [17, 0, 4],  s: 0.85 },
  { pos: [-4, 0, -17], s: 1.0 }, { pos: [4, 0, -17], s: 0.95 },
  { pos: [-4, 0,  17], s: 1.1 }, { pos: [4, 0,  17], s: 0.9 },
  { pos: [-15, 0, -15], s: 1.3 }, { pos: [15, 0, -15], s: 0.8 },
  { pos: [-15, 0,  15], s: 1.0 }, { pos: [15, 0,  15], s: 1.1 },
  { pos: [-5, 0, -5], s: 0.7 }, { pos: [5, 0, -5], s: 0.8 },
  { pos: [-5, 0,  5], s: 0.75 }, { pos: [5, 0,  5], s: 0.85 },
]

// ── Ground ────────────────────────────────────────────────────────────────────
function Ground() {
  const gm = getGM()
  return (
    <>
      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshToonMaterial color="#5aaa3a" gradientMap={gm} />
      </mesh>
      {/* Main roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[80, 4]} />
        <meshToonMaterial color="#8a8880" gradientMap={gm} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[4, 80]} />
        <meshToonMaterial color="#8a8880" gradientMap={gm} />
      </mesh>
      {/* Sidewalks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[80, 5.8]} />
        <meshToonMaterial color="#a0a098" gradientMap={gm} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[5.8, 80]} />
        <meshToonMaterial color="#a0a098" gradientMap={gm} />
      </mesh>
      {/* Road center line */}
      {[-18, -12, -6, 6, 12, 18].map((v, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[v, 0.02, 0]}>
          <planeGeometry args={[0.2, 3.5]} />
          <meshToonMaterial color="#e8e0a0" gradientMap={gm} />
        </mesh>
      ))}
      {[-18, -12, -6, 6, 12, 18].map((v, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, v]}>
          <planeGeometry args={[3.5, 0.2]} />
          <meshToonMaterial color="#e8e0a0" gradientMap={gm} />
        </mesh>
      ))}
    </>
  )
}

// ── Urban building (Japanese-style flat-roof) ─────────────────────────────────
function UrbanBuilding({ cfg }: { cfg: HouseConfig }) {
  const gm = getGM()
  const [x, , z] = cfg.position
  const floors = 5
  const bh = floors * 1.8  // building height ~9

  // Window positions: 2 cols × (floors-1) rows
  const winPositions: V3[] = []
  for (let row = 0; row < floors - 1; row++) {
    const wy = 1.2 + row * 1.8 + 0.9
    winPositions.push([-1.5, wy, 2.82])
    winPositions.push([1.5, wy, 2.82])
  }

  return (
    <group position={[x, 0, z]}>
      {/* Foundation slab */}
      <OBox w={6.2} h={0.3} d={5.4} color="#b8b0a0" pos={[0, 0.15, 0]} os={1.02} />

      {/* Main body */}
      <OBox w={6} h={bh} d={5} color={cfg.wall} pos={[0, bh / 2, 0]} os={1.018} />

      {/* Mid-floor accent stripe */}
      <OBox w={6.1} h={0.3} d={5.1} color={cfg.mid} pos={[0, bh * 0.5, 0]} os={1.02} />

      {/* Rooftop slab */}
      <OBox w={6.3} h={0.5} d={5.3} color={cfg.roof} pos={[0, bh + 0.25, 0]} os={1.02} />

      {/* Rooftop structures */}
      <OBox w={2} h={1.2} d={1.5} color="#909088" pos={[-1.4, bh + 0.85, 0.6]} />
      <OCyl rt={0.12} rb={0.15} h={2.5} color="#787870" pos={[1.8, bh + 1.5, 0.8]} />
      <OBox w={0.5} h={0.5} d={1.2} color="#808878" pos={[0, bh + 0.75, -1]} />

      {/* Windows */}
      {winPositions.map((wp, i) => (
        <group key={i} position={wp}>
          {/* Glass */}
          <mesh>
            <boxGeometry args={[1.05, 1.3, 0.06]} />
            <meshToonMaterial color={cfg.win} gradientMap={gm} />
          </mesh>
          {/* Frame outline */}
          <mesh scale={[1.12, 1.1, 2]}>
            <boxGeometry args={[1.05, 1.3, 0.04]} />
            <meshBasicMaterial color="#0d0d0f" side={THREE.BackSide} />
          </mesh>
          {/* Reflection highlight */}
          <mesh position={[-0.22, 0.3, 0.04]}>
            <boxGeometry args={[0.28, 0.55, 0.01]} />
            <meshBasicMaterial color="rgba(255,255,255,0.45)" transparent opacity={0.45} />
          </mesh>
        </group>
      ))}

      {/* Entrance door */}
      <OBox w={1.4} h={2.4} d={0.15} color={cfg.door} pos={[0, 1.2, 2.58]} os={1.05} />
      {/* Door top trim */}
      <OBox w={1.7} h={0.2} d={0.12} color={cfg.mid} pos={[0, 2.5, 2.57]} />
      {/* Door handle */}
      <mesh position={[0.42, 1.15, 2.67]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#d4a820" />
      </mesh>

      {/* Signboard */}
      <OBox w={3.8} h={0.75} d={0.18} color={cfg.sign} pos={[0, 4.1, 2.65]} os={1.04} />

      {/* Floating name tag */}
      <Html position={[0, bh + 2.2, 0]} center distanceFactor={14}>
        <div style={{
          background: 'rgba(255,255,255,0.94)',
          padding: '4px 12px', borderRadius: '8px',
          fontSize: '12px', fontWeight: 800, color: '#1a1a1a',
          whiteSpace: 'nowrap',
          border: '2px solid rgba(0,0,0,0.07)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          letterSpacing: '0.05em',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {cfg.emoji} {cfg.label}
        </div>
      </Html>
    </group>
  )
}

// ── Stylized tree ─────────────────────────────────────────────────────────────
function AniTree({ pos, s }: TreeD) {
  return (
    <group position={pos} scale={s}>
      <OCyl rt={0.15} rb={0.25} h={2} color="#5c3a1e" pos={[0, 1, 0]} />
      <OCone r={1.4} h={2.6} seg={7} color="#246a30" pos={[0, 2.8, 0]} />
      <OCone r={1.05} h={2.2} seg={7} color="#2e8040" pos={[0, 3.8, 0]} />
      <OCone r={0.7} h={1.8} seg={7} color="#38964c" pos={[0, 4.5, 0]} />
    </group>
  )
}

// ── Utility pole (Japanese street feel) ──────────────────────────────────────
function UtilityPole({ pos }: { pos: V3 }) {
  return (
    <group position={pos}>
      <OCyl rt={0.1} rb={0.14} h={7} color="#5a4a3a" pos={[0, 3.5, 0]} />
      <OBox w={1.6} h={0.1} d={0.1} color="#5a4a3a" pos={[0, 6.6, 0]} />
      <OBox w={1.2} h={0.08} d={0.08} color="#5a4a3a" pos={[0, 6.0, 0]} />
    </group>
  )
}

// ── Player ────────────────────────────────────────────────────────────────────
function Player({
  keysRef,
  onNear,
}: {
  keysRef: React.RefObject<Set<string>>
  onNear: (id: HouseId | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()
  const nearRef = useRef<HouseId | null>(null)
  const cbRef = useRef(onNear)
  cbRef.current = onNear

  useFrame((_, dt) => {
    const g = groupRef.current
    if (!g) return

    const fwd = new THREE.Vector3()
    camera.getWorldDirection(fwd)
    fwd.y = 0
    if (fwd.lengthSq() > 0.001) fwd.normalize()
    const rgt = new THREE.Vector3(fwd.z, 0, -fwd.x)

    const k = keysRef.current
    const dir = new THREE.Vector3()
    if (k.has('w') || k.has('arrowup'))    dir.addScaledVector(fwd,  1)
    if (k.has('s') || k.has('arrowdown'))  dir.addScaledVector(fwd, -1)
    if (k.has('d') || k.has('arrowright')) dir.addScaledVector(rgt,  1)
    if (k.has('a') || k.has('arrowleft'))  dir.addScaledVector(rgt, -1)

    if (dir.lengthSq() > 0.001) {
      dir.normalize()
      g.position.addScaledVector(dir, 8 * dt)
      g.rotation.y = Math.atan2(dir.x, dir.z)
    }
    g.position.x = Math.max(-24, Math.min(24, g.position.x))
    g.position.z = Math.max(-24, Math.min(24, g.position.z))

    // Camera follow — higher + slightly behind for good coverage
    const tx = g.position.x, tz = g.position.z
    camera.position.lerp(new THREE.Vector3(tx, 17, tz + 13), Math.min(1, 6 * dt))
    camera.lookAt(new THREE.Vector3(tx, 1.5, tz))

    // Proximity
    let nearest: HouseId | null = null, minD = 6
    for (const h of HOUSES) {
      const dx = g.position.x - h.position[0]
      const dz = g.position.z - h.position[2]
      const d = Math.sqrt(dx * dx + dz * dz)
      if (d < minD) { minD = d; nearest = h.id }
    }
    if (nearest !== nearRef.current) {
      nearRef.current = nearest
      cbRef.current(nearest)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Shoes */}
      <OBox w={0.22} h={0.2} d={0.34} color="#1a1a1a" pos={[-0.15, 0.1, 0.06]} os={1.08} />
      <OBox w={0.22} h={0.2} d={0.34} color="#1a1a1a" pos={[ 0.15, 0.1, 0.06]} os={1.08} />
      {/* Pants */}
      <OBox w={0.24} h={0.76} d={0.24} color="#2a3a6a" pos={[-0.15, 0.58, 0]} os={1.07} />
      <OBox w={0.24} h={0.76} d={0.24} color="#2a3a6a" pos={[ 0.15, 0.58, 0]} os={1.07} />
      {/* Jacket */}
      <OBox w={0.72} h={0.80} d={0.42} color="#d0c8b8" pos={[0, 1.14, 0]} os={1.06} />
      {/* Collar */}
      <OBox w={0.38} h={0.18} d={0.38} color="#e8e0d0" pos={[0, 1.57, 0]} os={1.07} />
      {/* Arms */}
      <OBox w={0.22} h={0.68} d={0.24} color="#d0c8b8" pos={[-0.48, 1.06, 0]} os={1.07} />
      <OBox w={0.22} h={0.68} d={0.24} color="#d0c8b8" pos={[ 0.48, 1.06, 0]} os={1.07} />
      {/* Hands */}
      <OBox w={0.2} h={0.22} d={0.2} color="#f0c8a0" pos={[-0.48, 0.65, 0]} os={1.08} />
      <OBox w={0.2} h={0.22} d={0.2} color="#f0c8a0" pos={[ 0.48, 0.65, 0]} os={1.08} />
      {/* Head */}
      <OBox w={0.50} h={0.50} d={0.46} color="#f5c8a0" pos={[0, 1.90, 0]} os={1.06} />
      {/* Hair */}
      <OBox w={0.52} h={0.24} d={0.48} color="#1a0e08" pos={[0, 2.14, -0.01]} os={1.07} />
      <OBox w={0.42} h={0.18} d={0.1} color="#1a0e08" pos={[0, 2.01, 0.23]} os={1.08} />
      {/* Side hair */}
      <OBox w={0.1} h={0.28} d={0.3} color="#1a0e08" pos={[-0.26, 1.88, 0.06]} os={1.08} />
      <OBox w={0.1} h={0.28} d={0.3} color="#1a0e08" pos={[ 0.26, 1.88, 0.06]} os={1.08} />
    </group>
  )
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function VillageScene({ onNear }: { onNear: (id: HouseId | null) => void }) {
  const keysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const dn = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase())
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [])

  return (
    <>
      {/* Warm sun + cool fill light = anime color temperature */}
      <ambientLight intensity={0.6} color="#c8dcf0" />
      <directionalLight position={[12, 22, 8]} intensity={2.2} color="#fff4d0" castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <directionalLight position={[-6, 8, -12]} intensity={0.35} color="#b0d0f8" />

      <Ground />

      {/* Buildings */}
      {HOUSES.map(h => <UrbanBuilding key={h.id} cfg={h} />)}

      {/* Trees */}
      {TREES.map((t, i) => <AniTree key={i} {...t} />)}

      {/* Utility poles */}
      {([[-7, 0, -7], [7, 0, -7], [-7, 0, 7], [7, 0, 7]] as V3[]).map((p, i) => (
        <UtilityPole key={i} pos={p} />
      ))}

      {/* Player */}
      <Player keysRef={keysRef} onNear={onNear} />
    </>
  )
}

// ── Modal content ─────────────────────────────────────────────────────────────
const S = {
  tag: { fontSize: '10px', color: '#aaa', letterSpacing: '0.2em', textTransform: 'uppercase' as const, fontFamily: 'sans-serif', marginBottom: '10px' },
  h2:  { fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 4px' },
  sub: { fontSize: '13px', color: '#999', marginBottom: '22px' },
}

function AboutContent() {
  return <>
    <p style={S.tag}>🏠 소개</p>
    <h2 style={S.h2}>이희원</h2>
    <p style={S.sub}>Frontend Developer</p>
    <p style={{ fontSize: '14px', lineHeight: '2.1', color: '#555', whiteSpace: 'pre-line' }}>
      {'제가 만든 서비스에 접속하는 누구나\n설명없이 간편하고 쉽게 이용할 수 있습니다.\n끊임없이 아이디어를 내고 설명이 필요없고\n간편하며 임팩트 있는 서비스를 구성하는\n개발자를 꿈꾸고 있습니다.'}
    </p>
  </>
}

function ProjectsContent({ close }: { close: () => void }) {
  return <>
    <p style={S.tag}>💻 프로젝트</p>
    <h2 style={S.h2}>Projects</h2>
    <p style={S.sub}>만들어온 것들</p>
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px' }}>
      {['보고팡 프론트엔드', '픽미툰', '두브라이트', '도베덥 교육 플랫폼', '이 포트폴리오'].map((s, i) => (
        <li key={i} style={{ padding: '11px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#ddd', fontSize: '8px' }}>●</span>{s}
        </li>
      ))}
    </ul>
    <a href="/projects" onClick={close} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#111', color: 'white', borderRadius: '14px', padding: '11px 22px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
      전체 프로젝트 보기 →
    </a>
  </>
}

function SkillsContent() {
  return <>
    <p style={S.tag}>⚡ 스킬</p>
    <h2 style={S.h2}>기술 스택</h2>
    <p style={S.sub}>주로 쓰는 기술들</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {['React / Next.js', 'TypeScript', 'Vue.js', 'Three.js / R3F', 'Tailwind CSS', 'Supabase', 'Node.js'].map((s, i) => (
        <span key={i} style={{ background: '#f7f7f7', border: '1.5px solid #ebebeb', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#333' }}>{s}</span>
      ))}
    </div>
  </>
}

function ContactContent() {
  return <>
    <p style={S.tag}>📬 연락처</p>
    <h2 style={S.h2}>연락하기</h2>
    <p style={S.sub}>언제든지 환영입니다</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[
        { label: '🐙 GitHub', url: 'https://github.com/LEEHEEWON123', desc: 'LEEHEEWON123' },
        { label: '💼 LinkedIn', url: 'https://www.linkedin.com/in/%ED%9D%AC%EC%9B%90-%EC%9D%B4-a22402360/', desc: '희원 이' },
      ].map((l, i) => (
        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', border: '1.5px solid #eee', borderRadius: '16px', textDecoration: 'none', color: '#333', fontSize: '14px', fontWeight: 600 }}>
          <span>{l.label}</span>
          <span style={{ fontSize: '12px', color: '#bbb' }}>{l.desc} →</span>
        </a>
      ))}
    </div>
  </>
}

function Modal({ id, close }: { id: HouseId; close: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,25,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(7px)', padding: '20px' }} onClick={close}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '40px 44px', maxWidth: '480px', width: '100%', maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.25)', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={close} style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#bbb' }}>✕</button>
        {id === 'about'    && <AboutContent />}
        {id === 'projects' && <ProjectsContent close={close} />}
        {id === 'skills'   && <SkillsContent />}
        {id === 'contact'  && <ContactContent />}
      </div>
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function VillageWorld() {
  const [near, setNear] = useState<HouseId | null>(null)
  const [open, setOpen] = useState<HouseId | null>(null)

  const handleNear = useCallback((id: HouseId | null) => setNear(id), [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(null); return }
      if ((e.key === 'e' || e.key === 'E') && near && !open) setOpen(near)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [near, open])

  const nearCfg = HOUSES.find(h => h.id === near)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 17, 13], fov: 58 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        shadows
      >
        {/* Anime teal sky */}
        <color attach="background" args={['#78c8e0']} />
        <fog attach="fog" args={['#78c8e0', 30, 75]} />
        <VillageScene onNear={handleNear} />
      </Canvas>

      {/* HUD */}
      <a href="/" style={{ position: 'fixed', top: 20, left: 20, background: 'rgba(255,255,255,0.92)', padding: '8px 18px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: '#222', textDecoration: 'none', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 14px rgba(0,0,0,0.1)', zIndex: 100 }}>
        ← 돌아가기
      </a>
      <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.92)', padding: '8px 22px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, color: '#1a1a1a', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 14px rgba(0,0,0,0.08)', zIndex: 100, letterSpacing: '0.1em', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
        이희원의 마을
      </div>
      <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'rgba(255,255,255,0.88)', padding: '12px 16px', borderRadius: '16px', fontSize: '11px', color: '#666', backdropFilter: 'blur(10px)', lineHeight: '1.9', zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', userSelect: 'none' }}>
        <strong style={{ display: 'block', marginBottom: '3px', color: '#333' }}>조작법</strong>
        WASD / 방향키 — 이동<br />
        건물 근처에서 E — 들어가기<br />
        ESC — 닫기
      </div>

      {/* Near prompt */}
      {nearCfg && !open && (
        <div style={{ position: 'fixed', bottom: 76, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
          <button onClick={() => setOpen(nearCfg.id)} style={{ background: 'rgba(255,255,255,0.96)', border: '2.5px solid rgba(0,0,0,0.14)', borderRadius: '28px', padding: '12px 30px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', backdropFilter: 'blur(10px)', letterSpacing: '0.06em', color: '#111', boxShadow: '0 6px 28px rgba(0,0,0,0.15)' }}>
            {nearCfg.emoji} {nearCfg.label} 들어가기 <span style={{ opacity: 0.4, fontSize: '10px', marginLeft: '4px' }}>[E]</span>
          </button>
        </div>
      )}

      {open && <Modal id={open} close={() => setOpen(null)} />}
    </div>
  )
}
