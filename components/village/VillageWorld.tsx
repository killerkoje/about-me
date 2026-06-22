'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { EffectComposer, Outline } from '@react-three/postprocessing'
import { Selection, Select } from '@react-three/postprocessing'
import * as THREE from 'three'

// ── Sharp 2-step cel-shading gradient ─────────────────────────────────────────
let _gm: THREE.DataTexture | null = null
function getGM(): THREE.DataTexture {
  if (!_gm) {
    const d = new Uint8Array([48, 255])
    _gm = new THREE.DataTexture(d, 2, 1, THREE.RedFormat)
    _gm.magFilter = THREE.NearestFilter
    _gm.minFilter = THREE.NearestFilter
    _gm.needsUpdate = true
  }
  return _gm
}

type V3 = [number, number, number]

// ── Data ───────────────────────────────────────────────────────────────────────
type HouseId = 'about' | 'projects' | 'skills' | 'contact'

interface HouseConfig {
  id: HouseId
  label: string
  emoji: string
  wall: string
  mid: string
  roof: string
  win: string
  door: string
  sign: string
  position: V3
}

const HOUSES: HouseConfig[] = [
  { id: 'about',    label: '소개',     emoji: '🏠', wall: '#e2d6c0', mid: '#c8b898', roof: '#a89878', win: '#9ccce8', door: '#5a3e2a', sign: '#7a5c3a', position: [-11, 0, -11] },
  { id: 'projects', label: '프로젝트', emoji: '💻', wall: '#c8d8e8', mid: '#8aa8c8', roof: '#5a7898', win: '#bce4f8', door: '#283850', sign: '#3a5878', position: [  11, 0, -11] },
  { id: 'skills',   label: '스킬',     emoji: '⚡', wall: '#c0dcc8', mid: '#80b090', roof: '#508060', win: '#a8e0c8', door: '#284030', sign: '#3a6048', position: [-11, 0,  11] },
  { id: 'contact',  label: '연락처',   emoji: '📬', wall: '#e8ccd8', mid: '#c898b0', roof: '#987080', win: '#f0c8d8', door: '#5a2840', sign: '#7a4060', position: [  11, 0,  11] },
]

interface TreeD { pos: V3; s: number }
const TREES: TreeD[] = [
  { pos: [-17, 0, -4], s: 1.1 }, { pos: [-17, 0, 4], s: 0.9 },
  { pos: [17, 0, -4],  s: 1.2 }, { pos: [17, 0, 4],  s: 0.85 },
  { pos: [-4, 0, -17], s: 1.0 }, { pos: [4, 0, -17], s: 0.95 },
  { pos: [-4, 0,  17], s: 1.1 }, { pos: [4, 0,  17], s: 0.9 },
  { pos: [-15, 0, -15], s: 1.3 }, { pos: [15, 0, -15], s: 0.8 },
  { pos: [-15, 0,  15], s: 1.0 }, { pos: [15, 0,  15], s: 1.1 },
  { pos: [-5, 0, -5], s: 0.7 },  { pos: [5, 0, -5], s: 0.8 },
  { pos: [-5, 0,  5], s: 0.75 }, { pos: [5, 0,  5], s: 0.85 },
]

// ── Toon mesh helpers (no BackSide trick — OutlinePass handles it) ─────────────
function TBox({ w, h, d, color, pos, rot }: { w: number; h: number; d: number; color: string; pos?: V3; rot?: V3 }) {
  const gm = getGM()
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshToonMaterial color={color} gradientMap={gm} />
    </mesh>
  )
}

function TCyl({ rt, rb, h, seg = 8, color, pos }: { rt: number; rb: number; h: number; seg?: number; color: string; pos?: V3 }) {
  const gm = getGM()
  return (
    <mesh position={pos} castShadow>
      <cylinderGeometry args={[rt, rb, h, seg]} />
      <meshToonMaterial color={color} gradientMap={gm} />
    </mesh>
  )
}

function TCone({ r, h, seg = 7, color, pos, rot }: { r: number; h: number; seg?: number; color: string; pos?: V3; rot?: V3 }) {
  const gm = getGM()
  return (
    <mesh position={pos} rotation={rot} castShadow>
      <coneGeometry args={[r, h, seg]} />
      <meshToonMaterial color={color} gradientMap={gm} />
    </mesh>
  )
}

// ── Ground ────────────────────────────────────────────────────────────────────
function Ground() {
  const gm = getGM()
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshToonMaterial color="#5aaa3a" gradientMap={gm} />
      </mesh>
      {/* Roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[80, 4.5]} />
        <meshToonMaterial color="#787470" gradientMap={gm} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[4.5, 80]} />
        <meshToonMaterial color="#787470" gradientMap={gm} />
      </mesh>
      {/* Sidewalks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[80, 6.5]} />
        <meshToonMaterial color="#9a9690" gradientMap={gm} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[6.5, 80]} />
        <meshToonMaterial color="#9a9690" gradientMap={gm} />
      </mesh>
      {/* Dashes */}
      {[-18, -12, -6, 6, 12, 18].map((v, i) => (
        <mesh key={`h${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[v, 0.02, 0]}>
          <planeGeometry args={[0.22, 3.2]} />
          <meshToonMaterial color="#e0d890" gradientMap={gm} />
        </mesh>
      ))}
      {[-18, -12, -6, 6, 12, 18].map((v, i) => (
        <mesh key={`v${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, v]}>
          <planeGeometry args={[3.2, 0.22]} />
          <meshToonMaterial color="#e0d890" gradientMap={gm} />
        </mesh>
      ))}
    </group>
  )
}

// ── Urban building ────────────────────────────────────────────────────────────
function UrbanBuilding({ cfg }: { cfg: HouseConfig }) {
  const gm = getGM()
  const [x, , z] = cfg.position
  const bh = 9

  const winRows: V3[] = []
  for (let row = 0; row < 4; row++) {
    const wy = 1.4 + row * 1.8 + 0.9
    winRows.push([-1.5, wy, 2.82], [1.5, wy, 2.82])
  }

  return (
    <group position={[x, 0, z]}>
      {/* Foundation */}
      <TBox w={6.2} h={0.3} d={5.4} color="#b0a890" pos={[0, 0.15, 0]} />
      {/* Main body */}
      <TBox w={6} h={bh} d={5} color={cfg.wall} pos={[0, bh / 2, 0]} />
      {/* Mid stripe */}
      <TBox w={6.1} h={0.28} d={5.1} color={cfg.mid} pos={[0, bh * 0.52, 0]} />
      {/* Roof slab */}
      <TBox w={6.3} h={0.45} d={5.3} color={cfg.roof} pos={[0, bh + 0.22, 0]} />
      {/* Rooftop structures */}
      <TBox w={2} h={1.1} d={1.4} color="#888880" pos={[-1.4, bh + 0.8, 0.6]} />
      <TCyl rt={0.1} rb={0.13} h={2.6} seg={8} color="#707068" pos={[1.8, bh + 1.5, 0.8]} />
      <TBox w={0.5} h={0.45} d={1.2} color="#808878" pos={[0, bh + 0.7, -0.9]} />
      {/* Windows */}
      {winRows.map((wp, i) => (
        <group key={i} position={wp}>
          <mesh castShadow>
            <boxGeometry args={[1.05, 1.35, 0.06]} />
            <meshToonMaterial color={cfg.win} gradientMap={gm} />
          </mesh>
          {/* Reflection */}
          <mesh position={[-0.2, 0.28, 0.04]}>
            <boxGeometry args={[0.28, 0.5, 0.01]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
          </mesh>
        </group>
      ))}
      {/* Entrance */}
      <TBox w={1.4} h={2.4} d={0.14} color={cfg.door} pos={[0, 1.2, 2.57]} />
      <TBox w={1.7} h={0.2} d={0.12} color={cfg.mid} pos={[0, 2.5, 2.56]} />
      {/* Door handle */}
      <mesh position={[0.42, 1.15, 2.66]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#d4a820" />
      </mesh>
      {/* Signboard */}
      <TBox w={3.8} h={0.7} d={0.17} color={cfg.sign} pos={[0, 4.1, 2.64]} />
      {/* Name tag */}
      <Html position={[0, bh + 2.1, 0]} center distanceFactor={14}>
        <div style={{
          background: 'rgba(255,255,255,0.94)',
          padding: '4px 12px', borderRadius: '8px',
          fontSize: '12px', fontWeight: 800, color: '#1a1a1a',
          whiteSpace: 'nowrap', border: '2px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          letterSpacing: '0.05em', pointerEvents: 'none', userSelect: 'none',
        }}>
          {cfg.emoji} {cfg.label}
        </div>
      </Html>
    </group>
  )
}

// ── Tree ──────────────────────────────────────────────────────────────────────
function AniTree({ pos, s }: TreeD) {
  return (
    <group position={pos} scale={s}>
      <TCyl rt={0.14} rb={0.24} h={2} seg={7} color="#5c3a1e" pos={[0, 1, 0]} />
      <TCone r={1.4} h={2.7} seg={7} color="#226630" pos={[0, 2.85, 0]} />
      <TCone r={1.05} h={2.2} seg={7} color="#2e8040" pos={[0, 3.85, 0]} />
      <TCone r={0.68} h={1.8} seg={7} color="#38964c" pos={[0, 4.55, 0]} />
    </group>
  )
}

// ── Utility pole ──────────────────────────────────────────────────────────────
function Pole({ pos }: { pos: V3 }) {
  return (
    <group position={pos}>
      <TCyl rt={0.1} rb={0.14} h={7} seg={7} color="#5a4a3a" pos={[0, 3.5, 0]} />
      <TBox w={1.7} h={0.09} d={0.09} color="#5a4a3a" pos={[0, 6.65, 0]} />
      <TBox w={1.2} h={0.07} d={0.07} color="#5a4a3a" pos={[0, 6.05, 0]} />
    </group>
  )
}

// ── Player ────────────────────────────────────────────────────────────────────
function Player({ keysRef, onNear }: { keysRef: React.RefObject<Set<string>>; onNear: (id: HouseId | null) => void }) {
  const groupRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()
  const nearRef = useRef<HouseId | null>(null)
  const cbRef = useRef(onNear)
  cbRef.current = onNear

  useFrame((_, dt) => {
    const g = groupRef.current
    if (!g) return

    const fwd = new THREE.Vector3()
    camera.getWorldDirection(fwd); fwd.y = 0
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

    const tx = g.position.x, tz = g.position.z
    camera.position.lerp(new THREE.Vector3(tx, 17, tz + 13), Math.min(1, 6 * dt))
    camera.lookAt(new THREE.Vector3(tx, 1.5, tz))

    let nearest: HouseId | null = null, minD = 6
    for (const h of HOUSES) {
      const dx = g.position.x - h.position[0], dz = g.position.z - h.position[2]
      const d = Math.sqrt(dx * dx + dz * dz)
      if (d < minD) { minD = d; nearest = h.id }
    }
    if (nearest !== nearRef.current) { nearRef.current = nearest; cbRef.current(nearest) }
  })

  return (
    <group ref={groupRef}>
      {/* Shoes */}
      <TBox w={0.22} h={0.2} d={0.34} color="#1a1a1a" pos={[-0.15, 0.1, 0.06]} />
      <TBox w={0.22} h={0.2} d={0.34} color="#1a1a1a" pos={[ 0.15, 0.1, 0.06]} />
      {/* Pants */}
      <TBox w={0.25} h={0.78} d={0.25} color="#28356a" pos={[-0.15, 0.58, 0]} />
      <TBox w={0.25} h={0.78} d={0.25} color="#28356a" pos={[ 0.15, 0.58, 0]} />
      {/* Jacket */}
      <TBox w={0.74} h={0.82} d={0.44} color="#d0c8b8" pos={[0, 1.14, 0]} />
      {/* Collar */}
      <TBox w={0.36} h={0.16} d={0.36} color="#e8e0d0" pos={[0, 1.58, 0]} />
      {/* Arms */}
      <TBox w={0.23} h={0.70} d={0.25} color="#d0c8b8" pos={[-0.49, 1.06, 0]} />
      <TBox w={0.23} h={0.70} d={0.25} color="#d0c8b8" pos={[ 0.49, 1.06, 0]} />
      {/* Hands */}
      <TBox w={0.2} h={0.22} d={0.2} color="#f0c8a0" pos={[-0.49, 0.64, 0]} />
      <TBox w={0.2} h={0.22} d={0.2} color="#f0c8a0" pos={[ 0.49, 0.64, 0]} />
      {/* Head */}
      <TBox w={0.50} h={0.50} d={0.47} color="#f5c8a0" pos={[0, 1.90, 0]} />
      {/* Hair */}
      <TBox w={0.52} h={0.24} d={0.49} color="#1a0e08" pos={[0, 2.14, -0.01]} />
      <TBox w={0.42} h={0.18} d={0.1}  color="#1a0e08" pos={[0, 2.01, 0.24]} />
      <TBox w={0.1}  h={0.3}  d={0.3}  color="#1a0e08" pos={[-0.27, 1.87, 0.06]} />
      <TBox w={0.1}  h={0.3}  d={0.3}  color="#1a0e08" pos={[ 0.27, 1.87, 0.06]} />
    </group>
  )
}

// ── Main 3D scene ─────────────────────────────────────────────────────────────
function VillageScene({ onNear }: { onNear: (id: HouseId | null) => void }) {
  const keysRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    const dn = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase())
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [])

  const polePositions: V3[] = [[-7, 0, -7], [7, 0, -7], [-7, 0, 7], [7, 0, 7]]

  return (
    <>
      {/* Lighting: warm sun + cool fill → anime color temperature */}
      <ambientLight intensity={0.55} color="#b8ccee" />
      <directionalLight position={[10, 22, 8]} intensity={2.4} color="#fff2c0" castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5} shadow-camera-far={80}
        shadow-camera-left={-28} shadow-camera-right={28}
        shadow-camera-top={28} shadow-camera-bottom={-28}
      />
      <directionalLight position={[-5, 8, -14]} intensity={0.3} color="#a0c8f8" />

      {/* Sky gradient illusion: big backdrop plane */}
      <mesh position={[0, 20, -50]} rotation={[0.1, 0, 0]}>
        <planeGeometry args={[200, 60]} />
        <meshBasicMaterial color="#5ab8d8" />
      </mesh>
      <mesh position={[0, 8, -50]} rotation={[0.1, 0, 0]}>
        <planeGeometry args={[200, 30]} />
        <meshBasicMaterial color="#78d0e8" />
      </mesh>

      <Selection>
        <EffectComposer multisampling={4} autoClear={false}>
          <Outline
            visibleEdgeColor={0x0d0d14}
            hiddenEdgeColor={0x0d0d14}
            edgeStrength={8}
            width={900}
            blur={false}
          />
        </EffectComposer>

        <Select enabled>
          <Ground />
          {HOUSES.map(h => <UrbanBuilding key={h.id} cfg={h} />)}
          {TREES.map((t, i) => <AniTree key={i} {...t} />)}
          {polePositions.map((p, i) => <Pole key={i} pos={p} />)}
          <Player keysRef={keysRef} onNear={onNear} />
        </Select>
      </Selection>
    </>
  )
}

// ── Modal content ─────────────────────────────────────────────────────────────
const S = {
  tag: { fontSize: '10px', color: '#aaa', letterSpacing: '0.2em', textTransform: 'uppercase' as const, fontFamily: 'sans-serif', marginBottom: '10px' },
  h2:  { fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 4px' as const },
  sub: { fontSize: '13px', color: '#999', marginBottom: '22px' },
}
function AboutContent() {
  return <>
    <p style={S.tag}>🏠 소개</p><h2 style={S.h2}>이희원</h2><p style={S.sub}>Frontend Developer</p>
    <p style={{ fontSize: '14px', lineHeight: '2.1', color: '#555', whiteSpace: 'pre-line' }}>{'제가 만든 서비스에 접속하는 누구나\n설명없이 간편하고 쉽게 이용할 수 있습니다.\n끊임없이 아이디어를 내고 설명이 필요없고\n간편하며 임팩트 있는 서비스를 구성하는\n개발자를 꿈꾸고 있습니다.'}</p>
  </>
}
function ProjectsContent({ close }: { close: () => void }) {
  return <>
    <p style={S.tag}>💻 프로젝트</p><h2 style={S.h2}>Projects</h2><p style={S.sub}>만들어온 것들</p>
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px' }}>
      {['보고팡 프론트엔드', '픽미툰', '두브라이트', '도베덥 교육 플랫폼', '이 포트폴리오'].map((s, i) => (
        <li key={i} style={{ padding: '11px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#ddd', fontSize: '8px' }}>●</span>{s}
        </li>
      ))}
    </ul>
    <a href="/projects" onClick={close} style={{ display: 'inline-flex', alignItems: 'center', background: '#111', color: 'white', borderRadius: '14px', padding: '11px 22px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>전체 프로젝트 보기 →</a>
  </>
}
function SkillsContent() {
  return <>
    <p style={S.tag}>⚡ 스킬</p><h2 style={S.h2}>기술 스택</h2><p style={S.sub}>주로 쓰는 기술들</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {['React / Next.js', 'TypeScript', 'Vue.js', 'Three.js / R3F', 'Tailwind CSS', 'Supabase', 'Node.js'].map((s, i) => (
        <span key={i} style={{ background: '#f7f7f7', border: '1.5px solid #ebebeb', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#333' }}>{s}</span>
      ))}
    </div>
  </>
}
function ContactContent() {
  return <>
    <p style={S.tag}>📬 연락처</p><h2 style={S.h2}>연락하기</h2><p style={S.sub}>언제든지 환영입니다</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[{ label: '🐙 GitHub', url: 'https://github.com/LEEHEEWON123', desc: 'LEEHEEWON123' }, { label: '💼 LinkedIn', url: 'https://www.linkedin.com/in/%ED%9D%AC%EC%9B%90-%EC%9D%B4-a22402360/', desc: '희원 이' }].map((l, i) => (
        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', border: '1.5px solid #eee', borderRadius: '16px', textDecoration: 'none', color: '#333', fontSize: '14px', fontWeight: 600 }}>
          <span>{l.label}</span><span style={{ fontSize: '12px', color: '#bbb' }}>{l.desc} →</span>
        </a>
      ))}
    </div>
  </>
}
function Modal({ id, close }: { id: HouseId; close: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,25,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(7px)', padding: '20px' }} onClick={close}>
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
      <Canvas camera={{ position: [0, 17, 13], fov: 58 }} gl={{ antialias: true, powerPreference: 'high-performance' }} shadows>
        <color attach="background" args={['#78c8e0']} />
        <fog attach="fog" args={['#78c8e0', 32, 78]} />
        <VillageScene onNear={handleNear} />
      </Canvas>

      <a href="/" style={{ position: 'fixed', top: 20, left: 20, background: 'rgba(255,255,255,0.92)', padding: '8px 18px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: '#222', textDecoration: 'none', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 14px rgba(0,0,0,0.1)', zIndex: 100 }}>← 돌아가기</a>
      <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.92)', padding: '8px 22px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, color: '#1a1a1a', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 14px rgba(0,0,0,0.08)', zIndex: 100, letterSpacing: '0.1em', pointerEvents: 'none', whiteSpace: 'nowrap' }}>이희원의 마을</div>
      <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'rgba(255,255,255,0.88)', padding: '12px 16px', borderRadius: '16px', fontSize: '11px', color: '#666', backdropFilter: 'blur(10px)', lineHeight: '1.9', zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', userSelect: 'none' }}>
        <strong style={{ display: 'block', marginBottom: '3px', color: '#333' }}>조작법</strong>
        WASD / 방향키 — 이동<br />건물 근처에서 E — 들어가기<br />ESC — 닫기
      </div>

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
