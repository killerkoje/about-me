'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

// ── Toon gradient map (singleton) ─────────────────────────────────────────────
let _gradientMap: THREE.DataTexture | null = null
function getGradientMap(): THREE.DataTexture {
  if (!_gradientMap) {
    const colors = new Uint8Array([80, 150, 240])
    _gradientMap = new THREE.DataTexture(colors, 3, 1, THREE.RedFormat)
    _gradientMap.magFilter = THREE.NearestFilter
    _gradientMap.minFilter = THREE.NearestFilter
    _gradientMap.needsUpdate = true
  }
  return _gradientMap
}

// ── Data ───────────────────────────────────────────────────────────────────────
type HouseId = 'about' | 'projects' | 'skills' | 'contact'

interface HouseConfig {
  id: HouseId
  label: string
  emoji: string
  wallColor: string
  roofColor: string
  doorColor: string
  position: [number, number, number]
}

const HOUSES: HouseConfig[] = [
  { id: 'about',    label: '소개',     emoji: '🏠', wallColor: '#f0d9b5', roofColor: '#7a4a2a', doorColor: '#5c3820', position: [-9, 0, -9] },
  { id: 'projects', label: '프로젝트', emoji: '💻', wallColor: '#b5cff0', roofColor: '#2a4a7a', doorColor: '#1e3860', position: [  9, 0, -9] },
  { id: 'skills',   label: '스킬',     emoji: '⚡', wallColor: '#b5f0c8', roofColor: '#2a7a4a', doorColor: '#1e5830', position: [-9, 0,  9] },
  { id: 'contact',  label: '연락처',   emoji: '📬', wallColor: '#f0b5c8', roofColor: '#7a2a4a', doorColor: '#601e38', position: [  9, 0,  9] },
]

interface TreeData { pos: [number, number, number]; scale: number }
const TREES: TreeData[] = [
  { pos: [-16, 0, -3], scale: 1.1 }, { pos: [-16, 0, 3], scale: 0.9 },
  { pos: [16, 0, -3],  scale: 1.2 }, { pos: [16, 0, 3],  scale: 0.85 },
  { pos: [-3, 0, -16], scale: 1.0 }, { pos: [3, 0, -16], scale: 0.9 },
  { pos: [-3, 0,  16], scale: 1.1 }, { pos: [3, 0,  16], scale: 0.95 },
  { pos: [-13, 0, -13], scale: 1.3 }, { pos: [13, 0, -13], scale: 0.8 },
  { pos: [-13, 0,  13], scale: 1.0 }, { pos: [13, 0,  13], scale: 1.1 },
  { pos: [-4, 0, -4], scale: 0.7 }, { pos: [4, 0, -4], scale: 0.75 },
  { pos: [-4, 0,  4], scale: 0.8 }, { pos: [4, 0,  4], scale: 0.9 },
  { pos: [-20, 0, 0], scale: 1.2 }, { pos: [20, 0, 0], scale: 1.0 },
  { pos: [0, 0, -20], scale: 1.1 }, { pos: [0, 0,  20], scale: 0.9 },
]

// ── 3D Components ──────────────────────────────────────────────────────────────
function Ground() {
  const gm = getGradientMap()
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshToonMaterial color="#6db84a" gradientMap={gm} />
      </mesh>
      {/* Cross path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[70, 3.5]} />
        <meshToonMaterial color="#c8b080" gradientMap={gm} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[3.5, 70]} />
        <meshToonMaterial color="#c8b080" gradientMap={gm} />
      </mesh>
      {/* Center plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[4, 16]} />
        <meshToonMaterial color="#d4c090" gradientMap={gm} />
      </mesh>
    </>
  )
}

function HouseBuilding({ config }: { config: HouseConfig }) {
  const gm = getGradientMap()
  const [x, , z] = config.position
  return (
    <group position={[x, 0, z]}>
      {/* Foundation */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[5.4, 0.24, 5.4]} />
        <meshToonMaterial color="#b8a880" gradientMap={gm} />
      </mesh>
      {/* Walls */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[4.6, 3.3, 4.6]} />
        <meshToonMaterial color={config.wallColor} gradientMap={gm} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 3.95, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[3.6, 2.3, 4]} />
        <meshToonMaterial color={config.roofColor} gradientMap={gm} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.98, 2.33]}>
        <boxGeometry args={[1.1, 2.1, 0.12]} />
        <meshToonMaterial color={config.doorColor} gradientMap={gm} />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.32, 0.9, 2.4]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshToonMaterial color="#d4a820" gradientMap={gm} />
      </mesh>
      {/* Windows */}
      {([-1.3, 1.3] as const).map((wx, i) => (
        <group key={i} position={[wx, 1.9, 2.33]}>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.1]} />
            <meshToonMaterial color="#8ec8e8" gradientMap={gm} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.9, 0.1, 0.05]} />
            <meshToonMaterial color="#fff" gradientMap={gm} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.1, 0.9, 0.05]} />
            <meshToonMaterial color="#fff" gradientMap={gm} />
          </mesh>
        </group>
      ))}
      {/* Name sign */}
      <Html position={[0, 5.6, 0]} center distanceFactor={12}>
        <div style={{
          background: 'rgba(255,255,255,0.92)',
          padding: '5px 12px', borderRadius: '10px',
          fontSize: '13px', fontWeight: 800, color: '#222',
          whiteSpace: 'nowrap', border: '2px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          letterSpacing: '0.04em', pointerEvents: 'none', userSelect: 'none',
        }}>
          {config.emoji} {config.label}
        </div>
      </Html>
    </group>
  )
}

function Tree({ pos, scale }: TreeData) {
  const gm = getGradientMap()
  return (
    <group position={pos} scale={scale}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.18, 0.3, 1.8, 6]} />
        <meshToonMaterial color="#6b4423" gradientMap={gm} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <coneGeometry args={[1.3, 2.4, 7]} />
        <meshToonMaterial color="#2a7a30" gradientMap={gm} />
      </mesh>
      <mesh position={[0, 3.3, 0]}>
        <coneGeometry args={[0.95, 1.9, 7]} />
        <meshToonMaterial color="#339944" gradientMap={gm} />
      </mesh>
      <mesh position={[0, 4.0, 0]}>
        <coneGeometry args={[0.6, 1.4, 7]} />
        <meshToonMaterial color="#3daa55" gradientMap={gm} />
      </mesh>
    </group>
  )
}

function Player({
  keysRef,
  onNearHouseChange,
}: {
  keysRef: React.RefObject<Set<string>>
  onNearHouseChange: (id: HouseId | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()
  const nearRef = useRef<HouseId | null>(null)
  const cbRef = useRef(onNearHouseChange)
  cbRef.current = onNearHouseChange

  const gm = getGradientMap()

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    // Camera forward projected on XZ
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    if (forward.lengthSq() > 0.0001) forward.normalize()

    // Right = rotate forward 90° clockwise in XZ
    const right = new THREE.Vector3(forward.z, 0, -forward.x)

    const keys = keysRef.current
    const dir = new THREE.Vector3()
    if (keys.has('w') || keys.has('arrowup'))    dir.addScaledVector(forward,  1)
    if (keys.has('s') || keys.has('arrowdown'))  dir.addScaledVector(forward, -1)
    if (keys.has('d') || keys.has('arrowright')) dir.addScaledVector(right,    1)
    if (keys.has('a') || keys.has('arrowleft'))  dir.addScaledVector(right,   -1)

    if (dir.lengthSq() > 0.001) {
      dir.normalize()
      group.position.addScaledVector(dir, 8 * delta)
      group.rotation.y = Math.atan2(dir.x, dir.z)
    }

    // Clamp to village bounds
    group.position.x = Math.max(-22, Math.min(22, group.position.x))
    group.position.z = Math.max(-22, Math.min(22, group.position.z))

    // Camera follow (slightly behind + above)
    const tx = group.position.x
    const tz = group.position.z
    camera.position.lerp(new THREE.Vector3(tx, 13, tz + 15), Math.min(1, 7 * delta))
    camera.lookAt(new THREE.Vector3(tx, 1, tz))

    // Proximity check
    let nearest: HouseId | null = null
    let minDist = 5.5
    for (const h of HOUSES) {
      const dx = group.position.x - h.position[0]
      const dz = group.position.z - h.position[2]
      const d = Math.sqrt(dx * dx + dz * dz)
      if (d < minDist) { minDist = d; nearest = h.id }
    }

    if (nearest !== nearRef.current) {
      nearRef.current = nearest
      cbRef.current(nearest)
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Shoes */}
      {([-0.15, 0.15] as const).map((x, i) => (
        <mesh key={i} position={[x, 0.1, 0.06]}>
          <boxGeometry args={[0.2, 0.18, 0.32]} />
          <meshToonMaterial color="#1a1a1a" gradientMap={gm} />
        </mesh>
      ))}
      {/* Legs */}
      {([-0.15, 0.15] as const).map((x, i) => (
        <mesh key={i} position={[x, 0.58, 0]}>
          <boxGeometry args={[0.22, 0.72, 0.22]} />
          <meshToonMaterial color="#2a4a9a" gradientMap={gm} />
        </mesh>
      ))}
      {/* Body */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[0.68, 0.76, 0.38]} />
        <meshToonMaterial color="#4a7bd9" gradientMap={gm} />
      </mesh>
      {/* Arms */}
      {([-0.46, 0.46] as const).map((x, i) => (
        <mesh key={i} position={[x, 1.04, 0]}>
          <boxGeometry args={[0.2, 0.62, 0.22]} />
          <meshToonMaterial color="#4a7bd9" gradientMap={gm} />
        </mesh>
      ))}
      {/* Neck */}
      <mesh position={[0, 1.58, 0]}>
        <boxGeometry args={[0.22, 0.2, 0.22]} />
        <meshToonMaterial color="#f0c090" gradientMap={gm} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[0.48, 0.46, 0.44]} />
        <meshToonMaterial color="#f5c8a0" gradientMap={gm} />
      </mesh>
      {/* Hair top */}
      <mesh position={[0, 2.12, -0.02]}>
        <boxGeometry args={[0.5, 0.22, 0.46]} />
        <meshToonMaterial color="#1a0e08" gradientMap={gm} />
      </mesh>
      {/* Hair front */}
      <mesh position={[0, 2.0, 0.22]}>
        <boxGeometry args={[0.4, 0.16, 0.08]} />
        <meshToonMaterial color="#1a0e08" gradientMap={gm} />
      </mesh>
    </group>
  )
}

// ── Scene ──────────────────────────────────────────────────────────────────────
function VillageScene({ onNearHouseChange }: { onNearHouseChange: (id: HouseId | null) => void }) {
  const keysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase())
    const up   = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  return (
    <>
      <ambientLight intensity={1.6} color="#fff8f0" />
      <directionalLight position={[15, 25, 10]} intensity={2} color="#fff5e0" castShadow />
      <directionalLight position={[-8, 12, -15]} intensity={0.4} color="#c8e8ff" />

      <Ground />
      {HOUSES.map(h => <HouseBuilding key={h.id} config={h} />)}
      {TREES.map((t, i) => <Tree key={i} {...t} />)}
      <Player keysRef={keysRef} onNearHouseChange={onNearHouseChange} />
    </>
  )
}

// ── Modal content ──────────────────────────────────────────────────────────────
const tag: React.CSSProperties = {
  fontSize: '11px', color: '#aaa', letterSpacing: '0.18em',
  textTransform: 'uppercase', fontFamily: 'sans-serif', marginBottom: '8px',
}
const title: React.CSSProperties = {
  fontSize: '30px', fontWeight: 800, color: '#111', margin: '0 0 4px',
}
const sub: React.CSSProperties = { fontSize: '13px', color: '#999', marginBottom: '22px' }

function AboutContent() {
  return <>
    <p style={tag}>🏠 소개</p>
    <h2 style={title}>이희원</h2>
    <p style={sub}>Frontend Developer</p>
    <p style={{ fontSize: '14px', lineHeight: '2.1', color: '#555', whiteSpace: 'pre-line' }}>
      {'제가 만든 서비스에 접속하는 누구나\n설명없이 간편하고 쉽게 이용할 수 있습니다.\n끊임없이 아이디어를 내고 설명이 필요없고\n간편하며 임팩트 있는 서비스를 구성하는\n개발자를 꿈꾸고 있습니다.'}
    </p>
  </>
}

function ProjectsContent({ onClose }: { onClose: () => void }) {
  const items = ['보고팡 프론트엔드', '픽미툰', '두브라이트', '도베덥 교육 플랫폼', '이 포트폴리오']
  return <>
    <p style={tag}>💻 프로젝트</p>
    <h2 style={title}>Projects</h2>
    <p style={sub}>만들어온 것들</p>
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
      {items.map((item, i) => (
        <li key={i} style={{
          padding: '11px 0', borderBottom: '1px solid #f0f0f0',
          fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ color: '#ddd', fontSize: '9px' }}>●</span> {item}
        </li>
      ))}
    </ul>
    <a href="/projects" onClick={onClose} style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      background: '#111', color: 'white', borderRadius: '14px',
      padding: '11px 22px', fontSize: '13px', fontWeight: 700,
      textDecoration: 'none', letterSpacing: '0.03em',
    }}>
      전체 프로젝트 보기 →
    </a>
  </>
}

function SkillsContent() {
  const skills = [
    'React / Next.js', 'TypeScript', 'Vue.js',
    'Three.js / R3F', 'Tailwind CSS', 'Supabase', 'Node.js',
  ]
  return <>
    <p style={tag}>⚡ 스킬</p>
    <h2 style={title}>기술 스택</h2>
    <p style={sub}>주로 쓰는 기술들</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {skills.map((s, i) => (
        <span key={i} style={{
          background: '#f7f7f7', border: '1.5px solid #ebebeb',
          borderRadius: '20px', padding: '8px 16px',
          fontSize: '13px', fontWeight: 600, color: '#333',
        }}>{s}</span>
      ))}
    </div>
  </>
}

function ContactContent() {
  const links = [
    { label: '🐙 GitHub', desc: 'LEEHEEWON123', url: 'https://github.com/LEEHEEWON123' },
    { label: '💼 LinkedIn', desc: '희원 이', url: 'https://www.linkedin.com/in/%ED%9D%AC%EC%9B%90-%EC%9D%B4-a22402360/' },
  ]
  return <>
    <p style={tag}>📬 연락처</p>
    <h2 style={title}>연락하기</h2>
    <p style={sub}>언제든지 환영입니다</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {links.map((l, i) => (
        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', border: '1.5px solid #eee', borderRadius: '16px',
          textDecoration: 'none', color: '#333', fontSize: '14px', fontWeight: 600,
        }}>
          <span>{l.label}</span>
          <span style={{ fontSize: '12px', color: '#bbb' }}>{l.desc} →</span>
        </a>
      ))}
    </div>
  </>
}

function HouseModal({ id, onClose }: { id: HouseId; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.52)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, backdropFilter: 'blur(6px)', padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: '24px', padding: '40px 44px',
          maxWidth: '480px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)', position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: '18px', right: '18px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '18px', color: '#bbb', padding: '4px 8px', borderRadius: '8px',
        }}>✕</button>

        {id === 'about'    && <AboutContent />}
        {id === 'projects' && <ProjectsContent onClose={onClose} />}
        {id === 'skills'   && <SkillsContent />}
        {id === 'contact'  && <ContactContent />}
      </div>
    </div>
  )
}

// ── Export ─────────────────────────────────────────────────────────────────────
export default function VillageWorld() {
  const [nearHouse, setNearHouse] = useState<HouseId | null>(null)
  const [openHouse, setOpenHouse] = useState<HouseId | null>(null)

  const handleNearHouse = useCallback((id: HouseId | null) => setNearHouse(id), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenHouse(null); return }
      if ((e.key === 'e' || e.key === 'E') && nearHouse && !openHouse) setOpenHouse(nearHouse)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nearHouse, openHouse])

  const near = HOUSES.find(h => h.id === nearHouse)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 13, 15], fov: 52 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        shadows
      >
        <fog attach="fog" args={['#9ecce8', 28, 70]} />
        <color attach="background" args={['#9ecce8']} />
        <VillageScene onNearHouseChange={handleNearHouse} />
      </Canvas>

      {/* 돌아가기 */}
      <a href="/" style={{
        position: 'fixed', top: '20px', left: '20px',
        background: 'rgba(255,255,255,0.92)', padding: '8px 18px',
        borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: '#333',
        textDecoration: 'none', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.4)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)', zIndex: 100, letterSpacing: '0.03em',
      }}>
        ← 돌아가기
      </a>

      {/* Title */}
      <div style={{
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.92)', padding: '8px 20px', borderRadius: '20px',
        fontSize: '12px', fontWeight: 800, color: '#222',
        backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.4)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)', zIndex: 100,
        letterSpacing: '0.1em', pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        이희원의 마을
      </div>

      {/* Controls */}
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px',
        background: 'rgba(255,255,255,0.88)', padding: '12px 16px',
        borderRadius: '16px', fontSize: '11px', color: '#666',
        backdropFilter: 'blur(10px)', lineHeight: '1.9', zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)', userSelect: 'none',
      }}>
        <strong style={{ display: 'block', marginBottom: '4px', color: '#333' }}>조작법</strong>
        WASD / 방향키 — 이동<br />
        집 근처에서 E — 들어가기<br />
        ESC — 닫기
      </div>

      {/* Near house prompt */}
      {near && !openHouse && (
        <div style={{
          position: 'fixed', bottom: '76px', left: '50%',
          transform: 'translateX(-50%)', zIndex: 100,
        }}>
          <button
            onClick={() => setOpenHouse(near.id)}
            style={{
              background: 'rgba(255,255,255,0.96)',
              border: '2px solid rgba(0,0,0,0.12)',
              borderRadius: '28px', padding: '12px 28px',
              fontSize: '13px', fontWeight: 800, cursor: 'pointer',
              backdropFilter: 'blur(10px)', letterSpacing: '0.05em', color: '#111',
              boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
            }}
          >
            {near.emoji} {near.label} 들어가기 &nbsp;<span style={{ opacity: 0.45, fontSize: '11px' }}>[E]</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {openHouse && <HouseModal id={openHouse} onClose={() => setOpenHouse(null)} />}
    </div>
  )
}
