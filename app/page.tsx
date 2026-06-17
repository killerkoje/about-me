'use client'

import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      const x = (e.clientX / innerWidth - 0.5) * 12
      const y = (e.clientY / innerHeight - 0.5) * 12
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="flex h-screen font-sans overflow-hidden">
      {/* 왼쪽 패널 */}
      <aside
        className="w-44 flex flex-col gap-8 py-10 px-8 bg-white border-r border-gray-100 shrink-0 z-10"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateX(0)' : 'translateX(-8px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Portfolio</span>
        <nav className="flex flex-col gap-4">
          {[
            { label: 'Github.', href: 'https://github.com/LEEHEEWON123', external: true },
            { label: 'LinkedIn.', href: 'https://www.linkedin.com/in/%ED%9D%AC%EC%9B%90-%EC%9D%B4-a22402360/', external: true },
            { label: 'Projects.', href: '/projects', external: false },
          ].map(({ label, href, external }) => (
            <a
              key={label}
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-sm text-gray-900 relative w-fit group"
            >
              {label}
              <span
                className="absolute -bottom-0.5 left-0 h-px bg-gray-900 transition-all duration-300 ease-out"
                style={{ width: '0%' }}
                onMouseEnter={e => (e.currentTarget.style.width = '100%')}
              />
              <style>{`a:hover span { width: 100% !important; }`}</style>
            </a>
          ))}
        </nav>
        <span className="text-[11px] text-gray-400">leeheewon © 2026</span>
      </aside>

      {/* 오른쪽 패널 */}
      <main className="flex-1 bg-gray-100 flex items-center px-16 py-12 relative overflow-hidden">
        {/* 마우스 패럴랙스 배경 요소 */}
        <div
          ref={mainRef}
          className="absolute inset-0 pointer-events-none"
          style={{ transition: 'transform 0.15s ease-out' }}
        >
          <div className="absolute top-16 right-24 w-48 h-48 rounded-full bg-gray-200/50 blur-3xl" />
          <div className="absolute bottom-24 right-48 w-32 h-32 rounded-full bg-gray-300/30 blur-2xl" />
        </div>

        <div className="max-w-lg relative z-10">
          {/* DEVELOPER 라벨 */}
          <p
            className="text-xs tracking-widest text-gray-400 uppercase mb-6"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
            }}
          >
            Developer
          </p>

          {/* 이름 */}
          <h1
            className="text-5xl font-bold text-gray-900 leading-tight mb-8"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.7s ease 0.25s, transform 0.7s ease 0.25s',
            }}
          >
            이희원입니다.
          </h1>

          {/* 소개글 */}
          <p
            className="text-sm text-gray-500 leading-8"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.7s ease 0.45s, transform 0.7s ease 0.45s',
            }}
          >
            제가 만든 서비스에 접속하는 누구나<br />
            설명없이 간편하고 쉽게 이용할 수 있습니다.<br />
            끊임없이 아이디어를 내고 설명이 필요없고<br />
            간편하며 임팩트 있는 서비스를 구성하는<br />
            개발자를 꿈꾸고 있습니다.
          </p>
        </div>
      </main>
    </div>
  )
}
