import { PROJECT_META } from '@/lib/projects-meta'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ name: string }> }

export default async function ProjectDetailPage({ params }: Props) {
  const { name } = await params
  const meta = PROJECT_META[name]

  if (!meta) notFound()

  return (
    <div className="flex flex-col sm:flex-row min-h-screen font-sans">
      {/* 모바일 상단 헤더 */}
      <header className="flex sm:hidden items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Portfolio</span>
        <nav className="flex items-center gap-4">
          <a href="https://github.com/killerkoje" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900">Github.</a>
          <a href="https://www.linkedin.com/in/%ED%9D%AC%EC%9B%90-%EC%9D%B4-a22402360/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900">LinkedIn.</a>
          <a href="/projects" className="text-xs text-black font-semibold">Projects.</a>
        </nav>
      </header>

      {/* 왼쪽 패널 (데스크톱) */}
      <aside className="hidden sm:flex w-44 flex-col gap-8 py-10 px-8 bg-white border-r border-gray-100 shrink-0">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Portfolio</span>
        <nav className="flex flex-col gap-4">
          <a
            href="https://github.com/killerkoje"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-900 hover:text-black transition-colors duration-200"
          >
            Github.
          </a>
          <a
            href="https://www.linkedin.com/in/%ED%9D%AC%EC%9B%90-%EC%9D%B4-a22402360/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-900 hover:text-black transition-colors duration-200"
          >
            LinkedIn.
          </a>
          <a
            href="/projects"
            className="text-sm text-black font-semibold transition-colors duration-200"
          >
            Projects.
          </a>
        </nav>
        <span className="text-[11px] text-gray-500">leeheewon © 2026</span>
      </aside>

      {/* 오른쪽 - 상세 내용 */}
      <main className="flex-1 bg-gray-100 overflow-y-auto px-6 sm:px-10 py-8 sm:py-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/projects" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              ← back
            </Link>
            <h1 className="text-lg font-bold text-gray-900">{name}</h1>
          </div>

          <p className="text-sm text-gray-500 mb-8">{meta.description}</p>

          <div className="flex flex-col gap-6">
            {meta.details.map((section, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">{section.title}</h2>
                <ul className="flex flex-col gap-2">
                  {section.points.map((point, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-500 leading-6">
                      <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-gray-300" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
