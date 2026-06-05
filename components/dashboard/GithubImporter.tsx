'use client'
import { useState } from 'react'
import { GitBranch, Loader2, Check, ChevronRight, RefreshCw, Key } from 'lucide-react'
import { getMyRepos, importSelectedRepos } from '@/app/(dashboard)/dashboard/github/actions'
import type { RepoImportResult } from '@/app/(dashboard)/dashboard/github/actions'
import type { GithubRepo } from '@/lib/github/api'

type Step = 'idle' | 'loading' | 'selecting' | 'importing' | 'done' | 'error'

type Props = {
  hasApiKey: boolean
}

export default function GithubImporter({ hasApiKey }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [results, setResults] = useState<RepoImportResult[]>([])

  async function handleFetchRepos() {
    setStep('loading')
    setErrorMsg(null)
    try {
      const data = await getMyRepos()
      setRepos(data)
      setStep('selecting')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '레포 목록을 불러오지 못했습니다.')
      setStep('error')
    }
  }

  async function handleImport() {
    if (selected.size === 0) return
    setStep('importing')
    setErrorMsg(null)
    try {
      const data = await importSelectedRepos([...selected])
      setResults(data)
      setStep('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '가져오기에 실패했습니다.')
      setStep('error')
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

  function reset() {
    setStep('idle')
    setRepos([])
    setSelected(new Set())
    setErrorMsg(null)
    setResults([])
  }

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center py-16 gap-4 text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
          <Key size={26} className="text-amber-500" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 mb-1">Anthropic API 키가 필요합니다</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            커밋 분석 및 AI 포트폴리오 생성을 위해 먼저 API 키를 등록해주세요.
          </p>
        </div>
        <a
          href="/dashboard/settings"
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Key size={15} /> 설정에서 키 등록하기
        </a>
      </div>
    )
  }

  if (step === 'idle' || step === 'error') {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center">
          <GitBranch size={26} className="text-white" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-gray-900 mb-1">GitHub 레포 분석</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            레포를 선택하면 커밋 내역을 AI가 분석해서<br />
            프로젝트 설명과 스킬을 자동으로 작성합니다.
          </p>
        </div>
        {errorMsg && <p className="text-sm text-red-500 text-center max-w-sm">{errorMsg}</p>}
        <button
          onClick={handleFetchRepos}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <GitBranch size={15} /> 레포 목록 불러오기
        </button>
      </div>
    )
  }

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center py-16 gap-3 text-gray-500">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">GitHub 레포 목록 불러오는 중...</p>
      </div>
    )
  }

  if (step === 'importing') {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
        <p className="text-sm text-gray-700 font-medium">AI가 커밋을 분석하고 있습니다...</p>
        <p className="text-xs text-gray-400">{selected.size}개 레포 처리 중 · 레포당 10~20초 소요</p>
      </div>
    )
  }

  if (step === 'done') {
    const added = results.filter(r => !r.skipped)
    const skipped = results.filter(r => r.skipped)
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Check size={20} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">분석 완료!</h2>
            <p className="text-sm text-gray-500">
              {added.length}개 추가됨{skipped.length > 0 ? ` · ${skipped.length}개 이미 존재` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {added.map(r => (
            <div key={r.repoName} className="border border-gray-100 rounded-2xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch size={14} className="text-gray-400" />
                <span className="font-medium text-sm text-gray-900">{r.repoName}</span>
              </div>
              {r.description && (
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{r.description}</p>
              )}
              {r.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.tech_stack.map(t => (
                    <span key={t} className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {skipped.map(r => (
            <div key={r.repoName} className="border border-gray-100 rounded-2xl p-3 bg-gray-50 flex items-center gap-2">
              <GitBranch size={13} className="text-gray-300" />
              <span className="text-sm text-gray-400">{r.repoName}</span>
              <span className="text-xs text-gray-300 ml-auto">이미 존재</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600">
            <RefreshCw size={12} /> 다시 분석하기
          </button>
          <div className="flex gap-4">
            <a href="/dashboard/projects" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
              프로젝트 확인 <ChevronRight size={14} />
            </a>
            <a href="/dashboard/skills" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
              스킬 확인 <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>
    )
  }

  // selecting
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">레포 선택</h2>
          <p className="text-sm text-gray-500 mt-0.5">{repos.length}개 레포 · {selected.size}개 선택됨</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">취소</button>
          <button
            onClick={handleImport}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            <Check size={14} /> AI 분석 시작 ({selected.size})
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {repos.map(repo => (
          <label
            key={repo.id}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              selected.has(repo.full_name)
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-gray-100 bg-white hover:border-indigo-200'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(repo.full_name)}
              onChange={() => toggleRepo(repo.full_name)}
              className="accent-indigo-600 w-4 h-4 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900">{repo.name}</div>
              {repo.description && (
                <p className="text-xs text-gray-500 truncate">{repo.description}</p>
              )}
            </div>
            {repo.language && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex-shrink-0">
                {repo.language}
              </span>
            )}
            <span className="text-[10px] text-gray-400 flex-shrink-0">★ {repo.stargazers_count}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
