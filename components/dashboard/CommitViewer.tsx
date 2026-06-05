'use client'
import { useState } from 'react'
import { GitCommit, Loader2, ChevronLeft, ChevronRight, GitBranch } from 'lucide-react'
import { getMyRepos, getRepoCommitsPaged } from '@/app/(dashboard)/dashboard/github/actions'
import type { CommitItem } from '@/app/(dashboard)/dashboard/github/actions'
import type { GithubRepo } from '@/lib/github/api'

const PER_PAGE = 30

export default function CommitViewer() {
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [commits, setCommits] = useState<CommitItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opened, setOpened] = useState(false)

  async function loadRepos() {
    if (repos.length > 0) return
    setLoadingRepos(true)
    try {
      const data = await getMyRepos()
      setRepos(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '레포 목록을 불러오지 못했습니다.')
    } finally {
      setLoadingRepos(false)
    }
  }

  async function loadCommits(repo: string, p: number) {
    if (!repo) return
    setLoading(true)
    setError(null)
    try {
      const result = await getRepoCommitsPaged(repo, p, PER_PAGE)
      setCommits(result.commits)
      setPage(result.page)
      setHasMore(result.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : '커밋을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRepoChange(fullName: string) {
    setSelectedRepo(fullName)
    setPage(1)
    setCommits([])
    setHasMore(false)
    if (fullName) await loadCommits(fullName, 1)
  }

  function handleOpen() {
    setOpened(true)
    loadRepos()
  }

  if (!opened) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:border-gray-300 transition-colors"
      >
        <GitCommit size={15} /> 커밋 내역 조회
      </button>
    )
  }

  return (
    <div className="border border-gray-100 rounded-2xl p-5 bg-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
          <GitCommit size={15} className="text-white" />
        </div>
        <h2 className="font-semibold text-gray-900 text-sm">커밋 내역</h2>
      </div>

      {/* Repo selector */}
      <div className="mb-4">
        {loadingRepos ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin" /> 레포 목록 불러오는 중...
          </div>
        ) : (
          <select
            value={selectedRepo}
            onChange={e => handleRepoChange(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="">레포 선택...</option>
            {repos.map(r => (
              <option key={r.id} value={r.full_name}>{r.full_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Commit list */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">커밋 불러오는 중...</span>
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center py-4">{error}</p>}

      {!loading && commits.length > 0 && (
        <>
          <div className="flex flex-col divide-y divide-gray-50">
            {commits.map(c => (
              <div key={c.sha} className="py-3 flex items-start gap-3">
                <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">
                  {c.sha}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-snug truncate">{c.message}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {c.author} · {new Date(c.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
            <button
              onClick={() => loadCommits(selectedRepo, page - 1)}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} /> 이전
            </button>
            <span className="text-xs text-gray-400">{page}페이지 · {commits.length}개</span>
            <button
              onClick={() => loadCommits(selectedRepo, page + 1)}
              disabled={!hasMore || loading}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              다음 <ChevronRight size={15} />
            </button>
          </div>
        </>
      )}

      {!loading && !error && selectedRepo && commits.length === 0 && (
        <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
          <GitBranch size={20} />
          <p className="text-sm">커밋 내역이 없습니다.</p>
        </div>
      )}

      {!selectedRepo && !loading && (
        <p className="text-sm text-gray-400 text-center py-6">레포를 선택하면 커밋 내역을 볼 수 있습니다.</p>
      )}
    </div>
  )
}
