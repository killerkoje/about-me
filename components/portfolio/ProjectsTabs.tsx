'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PROJECT_META } from '@/lib/projects-meta'
import type { GithubRepo, GithubLanguages } from '@/lib/github/api'

type CompanyGroup = {
  company: string
  repos: GithubRepo[]
}

type Props = {
  companyGroups: CompanyGroup[]
  sideRepos: GithubRepo[]
  companyLanguages: GithubLanguages
  sideLanguages: GithubLanguages
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Dart: '#00B4AB',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  CSS: '#563d7c',
  HTML: '#e34c26',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Shell: '#89e051',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C#': '#178600',
  'C++': '#f34b7d',
  C: '#555555',
  Dockerfile: '#384d54',
}

function getLangColor(lang: string) {
  return LANG_COLORS[lang] ?? '#8b8b8b'
}

function StacksView({
  companyLanguages,
  sideLanguages,
}: {
  companyLanguages: GithubLanguages
  sideLanguages: GithubLanguages
}) {
  function toSorted(langs: GithubLanguages) {
    const total = Object.values(langs).reduce((s, n) => s + n, 0)
    if (total === 0) return []
    return Object.entries(langs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([lang, bytes]) => ({ lang, bytes, pct: Math.round((bytes / total) * 100) }))
  }

  const company = toSorted(companyLanguages)
  const side = toSorted(sideLanguages)

  function Section({ title, items }: { title: string; items: ReturnType<typeof toSorted> }) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">{title}</h3>
        {items.length === 0 ? (
          <p className="text-xs text-gray-400">데이터 없음</p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(({ lang, pct }) => (
              <div key={lang}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: getLangColor(lang) }}
                    />
                    <span className="text-xs font-medium text-gray-800">{lang}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 tabular-nums">{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: getLangColor(lang) }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Section title="Company Stack" items={company} />
      <Section title="Side Project Stack" items={side} />
    </div>
  )
}

function RepoCard({ repo }: { repo: GithubRepo }) {
  const meta = PROJECT_META[repo.name]
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-300 transition-all flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-900 truncate">{repo.name}</span>
        {repo.private && (
          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">private</span>
        )}
      </div>
      <p className="text-xs text-gray-500 leading-5 mb-3 line-clamp-2">
        {meta?.description ?? repo.description ?? ''}
      </p>
      {meta?.highlights && (
        <ul className="flex flex-col gap-1 mb-4">
          {meta.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-500">
              <span className="mt-0.5 shrink-0 text-gray-300">●</span>
              {h}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          {repo.language && <span className="text-[11px] text-gray-400">{repo.language}</span>}
          {repo.stargazers_count > 0 && <span className="text-[11px] text-gray-400">★ {repo.stargazers_count}</span>}
        </div>
        {meta && (
          <Link href={`/projects/${repo.name}`} className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
            자세히 보기 →
          </Link>
        )}
      </div>
    </div>
  )
}

export default function ProjectsTabs({ companyGroups, sideRepos, companyLanguages, sideLanguages }: Props) {
  const [active, setActive] = useState<'company' | 'side' | 'stacks'>('company')
  const companyCount = companyGroups.reduce((sum, g) => sum + g.repos.length, 0)

  const tabs = [
    { key: 'company', label: 'Company', count: companyCount },
    { key: 'side', label: 'Side Projects', count: sideRepos.length },
    { key: 'stacks', label: 'Stacks', count: null },
  ] as const

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 w-fit border border-gray-100 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-5 py-2 rounded-xl text-xs font-medium transition-all ${
              active === tab.key
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`ml-2 text-[10px] tabular-nums ${active === tab.key ? 'text-gray-400' : 'text-gray-300'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {active === 'stacks' ? (
        <StacksView companyLanguages={companyLanguages} sideLanguages={sideLanguages} />
      ) : active === 'company' ? (
        <div className="flex flex-col gap-8">
          {companyGroups.map(group => (
            <section key={group.company}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                {group.company}
                <span className="ml-2 text-[10px] text-gray-300 tabular-nums">{group.repos.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.repos.map(repo => <RepoCard key={repo.id} repo={repo} />)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sideRepos.map(repo => <RepoCard key={repo.id} repo={repo} />)}
        </div>
      )}
    </div>
  )
}
