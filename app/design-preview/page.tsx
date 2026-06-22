'use client'

import dynamic from 'next/dynamic'

const DesignPreviewWorld = dynamic(
  () => import('@/components/design-preview/DesignPreviewWorld'),
  { ssr: false },
)

export default function DesignPreviewPage() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#dce8d5]">
      <div
        className="pointer-events-none absolute top-0 right-0 w-[42vw] max-w-md h-px bg-[#2a2a2a]/10 origin-top-right rotate-[24deg] translate-x-8"
        aria-hidden
      />
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 sm:px-10 h-14 pointer-events-auto border-b border-[#2a2a2a]/8 bg-[#dce8d5]/80 backdrop-blur-sm">
        <span className="text-[11px] font-black tracking-[0.28em] text-[#2a2a2a] uppercase">
          Kim Jieun
        </span>
        <a
          href="mailto:jieun@design.kr"
          className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#2a2a2a]/45 hover:text-[#2a2a2a] transition-colors"
        >
          Contact
        </a>
      </nav>
      <DesignPreviewWorld />
    </div>
  )
}
