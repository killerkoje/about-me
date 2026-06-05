'use client'
import { useState } from 'react'
import { Plus, GitBranch, Loader2, Search, Check, ChevronRight } from 'lucide-react'
import ProjectForm from './ProjectForm'
import { createProject } from '@/app/(dashboard)/dashboard/projects/actions'
import { getMyRepos, importReposBasic } from '@/app/(dashboard)/dashboard/github/actions'
import type { GithubRepo } from '@/lib/github/api'

type Mode = 'manual' | 'github-list' | 'github-importing' | 'github-done'

export default function AddProjectButton() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('manual')
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [importing, setImporting] = useState(false)
  const [repoError, setRepoError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null)

  function handleOpen() {
    setOpen(true)
    setMode('manual')
    setRepos([])
    setSelected(new Set())
    setRepoError(null)
    setSearch('')
    setResult(null)
  }

  function handleClose() {
    setOpen(false)
  }

  async function handleGithubTab() {
    setMode('github-list')
    if (repos.length > 0) return
    setLoadingRepos(true)
    setRepoError(null)
    try {
      const data = await getMyRepos()
      setRepos(data)
    } catch (e) {
      setRepoError(e instanceof Error ? e.message : '레포 목록을 불러오지 못했습니다.')
    } finally {
      setLoadingRepos(false)
    }
  }

  function toggleRepo(fullName: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(fullName)) next.delete(fullName)
      else next.add(fullName)
      return next
    })
  }

  async function handleImport() {
    if (selected.size === 0) return
    setImporting(true)
    setRepoError(null)
    try {
      const res = await importReposBasic([...selected])
      setResult(res)
      setMode('github-done')
    } catch (e) {
      setRepoError(e instanceof Error ? e.message : '등록에 실패했습니다.')
    } finally {
      setImporting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm"
      >
        <Plus size={15} /> 추가
      </button>
    )
  }

  const filtered = repos.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>

        {/* 탭 헤더 */}
        {(mode === 'manual' || mode === 'github-list') && (
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Plus size={14} /> 직접 입력
            </button>
            <button
              onClick={handleGithubTab}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'github-list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <GitBranch size={14} /> GitHub에서 가져오기
            </button>
          </div>
        )}

        {/* 직접 입력 */}
        {mode === 'manual' && (
          <ProjectForm
            onSubmit={async data => { await createProject(data); handleClose() }}
            onCancel={handleClose}
          />
        )}

        {/* GitHub 레포 목록 — 다중 선택 */}
        {mode === 'github-list' && (
          <div>
            {repoError && <p className="text-sm text-red-500 text-center py-2 mb-2">{repoError}</p>}
            {loadingRepos ? (
              <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">레포 불러오는 중...</span>
              </div>
            ) : (
              <>
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">{repos.length}개 · {selected.size}개 선택됨</p>
                  <button
                    onClick={handleImport}
                    disabled={selected.size === 0 || importing}
                    className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    {importing
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Check size={12} />
                    }
                    등록 ({selected.size})
                  </button>
                </div>

                {/* 검색 */}
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="레포 검색..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                {/* 레포 목록 (체크박스) */}
                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                  {filtered.map(repo => (
                    <label
                      key={repo.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                        selected.has(repo.full_name)
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(repo.full_name)}
                        onChange={() => toggleRepo(repo.full_name)}
                        className="accent-indigo-600 w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{repo.full_name}</div>
                        {repo.description && (
                          <p className="text-xs text-gray-500 truncate">{repo.description}</p>
                        )}
                      </div>
                      {repo.language && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex-shrink-0">
                          {repo.language}
                        </span>
                      )}
                    </label>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">검색 결과가 없습니다.</p>
                  )}
                </div>
              </>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={handleClose} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2">취소</button>
            </div>
          </div>
        )}

        {/* 등록 중 */}
        {mode === 'github-importing' && (
          <div className="flex flex-col items-center py-14 gap-3">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-gray-700">등록 중...</p>
          </div>
        )}

        {/* 완료 */}
        {mode === 'github-done' && result && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <Check size={22} className="text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">등록 완료!</p>
              <p className="text-sm text-gray-500 mt-1">
                {result.added}개 추가됨{result.skipped > 0 ? ` · ${result.skipped}개 이미 존재` : ''}
              </p>
            </div>
            <a
              href="/dashboard/projects"
              onClick={handleClose}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
            >
              프로젝트 확인 <ChevronRight size={14} />
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
