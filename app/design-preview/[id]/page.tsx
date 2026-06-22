'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { CASE_STUDIES } from '../data'

const CaseStudyWorld = dynamic(
  () => import('@/components/design-preview/CaseStudyWorld'),
  { ssr: false },
)

export default function CaseStudyPage() {
  const { id } = useParams<{ id: string }>()
  const p = CASE_STUDIES.find((c) => c.id === id)

  if (!p) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#dce8d5] text-gray-600">
        <p>프로젝트를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const idx = CASE_STUDIES.findIndex((c) => c.id === id)
  const next = CASE_STUDIES[(idx + 1) % CASE_STUDIES.length]

  return <CaseStudyWorld study={p} next={next} index={idx} />
}
