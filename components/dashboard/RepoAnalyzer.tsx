'use client'
import { useState } from 'react'
import {
  GitBranch, Loader2, ChevronLeft, ChevronRight,
  Star, ExternalLink, FileText, Code2, GitCommit, Sparkles, Check,
} from 'lucide-react'
import {
  getMyRepos, fetchSingleRepoData, getRepoCommitsPaged,
  analyzeRepoWithAI, saveProjectFromRepo,
} from '@/app/(dashboard)/dashboard/github/actions'
import type { SingleRepoData, RepoAIAnalysis } from '@/app/(dashboard)/dashboard/github/actions'
import type { GithubRepo } from '@/lib/github/api'

type Step = 'idle' | 'loading-repos' | 'selecting' | 'loading-data' | 'ready' | 'analyzing' | 'analyzed' | 'saved'

const LANG_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-100 text-blue-700',
  JavaScript: 'bg-yellow-100 text-yellow-700',
  Python: 'bg-green-100 text-green-700',
  Rust: 'bg-orange-100 text-orange-700',
  Go: 'bg-cyan-100 text-cyan-700',
  Java: 'bg-red-100 text-red-700',
  Kotlin: 'bg-purple-100 text-purple-700',
  Swift: 'bg-orange-100 text-orange-600',
  Dart: 'bg-sky-100 text-sky-700',
  HTML: 'bg-rose-100 text-rose-700',
  CSS: 'bg-indigo-100 text-indigo-700',
  SCSS: 'bg-pink-100 text-pink-700',
  'C++': 'bg-pink-100 text-pink-700',
  C: 'bg-gray-100 text-gray-700',
  Ruby: 'bg-red-100 text-red-600',
  PHP: 'bg-violet-100 text-violet-700',
  Shell: 'bg-lime-100 text-lime-700',
}

function langColor(name: string) {
  return LANG_COLORS[name] ?? 'bg-gray-100 text-gray-600'
}

export default function RepoAnalyzer() {
  const [step, setStep] = useState<Step>('idle')
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [repoData, setRepoData] = useState<SingleRepoData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [readmeOpen, setReadmeOpen] = useState(false)
  const [commitPage, setCommitPage] = useState(1)
  const [commits, setCommits] = useState<SingleRepoData['commits']>([])
  const [hasMoreCommits, setHasMoreCommits] = useState(false)
  const [loadingCommits, setLoadingCommits] = useState(false)
  const [analysis, setAnalysis] = useState<RepoAIAnalysis | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleStart() {
    setStep('loading-repos')
    setError(null)
    try {
      const data = await getMyRepos()
      setRepos(data)
      setStep('selecting')
    } catch (e) {
      setError(e instanceof Error ? e.message : '레포 목록을 불러오지 못했습니다.')
      setStep('idle')
    }
  }

  async function handleSelectRepo(fullName: string) {
    setSelectedRepo(fullName)
    setStep('loading-data')
    setError(null)
    setRepoData(null)
    setReadmeOpen(false)
    setCommitPage(1)
    try {
      const data = await fetchSingleRepoData(fullName)
      setRepoData(data)
      setCommits(data.commits)
      setHasMoreCommits(data.commits.length === 30)
      setStep('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.')
      setStep('selecting')
    }
  }

  async function loadMoreCommits(page: number) {
    if (!selectedRepo) return
    setLoadingCommits(true)
    try {
      const result = await getRepoCommitsPaged(selectedRepo, page, 30)
      setCommits(result.commits)
      setCommitPage(page)
      setHasMoreCommits(result.hasMore)
    } catch {
      // silently fail
    } finally {
      setLoadingCommits(false)
    }
  }

  function handleBack() {
    setStep('selecting')
    setRepoData(null)
    setError(null)
    setAnalysis(null)
  }

  async function handleAnalyze() {
    if (!selectedRepo) return
    setStep('analyzing')
    setError(null)
    try {
      const result = await analyzeRepoWithAI(selectedRepo)
      setAnalysis(result)
      setStep('analyzed')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 분석에 실패했습니다.')
      setStep('ready')
    }
  }

  async function handleSave() {
    if (!analysis || !selectedRepo) return
    setSaving(true)
    try {
      await saveProjectFromRepo(selectedRepo, analysis.description, analysis.tech_stack)
      setStep('saved')
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // ── idle ──────────────────────────────────────────────────────
  if (step === 'idle') {
    return (
      <div className="flex flex-col items-center py-14 gap-4">
        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center">
          <GitBranch size={26} className="text-white" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-gray-900 mb-1">레포 분석하기</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            레포를 선택하면 커밋 내역, README, 사용 언어를<br />
            불러옵니다. 이후 AI로 포트폴리오 설명을 생성할 수 있습니다.
          </p>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={handleStart}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <GitBranch size={15} /> 레포 목록 불러오기
        </button>
      </div>
    )
  }

  // ── loading repos ─────────────────────────────────────────────
  if (step === 'loading-repos') {
    return (
      <div className="flex flex-col items-center py-14 gap-3 text-gray-500">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">GitHub 레포 목록 불러오는 중...</p>
      </div>
    )
  }

  // ── selecting ─────────────────────────────────────────────────
  if (step === 'selecting') {
    return (
      <div className="max-w-2xl">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900">레포 선택</h2>
          <p className="text-sm text-gray-500 mt-0.5">{repos.length}개 레포 · 분석할 레포를 선택하세요</p>
        </div>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {repos.map(repo => (
            <button
              key={repo.id}
              onClick={() => handleSelectRepo(repo.full_name)}
              className="text-left flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">{repo.name}</div>
                {repo.description && (
                  <p className="text-xs text-gray-500 truncate">{repo.description}</p>
                )}
              </div>
              {repo.language && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium flex-shrink-0 ${langColor(repo.language)}`}>
                  {repo.language}
                </span>
              )}
              <span className="text-[10px] text-gray-400 flex-shrink-0">★ {repo.stargazers_count}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── loading data ──────────────────────────────────────────────
  if (step === 'loading-data') {
    return (
      <div className="flex flex-col items-center py-14 gap-3">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
        <p className="text-sm text-gray-700 font-medium">데이터 수집 중...</p>
        <p className="text-xs text-gray-400">커밋 내역 · README · 사용 언어 가져오는 중</p>
      </div>
    )
  }

  // ── ready (data displayed) ────────────────────────────────────
  if (step === 'ready' && repoData) {
    const totalBytes = Object.values(repoData.languages).reduce((s, b) => s + b, 0)

    return (
      <div className="max-w-2xl flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="text-gray-400 hover:text-gray-600">
              <ChevronLeft size={18} />
            </button>
            <div>
              <h2 className="font-bold text-gray-900 text-base">{repoData.repoName}</h2>
              {repoData.description && (
                <p className="text-sm text-gray-500 mt-0.5">{repoData.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Star size={12} /> {repoData.stars}
            </span>
            <a
              href={repoData.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Languages */}
        <div className="border border-gray-100 rounded-2xl p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Code2 size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">사용 언어</span>
          </div>
          {Object.keys(repoData.languages).length > 0 ? (
            <>
              {/* Bar */}
              <div className="flex h-2 rounded-full overflow-hidden mb-3 gap-0.5">
                {Object.entries(repoData.languages)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([lang, bytes]) => (
                    <div
                      key={lang}
                      style={{ width: `${(bytes / totalBytes) * 100}%` }}
                      className="h-full rounded-sm opacity-70 bg-indigo-500"
                      title={`${lang}: ${((bytes / totalBytes) * 100).toFixed(1)}%`}
                    />
                  ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(repoData.languages)
                  .sort(([, a], [, b]) => b - a)
                  .map(([lang, bytes]) => (
                    <span key={lang} className={`text-xs px-2.5 py-1 rounded-lg font-medium ${langColor(lang)}`}>
                      {lang}
                      <span className="ml-1 opacity-60 text-[10px]">
                        {((bytes / totalBytes) * 100).toFixed(1)}%
                      </span>
                    </span>
                  ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400">언어 정보 없음</p>
          )}
        </div>

        {/* README */}
        <div className="border border-gray-100 rounded-2xl p-4 bg-white">
          <button
            onClick={() => setReadmeOpen(o => !o)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">README</span>
              {repoData.readme && (
                <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">있음</span>
              )}
            </div>
            <ChevronRight
              size={14}
              className={`text-gray-400 transition-transform ${readmeOpen ? 'rotate-90' : ''}`}
            />
          </button>
          {readmeOpen && (
            <div className="mt-3 max-h-64 overflow-y-auto">
              {repoData.readme ? (
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
                  {repoData.readme.slice(0, 3000)}
                  {repoData.readme.length > 3000 && '\n\n... (이하 생략)'}
                </pre>
              ) : (
                <p className="text-xs text-gray-400">README 없음</p>
              )}
            </div>
          )}
        </div>

        {/* Commits */}
        <div className="border border-gray-100 rounded-2xl p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <GitCommit size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">커밋 내역</span>
            <span className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded">{commitPage}페이지</span>
          </div>

          {loadingCommits ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">불러오는 중...</span>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-50">
              {commits.map(c => (
                <div key={`${c.sha}-${c.date}`} className="py-2.5 flex items-start gap-3">
                  <span className="text-[10px] font-mono bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">
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
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <button
              onClick={() => loadMoreCommits(commitPage - 1)}
              disabled={commitPage <= 1 || loadingCommits}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> 이전
            </button>
            <span className="text-xs text-gray-400">{commits.length}개</span>
            <button
              onClick={() => loadMoreCommits(commitPage + 1)}
              disabled={!hasMoreCommits || loadingCommits}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              다음 <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* AI 분석 CTA */}
        <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-5 flex items-center justify-between bg-indigo-50/40">
          <div>
            <p className="font-semibold text-gray-900 text-sm">AI 분석 준비 완료</p>
            <p className="text-xs text-gray-500 mt-0.5">커밋 내역과 README를 기반으로 포트폴리오 설명을 생성합니다</p>
          </div>
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Sparkles size={15} /> AI 분석 시작
          </button>
        </div>

      </div>
    )
  }

  // ── analyzing ─────────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center py-20 gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Sparkles size={28} className="text-indigo-500 animate-pulse" />
          </div>
          <Loader2 size={18} className="animate-spin text-indigo-400 absolute -bottom-1 -right-1" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900">AI가 분석 중입니다...</p>
          <p className="text-sm text-gray-500 mt-1">커밋 내역 · README · 사용 언어를 종합 분석 중</p>
          <p className="text-xs text-gray-400 mt-1">약 10~20초 소요됩니다</p>
        </div>
      </div>
    )
  }

  // ── analyzed ──────────────────────────────────────────────────
  if (step === 'analyzed' && analysis && repoData) {
    return (
      <div className="max-w-2xl flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <button onClick={() => setStep('ready')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h2 className="font-bold text-gray-900 text-base">{repoData.repoName} — AI 분석 결과</h2>
            <p className="text-xs text-indigo-500 flex items-center gap-1 mt-0.5">
              <Sparkles size={10} /> 커밋 내역과 README 기반으로 생성됨
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* 분석 결과 */}
        <div className="border border-indigo-100 rounded-2xl p-5 bg-indigo-50/30">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{analysis.description}</p>
        </div>

        {/* 기술 스택 */}
        {analysis.tech_stack.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">기술 스택</p>
            <div className="flex flex-wrap gap-2">
              {analysis.tech_stack.map(t => (
                <span key={t} className={`text-xs px-2.5 py-1 rounded-lg font-medium ${langColor(t)}`}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* 등록 버튼 */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setStep('ready')}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            데이터로 돌아가기
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            프로젝트로 등록
          </button>
        </div>
      </div>
    )
  }

  // ── saved ─────────────────────────────────────────────────────
  if (step === 'saved' && repoData) {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <Check size={26} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-gray-900 mb-1">등록 완료!</h2>
          <p className="text-sm text-gray-500">{repoData.repoName} 프로젝트가 추가되었습니다</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setStep('selecting'); setRepoData(null); setAnalysis(null); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 border border-gray-200 rounded-xl"
          >
            다른 레포 분석하기
          </button>
          <a
            href="/dashboard/projects"
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            프로젝트 확인 <ChevronRight size={14} />
          </a>
        </div>
      </div>
    )
  }

  return null
}
