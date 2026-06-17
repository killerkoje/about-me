'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PROJECT_META } from '@/lib/projects-meta'
import type { GithubRepo } from '@/lib/github/api'

type Props = {
  companyRepos: GithubRepo[]
  sideRepos: GithubRepo[]
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

export default function ProjectsTabs({ companyRepos, sideRepos }: Props) {
  const [active, setActive] = useState<'company' | 'side'>('company')

  const tabs = [
    { key: 'company', label: 'Company', count: companyRepos.length },
    { key: 'side', label: 'Side Projects', count: sideRepos.length },
  ] as const

  const repos = active === 'company' ? companyRepos : sideRepos

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-2 mb-8 bg-white rounded-2xl p-1.5 w-fit border border-gray-100 shadow-sm">
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
            <span className={`ml-2 text-[10px] tabular-nums ${active === tab.key ? 'text-gray-400' : 'text-gray-300'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {repos.map(repo => <RepoCard key={repo.id} repo={repo} />)}
      </div>
    </div>
  )
}
