'use client'

import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import BookShelf from './BookShelf'
import type { CaseStudyShelf } from '@/app/design-preview/shelf-data'
import { MINT } from './kokuyo-three-shared'
import { CANVAS_GL, getCanvasDpr } from './canvas-settings'

type Props = {
  projects: CaseStudyShelf[]
  floatIndex: number
  onSelect: (id: string) => void
}

export default function DesignPreviewScene({ projects, floatIndex, onSelect }: Props) {
  const [dpr, setDpr] = useState(1)

  useEffect(() => {
    setDpr(getCanvasDpr())
  }, [])

  return (
    <Canvas
      className="absolute! inset-0 z-5"
      camera={{ position: [0, 0.12, 5.1], fov: 36 }}
      dpr={dpr}
      gl={CANVAS_GL}
      style={{ pointerEvents: 'auto' }}
    >
      <color attach="background" args={[MINT]} />
      <ambientLight intensity={1} />
      <BookShelf projects={projects} floatIndex={floatIndex} onSelect={onSelect} />
    </Canvas>
  )
}
