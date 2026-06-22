'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

const SCROLL_GAIN = 0.005
const DRAG_GAIN = 0.0038
const SWIPE_THRESHOLD = 32

export function wrapIndex(value: number, length: number) {
  if (length <= 0) return 0
  return ((Math.round(value) % length) + length) % length
}

export function useBookCarouselScroll(
  floatIndex: number,
  setFloatIndex: React.Dispatch<React.SetStateAction<number>>,
  total: number,
) {
  const scroll = useScroll()
  const heroActive = useRef(true)
  const touchStart = useRef<number | null>(null)
  const dragStartX = useRef<number | null>(null)
  const dragStartIndex = useRef(0)
  const floatRef = useRef(floatIndex)

  floatRef.current = floatIndex

  useFrame(() => {
    const offset = Number.isFinite(scroll.offset) ? scroll.offset : 0
    heroActive.current = offset < 0.18
  })

  const applyDelta = useCallback(
    (delta: number) => {
      if (!heroActive.current || total <= 0) return
      setFloatIndex((v) => v + delta)
    },
    [setFloatIndex, total],
  )

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!heroActive.current) return

      const dx =
        Math.abs(e.deltaX) > Math.abs(e.deltaY)
          ? e.deltaX
          : e.shiftKey
            ? e.deltaY
            : 0

      if (Math.abs(dx) < 1) return
      e.preventDefault()
      applyDelta(dx * SCROLL_GAIN)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!heroActive.current) return
      touchStart.current = e.touches[0]?.clientX ?? null
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!heroActive.current || touchStart.current == null) return
      const endX = e.changedTouches[0]?.clientX
      if (endX == null) return
      const dx = endX - touchStart.current
      touchStart.current = null
      if (Math.abs(dx) < SWIPE_THRESHOLD) return
      applyDelta(dx > 0 ? -0.9 : 0.9)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!heroActive.current || e.button !== 0) return
      dragStartX.current = e.clientX
      dragStartIndex.current = floatRef.current
    }

    const onPointerMove = (e: PointerEvent) => {
      if (dragStartX.current == null || !heroActive.current) return
      const dx = e.clientX - dragStartX.current
      if (Math.abs(dx) < 4) return
      setFloatIndex(dragStartIndex.current - dx * DRAG_GAIN)
    }

    const onPointerUp = () => {
      dragStartX.current = null
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [applyDelta, setFloatIndex])

  return wrapIndex(floatIndex, total)
}

/** Must render inside ScrollControls */
export function BookCarouselScrollBridge({
  floatIndex,
  setFloatIndex,
  total,
}: {
  floatIndex: number
  setFloatIndex: React.Dispatch<React.SetStateAction<number>>
  total: number
}) {
  useBookCarouselScroll(floatIndex, setFloatIndex, total)
  return null
}
