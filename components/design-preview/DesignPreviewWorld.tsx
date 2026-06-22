'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { wrapIndex } from './wrap-index'
import { useRouter } from 'next/navigation'
import { CASE_STUDY_SHELF, type CaseStudyShelf } from '@/app/design-preview/shelf-data'
import { INK, MINT } from './kokuyo-three-shared'
import { useGlobalMouse } from './mouse-store'
import { Ghost, Tag } from './design-ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DesignPreviewScene = dynamic(() => import('./DesignPreviewScene'), { ssr: false })

const PROJECTS = CASE_STUDY_SHELF
const SCROLL_GAIN = 0.004

function BookControls({
  index,
  total,
  project,
}: {
  index: number
  total: number
  project: CaseStudyShelf
}) {
  return (
    <div className="mt-8 flex flex-col gap-3 pointer-events-auto max-w-sm">
      <div className="text-left">
        <p className="text-[11px] font-black tracking-[0.28em] uppercase text-[#2a2a2a]/45">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </p>
        <p className="text-sm font-bold mt-1">{project.title}</p>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2a2a2a]/35 leading-relaxed">
        좌우 무한 스크롤 · 앞 책 클릭 →
      </p>
    </div>
  )
}

function NavBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pointer-events-auto flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#c8e64a] border-2 border-[#2a2a2a] text-[#2a2a2a] shadow-[3px_3px_0_#2a2a2a] hover:shadow-[1px_1px_0_#2a2a2a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150 shrink-0"
    >
      {children}
    </button>
  )
}

function ShelfNavButtons({
  onPrev,
  onNext,
  scrollZoneRef,
}: {
  onPrev: () => void
  onNext: () => void
  scrollZoneRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="absolute z-20 top-[50%] -translate-y-1/2 left-[52%] sm:left-[56%] -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 pointer-events-none">
      <NavBtn onClick={onPrev} label="Previous book">
        <ChevronLeft size={20} strokeWidth={3} />
      </NavBtn>
      <div
        ref={scrollZoneRef}
        aria-hidden
        className="w-[min(54vw,380px)] sm:w-[min(52vw,420px)] h-44 sm:h-52 pointer-events-none"
      />
      <NavBtn onClick={onNext} label="Next book">
        <ChevronRight size={20} strokeWidth={3} />
      </NavBtn>
    </div>
  )
}

function HeroOverlay({
  project,
  projectIndex,
}: {
  project: CaseStudyShelf
  projectIndex: number
}) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col justify-center px-8 sm:px-14 pt-16 pb-20 pointer-events-none overflow-hidden"
      style={{ color: INK }}
    >
      <Ghost className="max-w-[min(100%,360px)] pointer-events-auto">
        <Tag>Curiosity is Life</Tag>
        <h1
          className="text-[clamp(3rem,11vw,7rem)] font-black leading-[0.85] tracking-tighter uppercase"
          style={{ WebkitTextStroke: '2px #2a2a2a', color: 'transparent' }}
        >
          Kim
          <br />
          Jieun
        </h1>
        <p className="mt-6 text-lg sm:text-xl font-bold tracking-tight">UX / Product Designer</p>
        <p className="mt-3 text-sm text-[#2a2a2a]/55 max-w-xs leading-relaxed">
          사용자 경험을 데이터와 감각으로 설계합니다.
        </p>
        <BookControls index={projectIndex} total={PROJECTS.length} project={project} />
      </Ghost>
    </div>
  )
}

function pointInZone(zone: HTMLElement, x: number, y: number) {
  const r = zone.getBoundingClientRect()
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
}

function useShelfDragScroll(
  floatIndex: number,
  setFloatIndex: React.Dispatch<React.SetStateAction<number>>,
  zoneRef: React.RefObject<HTMLDivElement | null>,
) {
  const dragStart = useRef<number | null>(null)
  const dragOrigin = useRef(0)
  const dragMoved = useRef(false)
  const floatRef = useRef(floatIndex)
  const inZone = useRef(false)
  floatRef.current = floatIndex

  useEffect(() => {
    const zone = zoneRef.current
    if (!zone) return

    const syncInZone = (x: number, y: number) => {
      inZone.current = pointInZone(zone, x, y)
    }

    const onMouseMove = (e: MouseEvent) => syncInZone(e.clientX, e.clientY)

    const onWheel = (e: WheelEvent) => {
      syncInZone(e.clientX, e.clientY)
      if (!inZone.current) return
      const dx =
        Math.abs(e.deltaX) > Math.abs(e.deltaY)
          ? e.deltaX
          : e.shiftKey
            ? e.deltaY
            : 0
      if (Math.abs(dx) < 1) return
      e.preventDefault()
      setFloatIndex((v) => v + dx * SCROLL_GAIN)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      syncInZone(e.clientX, e.clientY)
      if (!inZone.current) return
      dragStart.current = e.clientX
      dragOrigin.current = floatRef.current
      dragMoved.current = false
    }

    const onPointerMove = (e: PointerEvent) => {
      if (dragStart.current == null) return
      const dx = e.clientX - dragStart.current
      if (Math.abs(dx) < 8) return
      dragMoved.current = true
      setFloatIndex(dragOrigin.current - dx * 0.0035)
    }

    const onPointerUp = () => {
      if (dragStart.current != null && dragMoved.current) {
        setFloatIndex((v) => Math.round(v))
      }
      dragStart.current = null
      dragMoved.current = false
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [setFloatIndex, zoneRef])
}

export default function DesignPreviewWorld() {
  const router = useRouter()
  useGlobalMouse()
  const scrollZoneRef = useRef<HTMLDivElement>(null)
  const [floatIndex, setFloatIndex] = useState(0)
  const activeIndex = wrapIndex(floatIndex, PROJECTS.length)
  const project = PROJECTS[activeIndex]

  useShelfDragScroll(floatIndex, setFloatIndex, scrollZoneRef)

  const goPrev = useCallback(() => {
    setFloatIndex((v) => Math.round(v) - 1)
  }, [])

  const goNext = useCallback(() => {
    setFloatIndex((v) => Math.round(v) + 1)
  }, [])

  const openBook = useCallback(
    (id: string) => {
      router.push(`/design-preview/${id}`)
    },
    [router],
  )

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: MINT }}>
      <HeroOverlay project={project} projectIndex={activeIndex} />
      <ShelfNavButtons onPrev={goPrev} onNext={goNext} scrollZoneRef={scrollZoneRef} />
      <DesignPreviewScene projects={PROJECTS} floatIndex={floatIndex} onSelect={openBook} />
    </div>
  )
}
