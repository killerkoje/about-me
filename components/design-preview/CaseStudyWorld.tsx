'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import type { CaseStudy } from '@/app/design-preview/data'
import {
  createBookPortraitTexture,
  INK,
  LIME,
  MINT,
  ORANGE,
  YELLOW,
  PALETTE,
} from './kokuyo-three-shared'
import { mouse, useGlobalMouse } from './mouse-store'
import { Tag } from './design-ui'
import { ArrowLeft, ArrowUpRight, ChevronRight } from 'lucide-react'

const ACCENTS = [LIME, ORANGE, YELLOW]

function DetailBook({ study, index }: { study: CaseStudy; index: number }) {
  const g = useRef<THREE.Group>(null)
  const texture = useMemo(() => createBookPortraitTexture(study, index), [study, index])
  useEffect(() => () => texture.dispose(), [texture])

  const w = 0.68
  const h = 1.22
  const t = 0.018

  useFrame((_, delta) => {
    const dt = Number.isFinite(delta) ? Math.min(delta, 0.05) : 0.016
    if (!g.current) return
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, mouse.x * 0.1, dt * 4)
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, mouse.y * 0.06, dt * 4)
    g.current.position.y = THREE.MathUtils.lerp(g.current.position.y, Math.sin(Date.now() * 0.0012) * 0.02, dt * 3)
  })

  return (
    <group ref={g} position={[0, -0.02, 0]}>
      <mesh position={[0, 0, t / 2 + 0.001]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -(t / 2 + 0.001)]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={ACCENTS[index % 3]} toneMapped={false} />
      </mesh>
      <mesh position={[-w / 2 - 0.004, 0, 0]}>
        <boxGeometry args={[0.008, h * 0.98, t + 0.002]} />
        <meshBasicMaterial color={INK} />
      </mesh>
    </group>
  )
}

function StickerBtn({
  onClick,
  children,
  label,
  variant = 'lime',
}: {
  onClick: () => void
  children: React.ReactNode
  label: string
  variant?: 'lime' | 'ink'
}) {
  const base =
    variant === 'lime'
      ? 'bg-[#c8e64a] text-[#2a2a2a] hover:shadow-[1px_1px_0_#2a2a2a] hover:translate-x-[2px] hover:translate-y-[2px]'
      : 'bg-[#2a2a2a] text-[#dce8d5] hover:bg-transparent hover:text-[#2a2a2a]'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#2a2a2a] text-[11px] font-black tracking-[0.12em] uppercase shadow-[3px_3px_0_#2a2a2a] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150 ${base}`}
    >
      {children}
    </button>
  )
}

function SectionLabel({
  accent,
  children,
  muted = false,
}: {
  accent: string
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 mb-2.5 ${muted ? 'opacity-70' : ''}`}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} aria-hidden />
      <p className="text-[10px] font-black tracking-[0.34em] uppercase opacity-60">
        {children}
      </p>
    </div>
  )
}

type Props = { study: CaseStudy; next: CaseStudy; index: number }

export default function CaseStudyWorld({ study, next, index }: Props) {
  useGlobalMouse()
  const router = useRouter()
  const accent = ACCENTS[index % 3]
  const palette = PALETTE[index % PALETTE.length]
  const num = String(index + 1).padStart(2, '0')
  const insight = study.researchInsights[0]

  return (
    <div className="relative min-h-dvh" style={{ background: MINT }}>
      {/* Background decor */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-24 w-[min(52vw,520px)] h-[min(52vw,520px)] rounded-full opacity-30 blur-3xl"
        style={{ background: accent }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 bottom-12 w-40 h-40 rounded-full border-[3px] border-[#2a2a2a]/10"
      />
      <p
        aria-hidden
        className="pointer-events-none absolute right-4 sm:right-10 top-[18%] text-[clamp(7rem,22vw,16rem)] font-black leading-none tracking-tighter select-none"
        style={{ color: `${accent}33` }}
      >
        {num}
      </p>

      <nav className="sticky top-0 z-50 flex items-center justify-between px-5 sm:px-10 h-[60px] bg-[#dce8d5]/80 backdrop-blur-sm border-b border-[#2a2a2a]/8">
        <StickerBtn onClick={() => router.push('/design-preview')} label="Back to shelf" variant="lime">
          <ArrowLeft size={14} strokeWidth={3} />
          Shelf
        </StickerBtn>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] font-black tracking-[0.28em] text-[#2a2a2a]/35 uppercase">
            Case {num}
          </span>
          <Tag variant="fill">{study.category}</Tag>
        </div>
      </nav>

      <main className="px-5 sm:px-10 lg:px-14 pb-12 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-8 items-start">
        {/* Mobile book */}
        <div className="lg:hidden h-40 shrink-0 pointer-events-none relative order-1">
          <div
            aria-hidden
            className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-32 rounded-full opacity-40 blur-2xl"
            style={{ background: accent }}
          />
          <Canvas camera={{ position: [0, 0.05, 2.5], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true }}>
            <color attach="background" args={['transparent']} />
            <ambientLight intensity={1} />
            <DetailBook study={study} index={index} />
          </Canvas>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 sm:gap-5 order-2 lg:order-1 py-4 lg:py-8">
          <header>
            <p className="text-[11px] font-black tracking-[0.32em] uppercase text-[#2a2a2a]/40 mb-2">
              {study.subtitle}
            </p>
            <h1 className="text-[clamp(1.75rem,4.5vw,3.25rem)] font-black tracking-[-0.03em] leading-[0.95] max-w-[14ch]">
              {study.title}
            </h1>
            <p className="mt-4 text-base sm:text-xl font-bold leading-snug whitespace-pre-line text-[#2a2a2a]/75 max-w-md">
              {study.tagline}
            </p>
          </header>

          <div className="flex flex-wrap gap-2">
            {[study.role, study.timeline].map((item) => (
              <span
                key={item}
                className="inline-flex px-3 py-1 text-[10px] font-bold tracking-wide uppercase bg-white/50 border border-[#2a2a2a]/10 rounded-full text-[#2a2a2a]/60"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {study.tools.slice(0, 4).map((tool) => (
              <span
                key={tool}
                className="px-2.5 py-0.5 text-[9px] font-black tracking-[0.18em] uppercase border-2 border-[#2a2a2a]/15 rounded-md text-[#2a2a2a]/50"
              >
                {tool}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {study.metrics.map((m, i) => (
              <div
                key={m.label}
                className="relative rounded-xl border-2 border-[#2a2a2a] bg-white/60 px-2 py-3 sm:py-4 text-center shadow-[4px_4px_0_#2a2a2a]"
                style={{
                  transform: `rotate(${i === 0 ? -1.5 : i === 2 ? 1.5 : 0}deg)`,
                }}
              >
                <p className="text-xl sm:text-2xl font-black tracking-tight leading-none">{m.value}</p>
                <p className="text-[8px] sm:text-[9px] font-bold mt-2 uppercase tracking-[0.14em] text-[#2a2a2a]/40">
                  {m.label}
                </p>
                {m.change ? (
                  <span
                    className="absolute -top-2 -right-1 px-1.5 py-0.5 text-[8px] font-black rounded-full border border-[#2a2a2a]"
                    style={{ background: accent }}
                  >
                    {m.change}
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div
            className="relative rounded-2xl border-2 border-[#2a2a2a] p-4 sm:p-5 shadow-[5px_5px_0_#2a2a2a]"
            style={{ background: palette.bg, color: palette.ink }}
          >
            <SectionLabel accent={palette.ink === INK ? ORANGE : INK}>Problem</SectionLabel>
            <p className="text-lg sm:text-2xl font-black leading-tight tracking-tight">
              &ldquo;{study.problem}&rdquo;
            </p>
            <p className="mt-3 text-xs sm:text-sm font-medium leading-relaxed opacity-80 line-clamp-2">
              {study.problemDetail}
            </p>
          </div>

          {insight ? (
            <blockquote className="border-l-[3px] pl-4 py-0.5" style={{ borderColor: accent }}>
              <p className="text-sm sm:text-base font-bold leading-relaxed text-[#2a2a2a]/80 italic">
                {insight.quote}
              </p>
              <cite className="not-italic block mt-2 text-[10px] font-bold tracking-wide text-[#2a2a2a]/40">
                — {insight.from}
              </cite>
            </blockquote>
          ) : null}

          <div>
            <SectionLabel accent={accent}>Process</SectionLabel>
            <ul className="grid gap-2">
              {study.processSteps.slice(0, 3).map((s, i) => (
                <li
                  key={s.step}
                  className="flex gap-3 items-start rounded-xl border border-[#2a2a2a]/12 bg-white/45 px-3 py-2.5"
                >
                  <span
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border-2 border-[#2a2a2a] text-[10px] font-black shadow-[2px_2px_0_#2a2a2a]"
                    style={{ background: i === 0 ? accent : 'white' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[11px] font-black uppercase tracking-wide text-[#2a2a2a]/55">
                      {s.step.replace(/^\d+\s+/, '')}
                    </p>
                    <p className="text-xs sm:text-sm leading-relaxed text-[#2a2a2a]/70 mt-0.5 line-clamp-2">
                      {s.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-end justify-between gap-4 pt-1 mt-auto">
            <div>
              <SectionLabel accent={ORANGE}>Result</SectionLabel>
              <p className="text-2xl sm:text-4xl font-black tracking-tight leading-none">{study.result}</p>
              <p className="text-xs sm:text-sm font-bold text-[#2a2a2a]/45 mt-2 max-w-xs">{study.resultSub}</p>
            </div>
            <a
              href={`/design-preview/${next.id}`}
              className="group shrink-0 flex flex-col items-end gap-1 pointer-events-auto"
            >
              <span className="text-[9px] font-black tracking-[0.22em] uppercase text-[#2a2a2a]/35">
                Next case
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-[#2a2a2a] bg-[#2a2a2a] text-[#dce8d5] text-[10px] font-black tracking-[0.14em] uppercase shadow-[3px_3px_0_#2a2a2a] group-hover:shadow-[1px_1px_0_#2a2a2a] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all duration-150">
                {next.title.split(' ')[0]}
                <ChevronRight size={14} strokeWidth={3} />
              </span>
            </a>
          </div>
        </div>

        {/* Desktop 3D — sticky while page scrolls */}
        <div className="relative hidden lg:block lg:sticky lg:top-[72px] lg:self-start order-3 lg:order-2 h-[min(72vh,620px)] w-full pointer-events-none">
          <div
            aria-hidden
            className="absolute w-[min(34vw,380px)] aspect-square rounded-full border-[3px] border-[#2a2a2a]/12"
            style={{ boxShadow: `inset 0 0 0 12px ${accent}22` }}
          />
          <div
            aria-hidden
            className="absolute w-[min(28vw,300px)] aspect-[3/4] rounded-2xl rotate-6 opacity-20"
            style={{ background: accent }}
          />
          <div className="absolute top-8 right-4 flex flex-col items-end gap-1">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#2a2a2a]/30">
              Project
            </span>
            <span className="text-5xl font-black tracking-tighter leading-none" style={{ color: accent }}>
              {num}
            </span>
          </div>
          <div className="w-full h-full">
            <Canvas camera={{ position: [0, 0.05, 2.65], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true }}>
              <color attach="background" args={['transparent']} />
              <ambientLight intensity={1} />
              <DetailBook study={study} index={index} />
            </Canvas>
          </div>
          <a
            href={study.finalImages[0] ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto absolute bottom-6 right-2 inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-[#2a2a2a]/40 hover:text-[#2a2a2a] transition-colors"
          >
            View deliverable
            <ArrowUpRight size={12} strokeWidth={2.5} />
          </a>
        </div>
      </main>
    </div>
  )
}
