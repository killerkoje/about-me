'use client'

import {
  useRef,
  useMemo,
  useContext,
  useEffect,
  type ReactNode,
  type CSSProperties,
} from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useFrame, useThree, context as FiberContext } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

const htmlRoots = new WeakMap<Element, Root>()

function getHtmlRoot(container: Element): Root {
  let root = htmlRoots.get(container)
  if (!root) {
    root = createRoot(container)
    htmlRoots.set(container, root)
  }
  return root
}

/** Scroll html — Strict Mode / HMR에서 createRoot 중복 호출 방지 */
export function StableScrollHtml({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  const state = useScroll()
  const group = useRef<HTMLDivElement>(null)
  const { width, height } = useThree((s) => s.size)
  const fiberState = useContext(FiberContext)
  const root = useMemo(() => getHtmlRoot(state.fixed), [state.fixed])

  useEffect(() => {
    root.render(
      <div
        ref={group}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          willChange: 'transform',
          ...style,
        }}
      >
        <FiberContext.Provider value={fiberState}>{children}</FiberContext.Provider>
      </div>,
    )
  }, [root, fiberState, children, style])

  useFrame(() => {
    const el = group.current
    if (!el || state.delta <= state.eps) return
    const offset = Number.isFinite(state.offset) ? state.offset : 0
    const pages = Math.max(state.pages - 1, 1)
    el.style.transform = state.horizontal
      ? `translate3d(${-width * pages * offset}px,0,0)`
      : `translate3d(0,${height * pages * -offset}px,0)`
  })

  return null
}

export function ScrollBlocker({ active }: { active: boolean }) {
  const state = useScroll()
  useFrame(() => {
    state.el.style.overflow = active ? 'hidden' : ''
  })
  return null
}
