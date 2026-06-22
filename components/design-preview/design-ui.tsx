import { ReactNode } from 'react'

export const BG = '#dce8d5'
export const ACCENT = '#c8e64a'
export const INK = '#2a2a2a'

export function Section({
  children,
  align = 'end',
  wide = false,
}: {
  children: ReactNode
  align?: 'center' | 'end' | 'start'
  wide?: boolean
}) {
  const justify =
    align === 'center' ? 'justify-center items-center' :
    align === 'start' ? 'justify-start items-start pt-28' :
    'justify-end items-start'

  return (
    <section className={`h-screen flex flex-col px-8 sm:px-14 pt-16 pb-20 ${justify}`}>
      <div className={`w-full pointer-events-auto ${wide ? 'max-w-2xl' : 'max-w-lg'} ${align === 'center' ? 'text-center mx-auto' : ''}`}>
        {children}
      </div>
    </section>
  )
}

/** 텍스트만 — 3D가 주인공일 때 */
export function Ghost({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

/** 콘텐츠가 많을 때만 */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-black/[0.06] p-7 sm:p-8 ${className}`}>
      {children}
    </div>
  )
}

export function Tag({ children, variant = 'edge' }: { children: ReactNode; variant?: 'edge' | 'fill' }) {
  if (variant === 'fill') {
    return (
      <span className="inline-block bg-[#c8e64a] px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase text-[#2a2a2a] mb-4">
        {children}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.32em] uppercase text-[#2a2a2a]/55 mb-5">
      <span className="w-6 h-px bg-[#c8e64a]" aria-hidden />
      {children}
    </span>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.32em] text-[#2a2a2a]/40 uppercase mb-2">
      {children}
    </p>
  )
}

export function Divider() {
  return <div className="h-px bg-black/[0.08] my-8" />
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-black text-[#2a2a2a]">{value}</p>
      <p className="text-[11px] font-semibold text-[#2a2a2a]/45 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  )
}
