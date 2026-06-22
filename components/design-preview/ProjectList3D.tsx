'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { CaseStudy } from '@/app/design-preview/data'

const ThickCards3D = dynamic(
  () => import('@/components/design-preview/ThickCards3D'),
  { ssr: false },
)

type Props = {
  projects: CaseStudy[]
}

export default function ProjectList3D({ projects }: Props) {
  const router = useRouter()

  const items = projects.map((p, i) => ({
    id: p.id,
    title: p.title,
    subtitle: p.category,
    value: String(i + 1).padStart(2, '0'),
    colorIndex: i,
    variant: i,
  }))

  return (
    <ThickCards3D
      items={items}
      layout="list"
      height="h-[480px]"
      onSelect={(index) => router.push(`/design-preview/${projects[index].id}`)}
    />
  )
}
