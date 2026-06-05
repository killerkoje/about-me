'use client'
import { useState } from 'react'
import { Plus, GitBranch, Loader2, ChevronLeft, Sparkles } from 'lucide-react'
import ProjectForm from './ProjectForm'
import { createProject } from '@/app/(dashboard)/dashboard/projects/actions'
import { getMyRepos, analyzeRepo } from '@/app/(dashboard)/dashboard/github/actions'
import type { GithubRepo } from '@/lib/github/api'
import type { Project } from '@/lib/types'

type Mode = 'manual' | 'github-list' | 'github-analyzing' | 'github-form'

export default function AddProjectButton() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('manual')
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [repoError, setRepoError] = useState<string | null>(null)
  const [analyzingRepo, setAnalyzingRepo] = useState<string | null>(null)
  const [prefilled, setPrefilled] = useState<Partial<Project> | undefined>(undefined)

  function handleOpen() {
    setOpen(true)
    setMode('manual')
    setRepos([])
    setRepoError(null)
    setPrefilled(undefined)
    setAnalyzingRepo(null)
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

  async function handleSelectRepo(repo: GithubRepo) {
    setAnalyzingRepo(repo.name)
    setMode('github-analyzing')
    setRepoError(null)
    try {
      const analysis = await analyzeRepo(repo.full_name)
      setPrefilled({
        title: analysis.title,
        description: analysis.description,
        tech_stack: analysis.tech_stack,
        github_url: analysis.github_url,
        demo_url: analysis.demo_url,
        status: 'wip',
      })
      setMode('github-form')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '분석에 실패했습니다.'
      // API 키 없으면 기본 정보로 폼 채우기
      if (msg.includes('API 키')) {
        setPrefilled({
          title: repo.name,
          description: repo.description ?? '',
          tech_stack: repo.language ? [repo.language] : [],
          github_url: repo.html_url,
          demo_url: repo.homepage ?? '',
          status: 'wip',
        })
        setMode('github-form')
      } else {
        setRepoError(msg)
        setMode('github-list')
      }
    } finally {
      setAnalyzingRepo(null)
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

        {/* GitHub 레포 목록 */}
        {mode === 'github-list' && (
          <div>
            {repoError && (
              <p className="text-sm text-red-500 text-center py-4 mb-2">{repoError}</p>
            )}
            {loadingRepos && (
              <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">레포 불러오는 중...</span>
              </div>
            )}
            {!loadingRepos && (
              <>
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <Sparkles size={11} /> 레포를 선택하면 커밋 내역을 AI가 분석해서 자동으로 채워줍니다
                </p>
                <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
                  {repos.map(repo => (
                    <button
                      key={repo.id}
                      onClick={() => handleSelectRepo(repo)}
                      className="text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{repo.name}</div>
                        {repo.description && (
                          <p className="text-xs text-gray-500 truncate">{repo.description}</p>
                        )}
                      </div>
                      {repo.language && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex-shrink-0">
                          {repo.language}
                        </span>
                      )}
                      <Sparkles size={13} className="text-indigo-300 group-hover:text-indigo-500 flex-shrink-0 transition-colors" />
                    </button>
                  ))}
                  {repos.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">레포가 없습니다.</p>
                  )}
                </div>
              </>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={handleClose} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2">취소</button>
            </div>
          </div>
        )}

        {/* AI 분석 중 */}
        {mode === 'github-analyzing' && (
          <div className="flex flex-col items-center py-14 gap-4">
            <div className="relative">
              <Loader2 size={32} className="animate-spin text-indigo-400" />
              <Sparkles size={14} className="absolute -top-1 -right-1 text-indigo-500" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900 text-sm">{analyzingRepo} 분석 중...</p>
              <p className="text-xs text-gray-400 mt-1">커밋 내역을 AI가 읽고 포트폴리오 설명을 작성합니다</p>
            </div>
          </div>
        )}

        {/* AI 분석 후 폼 */}
        {mode === 'github-form' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setMode('github-list')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">프로젝트 추가</h2>
                <p className="text-[11px] text-indigo-500 flex items-center gap-1 mt-0.5">
                  <Sparkles size={10} /> AI가 커밋 기반으로 자동 채워드렸어요
                </p>
              </div>
            </div>
            <ProjectForm
              initial={prefilled}
              onSubmit={async data => { await createProject(data); handleClose() }}
              onCancel={handleClose}
            />
          </div>
        )}

      </div>
    </div>
  )
}
